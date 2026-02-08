import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

// ============== API KEY HELPERS ==============

async function getSettingKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

const getAnthropicKey = () => getSettingKey("ANTHROPIC_API_KEY");
const getSerperApiKey = () => getSettingKey("SERPER_API_KEY");
const getPerplexityApiKey = () => getSettingKey("PERPLEXITY_API_KEY");
const getGrokApiKey = () => getSettingKey("GROK_API_KEY");

// ============== INTERFACES ==============

interface EnrichmentResult {
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: { facebook?: string; twitter?: string; instagram?: string } | null;
  president: string | null;
  foundedYear: number | null;
  memberCount: number | null;
  description: string | null;
  confidence: string;
}

interface SourceData {
  source: string;
  snippets: string;
}

// ============== STEP 1: GOOGLE SEARCH (SERPER.DEV) ==============

async function searchGoogle(name: string, city: string, country: string): Promise<SourceData | null> {
  const apiKey = await getSerperApiKey();
  if (!apiKey) {
    console.log("[Enrichment] Serper API key not configured, skipping Google search");
    return null;
  }

  try {
    const query = `"${name}" peña barcelonista ${city} ${country} contact`;
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 8 }),
    });

    if (!res.ok) {
      console.error(`[Enrichment] Serper API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const snippets: string[] = [];

    // Organic results
    if (data.organic) {
      for (const r of data.organic.slice(0, 6)) {
        snippets.push(`[${r.title}] ${r.snippet || ""} (${r.link})`);
      }
    }

    // Knowledge graph
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      const parts = [];
      if (kg.title) parts.push(`Name: ${kg.title}`);
      if (kg.description) parts.push(`Description: ${kg.description}`);
      if (kg.website) parts.push(`Website: ${kg.website}`);
      if (kg.phone) parts.push(`Phone: ${kg.phone}`);
      if (kg.address) parts.push(`Address: ${kg.address}`);
      if (parts.length > 0) snippets.push(`[Knowledge Graph] ${parts.join(" | ")}`);
    }

    if (snippets.length === 0) return null;

    return {
      source: "Google (Serper)",
      snippets: snippets.join("\n"),
    };
  } catch (err) {
    console.error("[Enrichment] Google search error:", err);
    return null;
  }
}

// ============== STEP 2: PERPLEXITY SONAR ==============

async function searchPerplexity(name: string, city: string, country: string, googleContext: string): Promise<SourceData | null> {
  const apiKey = await getPerplexityApiKey();
  if (!apiKey) {
    console.log("[Enrichment] Perplexity API key not configured, skipping");
    return null;
  }

  try {
    const contextHint = googleContext
      ? `\n\nHere is some initial context from web search:\n${googleContext.slice(0, 1000)}`
      : "";

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        web_search_options: { search_context_size: "high" },
        messages: [
          {
            role: "user",
            content: `Find detailed information about this FC Barcelona supporters club (peña barcelonista):
Name: ${name}
City: ${city}
Country: ${country}
${contextHint}

I need: physical address, postal code, email, phone, website, social media links (Facebook, Twitter/X, Instagram), president/leader name, founding year, member count, and a brief description.

Provide all the factual data you can find. Be specific with URLs and contact details.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`[Enrichment] Perplexity API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    // Include citations if available
    let citations = "";
    if (data.citations && Array.isArray(data.citations)) {
      citations = "\nSources: " + data.citations.join(", ");
    }

    return {
      source: "Perplexity Sonar",
      snippets: content + citations,
    };
  } catch (err) {
    console.error("[Enrichment] Perplexity search error:", err);
    return null;
  }
}

// ============== STEP 3: GROK (XAI) ==============

async function searchGrok(name: string, city: string, country: string): Promise<SourceData | null> {
  const apiKey = await getGrokApiKey();
  if (!apiKey) {
    console.log("[Enrichment] Grok API key not configured, skipping");
    return null;
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          {
            role: "user",
            content: `Search the web and find information about this FC Barcelona supporters club (peña barcelonista):
Name: ${name}
City: ${city}
Country: ${country}

I need factual details: address, email, phone, website URL, social media profiles (Facebook, Twitter/X, Instagram), president name, founding year, number of members, and description.

Provide only verified data. Include URLs where possible.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`[Enrichment] Grok API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    return {
      source: "Grok (xAI)",
      snippets: content,
    };
  } catch (err) {
    console.error("[Enrichment] Grok search error:", err);
    return null;
  }
}

// ============== STEP 4: CLAUDE SYNTHESIS ==============

function stripJsonBlock(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
}

async function claudeSynthesize(
  name: string,
  city: string,
  country: string,
  region: string,
  province: string | null,
  sources: SourceData[]
): Promise<EnrichmentResult> {
  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey: anthropicKey });

  const sourcesText = sources.length > 0
    ? sources.map((s) => `--- ${s.source} ---\n${s.snippets}`).join("\n\n")
    : "(No external data sources available - use only your knowledge)";

  const prompt = `You are a data analyst. Synthesize all the information below about this FC Barcelona supporters club (peña barcelonista) into a structured JSON.

PEÑA DETAILS:
Name: ${name}
City: ${city}
${province ? `Province: ${province}` : ""}
Country: ${country}
Region: ${region === "cataluna" ? "Catalunya" : region === "spain" ? "Spain" : "International"}

DATA FROM EXTERNAL SOURCES:
${sourcesText}

INSTRUCTIONS:
- Cross-reference data from different sources to find the most reliable information
- Only include data you are confident about; use null for uncertain fields
- Prefer data that appears in multiple sources
- Validate URLs format (must start with http:// or https://)
- Validate email format (must contain @)
- Phone numbers should include country code if international

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "address": "Full street address or null if unknown",
  "postalCode": "Postal/ZIP code or null if unknown",
  "email": "Contact email or null if unknown",
  "phone": "Phone number or null if unknown",
  "website": "Website URL or null if unknown",
  "socialMedia": { "facebook": "URL or null", "twitter": "URL or null", "instagram": "URL or null" },
  "president": "Current president/leader name or null if unknown",
  "foundedYear": 1990,
  "memberCount": 150,
  "description": "Brief description of the peña (2-3 sentences) or null if unknown",
  "confidence": "high" | "medium" | "low"
}

Set confidence based on how many sources confirmed data:
- "high": 2+ sources agree on key facts
- "medium": 1 source with specific data
- "low": mostly inferred or no external sources available`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(stripJsonBlock(text));
}

// ============== MAIN PIPELINE ==============

export async function enrichPenya(penyaId: string): Promise<{ success: boolean; error?: string; sourcesUsed?: string[] }> {
  const penya = await prisma.penya.findUnique({ where: { id: penyaId } });
  if (!penya) return { success: false, error: "Penya not found" };

  const name = penya.name;
  const city = penya.city;
  const country = penya.country;
  const sourcesUsed: string[] = [];
  const sourceData: SourceData[] = [];

  try {
    // Step 1: Google Search (Serper.dev)
    console.log(`[Enrichment] ${name}: Step 1 - Google Search...`);
    const googleResult = await searchGoogle(name, city, country);
    if (googleResult) {
      sourceData.push(googleResult);
      sourcesUsed.push("Google");
      console.log(`[Enrichment] ${name}: Google returned data`);
    }

    // Step 2: Perplexity Sonar (with Google context)
    console.log(`[Enrichment] ${name}: Step 2 - Perplexity Sonar...`);
    const googleContext = googleResult?.snippets || "";
    const perplexityResult = await searchPerplexity(name, city, country, googleContext);
    if (perplexityResult) {
      sourceData.push(perplexityResult);
      sourcesUsed.push("Perplexity");
      console.log(`[Enrichment] ${name}: Perplexity returned data`);
    }

    // Step 3: Grok (xAI)
    console.log(`[Enrichment] ${name}: Step 3 - Grok...`);
    const grokResult = await searchGrok(name, city, country);
    if (grokResult) {
      sourceData.push(grokResult);
      sourcesUsed.push("Grok");
      console.log(`[Enrichment] ${name}: Grok returned data`);
    }

    // Step 4: Claude synthesis (always runs)
    console.log(`[Enrichment] ${name}: Step 4 - Claude synthesis (${sourceData.length} sources)...`);
    sourcesUsed.push("Claude");
    const parsed = await claudeSynthesize(
      name,
      city,
      country,
      penya.region,
      penya.province,
      sourceData
    );

    // Sanitize social media
    let socialMedia: { facebook?: string; twitter?: string; instagram?: string } | null = null;
    if (parsed.socialMedia) {
      const sm: Record<string, string> = {};
      if (parsed.socialMedia.facebook) sm.facebook = parsed.socialMedia.facebook;
      if (parsed.socialMedia.twitter) sm.twitter = parsed.socialMedia.twitter;
      if (parsed.socialMedia.instagram) sm.instagram = parsed.socialMedia.instagram;
      if (Object.keys(sm).length > 0) socialMedia = sm;
    }

    await prisma.penya.update({
      where: { id: penyaId },
      data: {
        address: parsed.address || null,
        postalCode: parsed.postalCode || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        website: parsed.website || null,
        socialMedia: socialMedia ?? Prisma.DbNull,
        president: parsed.president || null,
        foundedYear: typeof parsed.foundedYear === "number" ? parsed.foundedYear : null,
        memberCount: typeof parsed.memberCount === "number" ? parsed.memberCount : null,
        description: parsed.description || null,
        enrichmentStatus: "enriched",
        detailsUpdatedAt: new Date(),
      },
    });

    console.log(`[Enrichment] ${name}: SUCCESS (sources: ${sourcesUsed.join(", ")})`);
    return { success: true, sourcesUsed };
  } catch (err) {
    console.error("[Enrichment] Pipeline error:", err);
    await prisma.penya.update({
      where: { id: penyaId },
      data: { enrichmentStatus: "failed", detailsUpdatedAt: new Date() },
    });
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", sourcesUsed };
  }
}
