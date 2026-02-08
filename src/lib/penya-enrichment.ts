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
  websiteValidation: string | null;
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
  const cleaned = matches.map(u => u.replace(/[.,;:!?)]+$/, ""));
  return [...new Set(cleaned)];
}

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
  bodyText: string;
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

    $("script, style, nav, footer, header, noscript, iframe").remove();

    const title = $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() || "";
    const description = $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() || "";

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

    const phones: string[] = [];
    $('a[href^="tel:"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const phone = href.replace("tel:", "").trim();
      if (phone) phones.push(phone);
    });
    const phoneRegex = /(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g;
    const bodyTextRaw = $("body").text();
    const phonesFromText = bodyTextRaw.match(phoneRegex) || [];
    for (const p of phonesFromText) {
      const digits = p.replace(/\D/g, "");
      if (digits.length >= 9 && digits.length <= 15) phones.push(p.trim());
    }
    const uniquePhones = [...new Set(phones)].slice(0, 3);

    const socialLinks: { facebook?: string; twitter?: string; instagram?: string; tiktok?: string } = {};
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("facebook.com/") && !socialLinks.facebook) socialLinks.facebook = href.split("?")[0];
      if ((href.includes("twitter.com/") || href.includes("x.com/")) && !socialLinks.twitter) socialLinks.twitter = href.split("?")[0];
      if (href.includes("instagram.com/") && !socialLinks.instagram) socialLinks.instagram = href.split("?")[0];
      if (href.includes("tiktok.com/") && !socialLinks.tiktok) socialLinks.tiktok = href.split("?")[0];
    });

    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 4000);

    return { url, title, description, emails: allEmails.slice(0, 5), phones: uniquePhones, socialLinks, bodyText };
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
    if (p.bodyText) lines.push(`Page content (excerpt): ${p.bodyText.slice(0, 2000)}`);
    return lines.join("\n");
  });
  return { source: "Web Scraping (direct visit)", snippets: parts.join("\n\n---\n\n") };
}

// ============== STEP 1: PERPLEXITY SONAR ==============

async function searchPerplexity(name: string, city: string, country: string): Promise<SourceData | null> {
  const apiKey = await getPerplexityApiKey();
  if (!apiKey) { console.log("[Enrichment] Perplexity API key not configured, skipping"); return null; }

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        web_search_options: { search_context_size: "high" },
        messages: [{
          role: "user",
          content: `Find detailed information about this FC Barcelona supporters club (peña barcelonista):
Name: ${name}
City: ${city}
Country: ${country}

I need: their official website URL, physical address, postal code, email, phone, social media links (Facebook, Twitter/X, Instagram, TikTok), president/leader name, founding year, member count, and a brief description.

IMPORTANT: If you find their website URL, make sure to include it. Provide all the factual data you can find.`,
        }],
      }),
    });
    if (!res.ok) { console.error(`[Enrichment] Perplexity API error: ${res.status}`); return null; }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;
    let citations = "";
    if (data.citations && Array.isArray(data.citations)) citations = "\nSource URLs: " + data.citations.join(", ");
    return { source: "Perplexity Sonar", snippets: content + citations };
  } catch (err) { console.error("[Enrichment] Perplexity search error:", err); return null; }
}

// ============== STEP 2: GROK (XAI) ==============

async function searchGrok(name: string, city: string, country: string): Promise<SourceData | null> {
  const apiKey = await getGrokApiKey();
  if (!apiKey) { console.log("[Enrichment] Grok API key not configured, skipping"); return null; }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [{
          role: "user",
          content: `Search the web and find information about this FC Barcelona supporters club (peña barcelonista):
Name: ${name}
City: ${city}
Country: ${country}

I need factual details: their official website URL, address, email, phone, social media profiles (Facebook, Twitter/X, Instagram, TikTok), president name, founding year, number of members, and description.

IMPORTANT: Include the website URL if you find one. Provide only verified data with URLs where possible.`,
        }],
      }),
    });
    if (!res.ok) { console.error(`[Enrichment] Grok API error: ${res.status}`); return null; }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;
    return { source: "Grok (xAI)", snippets: content };
  } catch (err) { console.error("[Enrichment] Grok search error:", err); return null; }
}

// ============== STEP 3: SCRAPE DISCOVERED URLS ==============

async function scrapeDiscoveredUrls(
  sourceData: SourceData[],
  penyaName: string
): Promise<{ scrapedPages: ScrapedPage[]; scrapedSource: SourceData | null }> {
  const allText = sourceData.map(s => s.snippets).join("\n");
  const urls = extractUrls(allText).filter(isScrapableUrl);

  if (urls.length === 0) {
    console.log(`[Enrichment] ${penyaName}: No scrapable URLs found`);
    return { scrapedPages: [], scrapedSource: null };
  }

  const toScrape = urls.slice(0, 3);
  console.log(`[Enrichment] ${penyaName}: Scraping ${toScrape.length} URLs: ${toScrape.join(", ")}`);

  const scrapedPages: ScrapedPage[] = [];
  for (const url of toScrape) {
    const page = await scrapePage(url);
    if (page) {
      scrapedPages.push(page);
      console.log(`[Enrichment] ${penyaName}: Scraped ${url} - title: "${page.title}", emails: ${page.emails.length}, phones: ${page.phones.length}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { scrapedPages, scrapedSource: formatScrapedData(scrapedPages) };
}

// ============== STEP 4: CLAUDE SYNTHESIS + WEBSITE VALIDATION ==============

function stripJsonBlock(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
}

async function claudeSynthesize(
  name: string,
  city: string,
  country: string,
  region: string,
  province: string | null,
  sources: SourceData[],
  scrapedPages: ScrapedPage[]
): Promise<EnrichmentResult> {
  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey: anthropicKey });

  const sourcesText = sources.length > 0
    ? sources.map((s) => `--- ${s.source} ---\n${s.snippets}`).join("\n\n")
    : "(No external data sources available - use only your knowledge)";

  // Build scraped pages context for validation
  const scrapedContext = scrapedPages.map(p =>
    `URL: ${p.url}\nTitle: ${p.title}\nMeta: ${p.description}\nContent preview: ${p.bodyText.slice(0, 1500)}`
  ).join("\n\n---\n\n");

  const prompt = `You are a data analyst specializing in FC Barcelona supporter clubs. Your tasks:
1. Determine which (if any) of the scraped websites actually belongs to this peña
2. Write a description based on REAL scraped content (not generic text)
3. Extract structured data

PEÑA DETAILS:
Name: ${name}
City: ${city}
${province ? `Province: ${province}` : ""}
Country: ${country}
Region: ${region === "cataluna" ? "Catalunya" : region === "spain" ? "Spain" : "International"}

DATA FROM SOURCES:
${sourcesText}

${scrapedPages.length > 0 ? `SCRAPED WEBSITES TO VALIDATE:
${scrapedContext}` : "(No websites were scraped)"}

WEBSITE VALIDATION INSTRUCTIONS:
- For each scraped URL, determine if it's the peña's OWN website
- A website belongs to the peña if: the page title or content mentions the peña name, it's in the same city, it contains contact info matching other sources
- A website does NOT belong if: it's a directory listing, a news article about the peña, a city portal that mentions it briefly, or an unrelated site
- If you identify the peña's website, set it in the "website" field
- In "websiteValidation" write a clear explanation in Spanish of WHY you consider this URL to be (or not be) the peña's website. Include evidence: matching name, city, contact details found, etc.

DESCRIPTION INSTRUCTIONS:
- Write the description in English based on REAL data from the scraped website content
- Include specific facts found: founding year, activities, location, events, members
- If no website was scraped or validated, write based on available source data
- 2-4 sentences, factual, not generic

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "address": "Full street address or null",
  "postalCode": "Postal code or null",
  "email": "Contact email or null",
  "phone": "Phone number or null",
  "website": "ONLY the validated peña website URL, or null if none confirmed",
  "websiteValidation": "Explanation in Spanish of why this URL is/isn't the peña's website. Include evidence found. If no URL was checked, say 'No se encontraron URLs para validar.'",
  "socialMedia": { "facebook": "URL or null", "twitter": "URL or null", "instagram": "URL or null", "tiktok": "URL or null" },
  "president": "Name or null",
  "foundedYear": 1990,
  "memberCount": 150,
  "description": "Description based on scraped content (2-4 sentences, English)",
  "confidence": "high|medium|low"
}

Confidence:
- "high": website validated + data confirmed by scraping
- "medium": website found but partial data, or multiple AI sources agree
- "low": no website validated, limited data`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
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
    // Step 1: Perplexity Sonar
    console.log(`[Enrichment] ${name}: Step 1 - Perplexity Sonar...`);
    const perplexityResult = await searchPerplexity(name, city, country);
    if (perplexityResult) { sourceData.push(perplexityResult); sourcesUsed.push("Perplexity"); }

    // Step 2: Grok
    console.log(`[Enrichment] ${name}: Step 2 - Grok...`);
    const grokResult = await searchGrok(name, city, country);
    if (grokResult) { sourceData.push(grokResult); sourcesUsed.push("Grok"); }

    // Step 3: Scrape discovered URLs
    console.log(`[Enrichment] ${name}: Step 3 - Scraping discovered URLs...`);
    const { scrapedPages, scrapedSource } = await scrapeDiscoveredUrls(sourceData, name);
    if (scrapedSource) {
      sourceData.push(scrapedSource);
      sourcesUsed.push(`Scraping (${scrapedPages.length} URLs)`);
    }

    // Step 4: Claude synthesis + website validation
    console.log(`[Enrichment] ${name}: Step 4 - Claude synthesis + validation (${sourceData.length} sources, ${scrapedPages.length} pages)...`);
    sourcesUsed.push("Claude");
    const parsed = await claudeSynthesize(name, city, country, penya.region, penya.province, sourceData, scrapedPages);

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

    // Build RAG content from the best scraped page (the validated website)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scrapedContent: any = Prisma.DbNull;
    const validatedUrl = parsed.website;
    if (validatedUrl && scrapedPages.length > 0) {
      // Find the scraped page matching the validated URL
      const matchingPage = scrapedPages.find(p => p.url === validatedUrl) || scrapedPages[0];
      scrapedContent = {
        url: matchingPage.url,
        title: matchingPage.title,
        metaDescription: matchingPage.description,
        bodyText: matchingPage.bodyText,
        emails: matchingPage.emails,
        phones: matchingPage.phones,
        socialLinks: matchingPage.socialLinks,
        scrapedAt: new Date().toISOString(),
      };
    } else if (scrapedPages.length > 0) {
      // Store all scraped data even if no website was validated
      scrapedContent = scrapedPages.map(p => ({
        url: p.url,
        title: p.title,
        metaDescription: p.description,
        bodyText: p.bodyText,
        emails: p.emails,
        phones: p.phones,
        socialLinks: p.socialLinks,
        validated: false,
        scrapedAt: new Date().toISOString(),
      }));
    }

    await prisma.penya.update({
      where: { id: penyaId },
      data: {
        address: parsed.address || null,
        postalCode: parsed.postalCode || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        website: parsed.website || null,
        websiteValidation: parsed.websiteValidation || null,
        socialMedia: socialMedia ?? Prisma.DbNull,
        president: parsed.president || null,
        foundedYear: typeof parsed.foundedYear === "number" ? parsed.foundedYear : null,
        memberCount: typeof parsed.memberCount === "number" ? parsed.memberCount : null,
        description: parsed.description || null,
        scrapedContent: scrapedContent,
        enrichmentStatus: "enriched",
        detailsUpdatedAt: new Date(),
      },
    });

    console.log(`[Enrichment] ${name}: SUCCESS (sources: ${sourcesUsed.join(", ")}, website: ${parsed.website || "none"})`);
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
