import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

// ============== API KEY HELPERS ==============

async function getSettingKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

const getAnthropicKey = () => getSettingKey("ANTHROPIC_API_KEY");
const getPerplexityApiKey = () => getSettingKey("PERPLEXITY_API_KEY");
const getGrokApiKey = () => getSettingKey("GROK_API_KEY");

// ============== INTERFACES ==============

interface EnrichmentResult {
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: { facebook?: string; twitter?: string; instagram?: string; tiktok?: string } | null;
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

// ============== URL EXTRACTION ==============

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>)\]]+/g;
  const matches = text.match(urlRegex) || [];
  // Deduplicate and clean trailing punctuation
  const cleaned = matches.map(u => u.replace(/[.,;:!?)]+$/, ""));
  return [...new Set(cleaned)];
}

// Domains to skip (not peña websites)
const SKIP_DOMAINS = [
  "facebook.com", "fb.com", "fb.me", "twitter.com", "x.com", "instagram.com",
  "youtube.com", "tiktok.com", "linkedin.com", "wikipedia.org", "wikidata.org",
  "google.com", "fcbarcelona.com", "penyes.fcbarcelona.com",
  "marca.com", "sport.es", "mundodeportivo.com", "as.com",
  "tripadvisor.com", "yelp.com", "maps.google.com",
  "perplexity.ai", "serper.dev", "api.x.ai",
];

function isScrapableUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return !SKIP_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

// ============== WEB SCRAPING ==============

interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  emails: string[];
  phones: string[];
  socialLinks: { facebook?: string; twitter?: string; instagram?: string; tiktok?: string };
  bodyText: string; // First ~2000 chars of visible text
}

async function scrapePage(url: string): Promise<ScrapedPage | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FriendsOfBarca/1.0; +https://friendsofbarca.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer noise
    $("script, style, nav, footer, header, noscript, iframe").remove();

    // Title
    const title = $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() || "";

    // Meta description
    const description = $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() || "";

    // Emails from text + mailto links
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyHtml = $.html();
    const emailsFromText = bodyHtml.match(emailRegex) || [];
    const emailsFromLinks: string[] = [];
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const email = href.replace("mailto:", "").split("?")[0].trim();
      if (email) emailsFromLinks.push(email);
    });
    const allEmails = [...new Set([...emailsFromLinks, ...emailsFromText])]
      .filter(e => !e.includes("example.com") && !e.includes("sentry"));

    // Phone numbers from tel: links + text patterns
    const phones: string[] = [];
    $('a[href^="tel:"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const phone = href.replace("tel:", "").trim();
      if (phone) phones.push(phone);
    });
    // Also look for phone patterns in text
    const phoneRegex = /(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g;
    const bodyTextRaw = $("body").text();
    const phonesFromText = bodyTextRaw.match(phoneRegex) || [];
    // Filter: at least 9 digits
    for (const p of phonesFromText) {
      const digits = p.replace(/\D/g, "");
      if (digits.length >= 9 && digits.length <= 15) phones.push(p.trim());
    }
    const uniquePhones = [...new Set(phones)].slice(0, 3);

    // Social media links
    const socialLinks: { facebook?: string; twitter?: string; instagram?: string; tiktok?: string } = {};
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("facebook.com/") && !socialLinks.facebook) {
        socialLinks.facebook = href.split("?")[0];
      }
      if ((href.includes("twitter.com/") || href.includes("x.com/")) && !socialLinks.twitter) {
        socialLinks.twitter = href.split("?")[0];
      }
      if (href.includes("instagram.com/") && !socialLinks.instagram) {
        socialLinks.instagram = href.split("?")[0];
      }
      if (href.includes("tiktok.com/") && !socialLinks.tiktok) {
        socialLinks.tiktok = href.split("?")[0];
      }
    });

    // Visible body text (cleaned)
    const bodyText = $("body").text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);

    return {
      url,
      title,
      description,
      emails: allEmails.slice(0, 5),
      phones: uniquePhones,
      socialLinks,
      bodyText,
    };
  } catch (err) {
    console.error(`[Scrape] Error scraping ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function formatScrapedData(pages: ScrapedPage[]): SourceData | null {
  if (pages.length === 0) return null;

  const parts = pages.map(p => {
    const lines: string[] = [];
    lines.push(`URL: ${p.url}`);
    if (p.title) lines.push(`Page title: ${p.title}`);
    if (p.description) lines.push(`Meta description: ${p.description}`);
    if (p.emails.length > 0) lines.push(`Emails found: ${p.emails.join(", ")}`);
    if (p.phones.length > 0) lines.push(`Phones found: ${p.phones.join(", ")}`);
    if (p.socialLinks.facebook) lines.push(`Facebook: ${p.socialLinks.facebook}`);
    if (p.socialLinks.twitter) lines.push(`Twitter: ${p.socialLinks.twitter}`);
    if (p.socialLinks.instagram) lines.push(`Instagram: ${p.socialLinks.instagram}`);
    if (p.socialLinks.tiktok) lines.push(`TikTok: ${p.socialLinks.tiktok}`);
    if (p.bodyText) lines.push(`Page content (excerpt): ${p.bodyText.slice(0, 1000)}`);
    return lines.join("\n");
  });

  return {
    source: "Web Scraping (direct visit)",
    snippets: parts.join("\n\n---\n\n"),
  };
}

// ============== STEP 1: PERPLEXITY SONAR ==============

async function searchPerplexity(name: string, city: string, country: string): Promise<SourceData | null> {
  const apiKey = await getPerplexityApiKey();
  if (!apiKey) {
    console.log("[Enrichment] Perplexity API key not configured, skipping");
    return null;
  }

  try {
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

I need: their official website URL, physical address, postal code, email, phone, social media links (Facebook, Twitter/X, Instagram, TikTok), president/leader name, founding year, member count, and a brief description.

IMPORTANT: If you find their website URL, make sure to include it. Provide all the factual data you can find. Be specific with URLs and contact details.`,
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

    let citations = "";
    if (data.citations && Array.isArray(data.citations)) {
      citations = "\nSource URLs: " + data.citations.join(", ");
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

// ============== STEP 2: GROK (XAI) ==============

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

I need factual details: their official website URL, address, email, phone, social media profiles (Facebook, Twitter/X, Instagram, TikTok), president name, founding year, number of members, and description.

IMPORTANT: Include the website URL if you find one. Provide only verified data with URLs where possible.`,
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

// ============== STEP 3: SCRAPE DISCOVERED URLS ==============

async function scrapeDiscoveredUrls(
  sourceData: SourceData[],
  penyaName: string
): Promise<{ scrapedSource: SourceData | null; urlsVisited: string[] }> {
  // Collect all URLs mentioned in source data
  const allText = sourceData.map(s => s.snippets).join("\n");
  const urls = extractUrls(allText).filter(isScrapableUrl);

  if (urls.length === 0) {
    console.log(`[Enrichment] ${penyaName}: No scrapable URLs found in source data`);
    return { scrapedSource: null, urlsVisited: [] };
  }

  // Limit to first 3 URLs to avoid excessive scraping
  const toScrape = urls.slice(0, 3);
  console.log(`[Enrichment] ${penyaName}: Scraping ${toScrape.length} URLs: ${toScrape.join(", ")}`);

  const scrapedPages: ScrapedPage[] = [];
  for (const url of toScrape) {
    const page = await scrapePage(url);
    if (page) {
      scrapedPages.push(page);
      console.log(`[Enrichment] ${penyaName}: Scraped ${url} - title: "${page.title}", emails: ${page.emails.length}, phones: ${page.phones.length}`);
    }
    // Small delay between scrapes
    await new Promise(r => setTimeout(r, 500));
  }

  return {
    scrapedSource: formatScrapedData(scrapedPages),
    urlsVisited: toScrape,
  };
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

  const prompt = `You are a data analyst specializing in FC Barcelona supporter clubs. Synthesize all the information below into structured data.

PEÑA DETAILS:
Name: ${name}
City: ${city}
${province ? `Province: ${province}` : ""}
Country: ${country}
Region: ${region === "cataluna" ? "Catalunya" : region === "spain" ? "Spain" : "International"}

DATA FROM SOURCES (including AI search results and direct web scraping):
${sourcesText}

INSTRUCTIONS:
- The "Web Scraping (direct visit)" source contains DATA EXTRACTED DIRECTLY FROM WEBSITES - this is the most reliable source for contact details, emails, phones, and social media links
- Cross-reference all sources. Data from scraped websites takes priority over AI-generated guesses
- Only include data you are confident about; use null for uncertain fields
- For the website field: use the URL that was successfully scraped and is clearly the peña's own site (not a directory or news site)
- Validate URLs format (must start with http:// or https://)
- Validate email format (must contain @)
- Phone numbers should include country code if international
- For description: write it in English, 2-3 sentences based on the real data found

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "address": "Full street address or null if unknown",
  "postalCode": "Postal/ZIP code or null if unknown",
  "email": "Contact email or null if unknown",
  "phone": "Phone number or null if unknown",
  "website": "Website URL or null if unknown",
  "socialMedia": { "facebook": "URL or null", "twitter": "URL or null", "instagram": "URL or null", "tiktok": "URL or null" },
  "president": "Current president/leader name or null if unknown",
  "foundedYear": 1990,
  "memberCount": 150,
  "description": "Brief description based on real data found (2-3 sentences) or null",
  "confidence": "high" | "medium" | "low"
}

Confidence levels:
- "high": scraped website confirmed data, or 2+ sources agree
- "medium": 1 source with specific data, partially confirmed by scraping
- "low": mostly inferred, no website scraped, limited sources`;

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
    // Step 1: Perplexity Sonar (web search)
    console.log(`[Enrichment] ${name}: Step 1 - Perplexity Sonar...`);
    const perplexityResult = await searchPerplexity(name, city, country);
    if (perplexityResult) {
      sourceData.push(perplexityResult);
      sourcesUsed.push("Perplexity");
      console.log(`[Enrichment] ${name}: Perplexity returned data`);
    }

    // Step 2: Grok (xAI web search)
    console.log(`[Enrichment] ${name}: Step 2 - Grok...`);
    const grokResult = await searchGrok(name, city, country);
    if (grokResult) {
      sourceData.push(grokResult);
      sourcesUsed.push("Grok");
      console.log(`[Enrichment] ${name}: Grok returned data`);
    }

    // Step 3: Scrape URLs discovered by Perplexity/Grok
    console.log(`[Enrichment] ${name}: Step 3 - Scraping discovered URLs...`);
    const { scrapedSource, urlsVisited } = await scrapeDiscoveredUrls(sourceData, name);
    if (scrapedSource) {
      sourceData.push(scrapedSource);
      sourcesUsed.push(`Scraping (${urlsVisited.length} URLs)`);
      console.log(`[Enrichment] ${name}: Scraped ${urlsVisited.length} URLs`);
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
    let socialMedia: { facebook?: string; twitter?: string; instagram?: string; tiktok?: string } | null = null;
    if (parsed.socialMedia) {
      const sm: Record<string, string> = {};
      if (parsed.socialMedia.facebook) sm.facebook = parsed.socialMedia.facebook;
      if (parsed.socialMedia.twitter) sm.twitter = parsed.socialMedia.twitter;
      if (parsed.socialMedia.instagram) sm.instagram = parsed.socialMedia.instagram;
      if (parsed.socialMedia.tiktok) sm.tiktok = parsed.socialMedia.tiktok;
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
