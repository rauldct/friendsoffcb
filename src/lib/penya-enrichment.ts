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

// ============== SOCIAL MEDIA SCRAPING ==============

const SOCIAL_DOMAINS = ["facebook.com", "fb.com", "instagram.com", "twitter.com", "x.com"];

function isSocialUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch { return false; }
}

function extractSocialUrls(text: string): string[] {
  const urls = extractUrls(text);
  return [...new Set(urls.filter(isSocialUrl))];
}

interface SocialMediaData {
  url: string;
  platform: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  extra: string;
}

async function scrapeSocialPage(url: string): Promise<SocialMediaData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const hostname = new URL(url).hostname.replace("www.", "");
    let platform = "unknown";
    if (hostname.includes("facebook") || hostname.includes("fb.")) platform = "Facebook";
    else if (hostname.includes("instagram")) platform = "Instagram";
    else if (hostname.includes("twitter") || hostname.includes("x.com")) platform = "Twitter/X";

    // Extract Open Graph tags (most reliable for social media)
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || "";
    const ogDesc = $('meta[property="og:description"]').attr("content")?.trim() || "";
    const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
    const description = ogDesc || metaDesc;

    // Try to find address from JSON-LD structured data
    let address = "";
    let phone = "";
    let email = "";
    const extraParts: string[] = [];

    // Parse JSON-LD (Facebook pages often embed this)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "{}");
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          // Address from structured data
          if (item.address) {
            const addr = item.address;
            if (typeof addr === "string") {
              address = addr;
            } else if (typeof addr === "object") {
              const parts = [addr.streetAddress, addr.addressLocality, addr.postalCode, addr.addressRegion, addr.addressCountry].filter(Boolean);
              if (parts.length > 0) address = parts.join(", ");
            }
          }
          if (item.telephone && !phone) phone = item.telephone;
          if (item.email && !email) email = item.email;
          if (item.openingHours) extraParts.push(`Hours: ${Array.isArray(item.openingHours) ? item.openingHours.join(", ") : item.openingHours}`);
          if (item.geo?.latitude) extraParts.push(`Coordinates: ${item.geo.latitude}, ${item.geo.longitude}`);
          if (item.foundingDate) extraParts.push(`Founded: ${item.foundingDate}`);
          if (item.memberOf?.name) extraParts.push(`Member of: ${item.memberOf.name}`);
          if (item.numberOfEmployees) extraParts.push(`Members/employees: ${JSON.stringify(item.numberOfEmployees)}`);

          // Check nested @graph
          if (item["@graph"] && Array.isArray(item["@graph"])) {
            for (const sub of item["@graph"]) {
              if (sub.address && !address) {
                const a = sub.address;
                if (typeof a === "string") address = a;
                else if (typeof a === "object") {
                  const parts = [a.streetAddress, a.addressLocality, a.postalCode, a.addressRegion].filter(Boolean);
                  if (parts.length > 0) address = parts.join(", ");
                }
              }
              if (sub.telephone && !phone) phone = sub.telephone;
            }
          }
        }
      } catch { /* invalid JSON-LD */ }
    });

    // Facebook-specific: look for address patterns in HTML content
    if (platform === "Facebook" && !address) {
      const bodyText = $("body").text();
      // Facebook pages sometimes show address in specific patterns
      const addressMatch = bodyText.match(/(?:Dirección|Address|Ubicación|Location)[:\s]*([^·\n]{10,80})/i);
      if (addressMatch) address = addressMatch[1].trim();
    }

    // Extract emails from page
    if (!email) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const bodyHtml = $.html();
      const emails = bodyHtml.match(emailRegex) || [];
      const validEmails = emails.filter(e => !e.includes("example.com") && !e.includes("sentry") && !e.includes("facebook") && !e.includes("instagram"));
      if (validEmails.length > 0) email = validEmails[0];
    }

    // Extract phone from tel: links
    if (!phone) {
      $('a[href^="tel:"]').each((_, el) => {
        if (!phone) phone = ($(el).attr("href") || "").replace("tel:", "").trim();
      });
    }

    // For Instagram, bio is typically in the og:description
    // Format: "N Followers, N Following, N Posts - See Instagram photos and videos from @handle"
    // or sometimes includes actual bio text

    return {
      url,
      platform,
      name: ogTitle,
      description,
      address,
      phone,
      email,
      extra: extraParts.join("; "),
    };
  } catch (err) {
    console.error(`[Social Scrape] Error scraping ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function scrapeSocialMediaUrls(
  sourceData: SourceData[],
  penyaName: string
): Promise<SourceData | null> {
  const allText = sourceData.map(s => s.snippets).join("\n");
  const socialUrls = extractSocialUrls(allText).slice(0, 4);

  if (socialUrls.length === 0) {
    console.log(`[Enrichment] ${penyaName}: No social media URLs found`);
    return null;
  }

  console.log(`[Enrichment] ${penyaName}: Scraping ${socialUrls.length} social media pages...`);
  const results: SocialMediaData[] = [];

  for (const url of socialUrls) {
    const data = await scrapeSocialPage(url);
    if (data && (data.description || data.address || data.phone || data.email)) {
      results.push(data);
      console.log(`[Enrichment] ${penyaName}: Social ${data.platform} - name: "${data.name}", address: "${data.address}", phone: "${data.phone}"`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  if (results.length === 0) return null;

  const snippets = results.map(r => {
    const lines = [`Platform: ${r.platform}`, `URL: ${r.url}`];
    if (r.name) lines.push(`Page name: ${r.name}`);
    if (r.description) lines.push(`Description/Bio: ${r.description}`);
    if (r.address) lines.push(`Address found: ${r.address}`);
    if (r.phone) lines.push(`Phone found: ${r.phone}`);
    if (r.email) lines.push(`Email found: ${r.email}`);
    if (r.extra) lines.push(`Extra data: ${r.extra}`);
    return lines.join("\n");
  }).join("\n\n---\n\n");

  return { source: "Social Media Scraping", snippets };
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

// ============== STEP 0: WEB SEARCH (Google Custom Search + DuckDuckGo fallback) ==============

const getGoogleApiKey = () => getSettingKey("GOOGLE_API_KEY");
const getGoogleSearchCx = () => getSettingKey("GOOGLE_SEARCH_CX");

async function searchGoogle(name: string, city: string, country: string): Promise<{ urls: string[]; source: SourceData | null } | null> {
  const apiKey = await getGoogleApiKey();
  const cx = await getGoogleSearchCx();
  if (!apiKey || !cx) {
    console.log("[Enrichment] Google API key or CX not configured, falling back to DuckDuckGo");
    return null;
  }

  const queries = [
    `"${name}" ${city} peña barcelonista`,
    `"${name}" ${city} FC Barcelona`,
  ];

  const allUrls: string[] = [];
  const allSnippets: string[] = [];

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        cx: cx,
        q: query,
        num: "10",
      });

      const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Enrichment] Google Search API error: ${res.status} ${errText.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const items = data.items || [];

      for (const item of items) {
        const url = item.link || "";
        const title = item.title || "";
        const snippet = item.snippet || "";

        if (url.startsWith("http")) {
          if (isScrapableUrl(url)) {
            allUrls.push(url);
          }
          if (snippet) allSnippets.push(`${title}: ${snippet} (${url})`);
        }
      }

      // Respect rate limits (Google allows 100/day)
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`[Enrichment] Google search error:`, err instanceof Error ? err.message : err);
    }
  }

  const uniqueUrls = [...new Set(allUrls)].slice(0, 8);
  console.log(`[Enrichment] ${name}: Google search found ${uniqueUrls.length} URLs, ${allSnippets.length} snippets`);

  if (allSnippets.length === 0 && uniqueUrls.length === 0) return { urls: [], source: null };

  return {
    urls: uniqueUrls,
    source: allSnippets.length > 0
      ? { source: "Google Search", snippets: allSnippets.slice(0, 15).join("\n\n") }
      : null,
  };
}

async function searchDuckDuckGo(name: string, city: string, country: string): Promise<{ urls: string[]; source: SourceData | null }> {
  const queries = [
    `"${name}" ${city} peña barcelonista`,
    `"${name}" ${city} FC Barcelona supporters club`,
  ];

  const allUrls: string[] = [];
  const allSnippets: string[] = [];

  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query);
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        redirect: "follow",
      });

      if (!res.ok) {
        console.log(`[Enrichment] DuckDuckGo search failed: ${res.status}`);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      $(".result").each((_, el) => {
        const link = $(el).find(".result__a").attr("href") || "";
        const snippet = $(el).find(".result__snippet").text().trim();
        const title = $(el).find(".result__a").text().trim();

        let actualUrl = link;
        if (link.includes("uddg=")) {
          try {
            const u = new URL(link, "https://duckduckgo.com");
            actualUrl = decodeURIComponent(u.searchParams.get("uddg") || link);
          } catch {
            actualUrl = link;
          }
        }

        if (actualUrl.startsWith("http") && isScrapableUrl(actualUrl)) {
          allUrls.push(actualUrl);
          if (snippet) allSnippets.push(`${title}: ${snippet} (${actualUrl})`);
        }
      });

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[Enrichment] DuckDuckGo search error:`, err instanceof Error ? err.message : err);
    }
  }

  const uniqueUrls = [...new Set(allUrls)].slice(0, 5);
  console.log(`[Enrichment] ${name}: DuckDuckGo search found ${uniqueUrls.length} URLs`);

  if (allSnippets.length === 0) return { urls: uniqueUrls, source: null };

  return {
    urls: uniqueUrls,
    source: { source: "Web Search (DuckDuckGo)", snippets: allSnippets.slice(0, 10).join("\n\n") },
  };
}

async function searchWeb(name: string, city: string, country: string): Promise<{ urls: string[]; source: SourceData | null }> {
  // Try Google first (much better results), fallback to DuckDuckGo
  const googleResult = await searchGoogle(name, city, country);
  if (googleResult) return googleResult;
  return searchDuckDuckGo(name, city, country);
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

ADDRESS INSTRUCTIONS:
- PRIORITIZE addresses found in social media pages (Facebook, Instagram) and scraped websites
- If a Facebook page shows an address or location, use it - Facebook business pages are very reliable for addresses
- Cross-reference addresses from different sources when possible

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "address": "Full street address or null - check Facebook/Instagram data first",
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
    // Step 0: Web search (DuckDuckGo) - always runs, no API key needed
    console.log(`[Enrichment] ${name}: Step 0 - Web search...`);
    const webSearch = await searchWeb(name, city, country);
    const webSearchUrls = webSearch.urls;
    if (webSearch.source) { sourceData.push(webSearch.source); sourcesUsed.push("Web Search"); }

    // Step 1: Perplexity Sonar
    console.log(`[Enrichment] ${name}: Step 1 - Perplexity Sonar...`);
    const perplexityResult = await searchPerplexity(name, city, country);
    if (perplexityResult) { sourceData.push(perplexityResult); sourcesUsed.push("Perplexity"); }

    // Step 2: Grok
    console.log(`[Enrichment] ${name}: Step 2 - Grok...`);
    const grokResult = await searchGrok(name, city, country);
    if (grokResult) { sourceData.push(grokResult); sourcesUsed.push("Grok"); }

    // Step 3: Scrape URLs (from web search + discovered in AI responses)
    console.log(`[Enrichment] ${name}: Step 3 - Scraping URLs...`);
    // Combine URLs from web search and from AI source text
    const aiUrls = extractUrls(sourceData.map(s => s.snippets).join("\n")).filter(isScrapableUrl);
    const allUrls = [...new Set([...webSearchUrls, ...aiUrls])].slice(0, 5);
    console.log(`[Enrichment] ${name}: Total URLs to scrape: ${allUrls.length} (web: ${webSearchUrls.length}, AI: ${aiUrls.length})`);

    const scrapedPages: ScrapedPage[] = [];
    for (const url of allUrls) {
      const page = await scrapePage(url);
      if (page) {
        scrapedPages.push(page);
        console.log(`[Enrichment] ${name}: Scraped ${url} - title: "${page.title}", emails: ${page.emails.length}, phones: ${page.phones.length}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    const scrapedSource = formatScrapedData(scrapedPages);
    if (scrapedSource) {
      sourceData.push(scrapedSource);
      sourcesUsed.push(`Scraping (${scrapedPages.length} URLs)`);
    }

    // Step 3.5: Scrape social media pages for extra data (address, phone, bio)
    console.log(`[Enrichment] ${name}: Step 3.5 - Scraping social media pages...`);
    const socialData = await scrapeSocialMediaUrls(sourceData, name);
    if (socialData) {
      sourceData.push(socialData);
      sourcesUsed.push("Social Media");
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
