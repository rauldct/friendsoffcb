import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";
import { ingestChunks, deleteChunksBySource } from "@/lib/knowledge-pipeline";

// ============== CONFIG ==============

const USER_AGENT = "CuleBot/1.0 (https://friendsofbarca.com; rauloasys@gmail.com)";
const BASE_URL = "https://www.fcbarcelona.com";
const NEWS_PATHS = [
  { path: "/en/football/first-team/news", lang: "en" },
  { path: "/es/futbol/primer-equipo/noticias", lang: "es" },
];

// Conservative rate limiting - be very respectful
const DELAY_BETWEEN_REQUESTS_MS = 15000; // 15 seconds between requests
const MAX_ARTICLES_PER_RUN = 3;          // Max 3 new articles per language per run
const MAX_ARTICLES_STORED = 100;         // Keep track of last 100 scraped URLs

// ============== HELPERS ==============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getScrapedUrls(): Promise<string[]> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FCB_SCRAPED_URLS" } });
    if (s?.value) {
      return JSON.parse(s.value);
    }
  } catch {}
  return [];
}

async function saveScrapedUrls(urls: string[]): Promise<void> {
  // Keep only the last MAX_ARTICLES_STORED
  const trimmed = urls.slice(-MAX_ARTICLES_STORED);
  await prisma.setting.upsert({
    where: { key: "FCB_SCRAPED_URLS" },
    update: { value: JSON.stringify(trimmed) },
    create: { key: "FCB_SCRAPED_URLS", value: JSON.stringify(trimmed) },
  });
}

/**
 * Fetch a page with proper headers and timeout.
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[FCB News] HTTP ${res.status} for ${url}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    console.error(`[FCB News] Fetch error for ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Extract article links from the news listing page.
 */
function extractArticleLinks(html: string, lang: string): Array<{ url: string; title: string }> {
  const $ = cheerio.load(html);
  const links: Array<{ url: string; title: string }> = [];

  // FCB website uses various selectors for article cards
  // Look for links that point to news articles
  const langPrefix = lang === "es" ? "/es/" : "/en/";

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    // Match article URLs like /en/football/first-team/news/12345/article-slug
    if (href.includes("/news/") && href.startsWith(langPrefix) && href.split("/").length > 5) {
      const title = $(el).text().trim().replace(/\s+/g, " ");
      const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      if (title.length > 10 && !links.some(l => l.url === fullUrl)) {
        links.push({ url: fullUrl, title: title.slice(0, 200) });
      }
    }
  });

  return links;
}

/**
 * Extract article content from an article page.
 */
function extractArticleContent(html: string): { title: string; content: string; date: string } {
  const $ = cheerio.load(html);

  // Try various selectors for the title
  const title = $("h1").first().text().trim() ||
    $('[class*="title"]').first().text().trim() ||
    $("title").text().trim();

  // Try various selectors for the article body
  let content = "";
  const selectors = [
    "article",
    '[class*="article-body"]',
    '[class*="content-body"]',
    '[class*="story-body"]',
    '[class*="news-body"]',
    ".rich-text",
    "main",
  ];

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      // Get text from paragraphs within the article
      const paragraphs: string[] = [];
      el.find("p").each((_, p) => {
        const text = $(p).text().trim();
        if (text.length > 20) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length > 0) {
        content = paragraphs.join("\n\n");
        break;
      }
    }
  }

  // Fallback: get all paragraphs from body
  if (!content) {
    const paragraphs: string[] = [];
    $("p").each((_, p) => {
      const text = $(p).text().trim();
      if (text.length > 30) {
        paragraphs.push(text);
      }
    });
    content = paragraphs.slice(0, 20).join("\n\n");
  }

  // Try to extract date
  const date = $('meta[property="article:published_time"]').attr("content") ||
    $('time[datetime]').attr("datetime") ||
    $('[class*="date"]').first().text().trim() ||
    new Date().toISOString();

  return { title, content, date };
}

// ============== MAIN SCRAPE FUNCTION ==============

export interface FCBNewsScrapeResult {
  articlesScraped: number;
  chunksCreated: number;
  skipped: number;
  errors: string[];
  articles: Array<{ url: string; title: string; lang: string; chunks: number }>;
}

export async function scrapeFCBNews(): Promise<FCBNewsScrapeResult> {
  const result: FCBNewsScrapeResult = {
    articlesScraped: 0,
    chunksCreated: 0,
    skipped: 0,
    errors: [],
    articles: [],
  };

  const scrapedUrls = await getScrapedUrls();
  const newScrapedUrls = [...scrapedUrls];

  console.log(`[FCB News] Starting scrape. ${scrapedUrls.length} URLs already tracked.`);

  for (const { path, lang } of NEWS_PATHS) {
    const listingUrl = `${BASE_URL}${path}`;
    console.log(`[FCB News] Fetching listing page: ${listingUrl}`);

    const listingHtml = await fetchPage(listingUrl);
    if (!listingHtml) {
      result.errors.push(`Failed to fetch listing page: ${listingUrl}`);
      continue;
    }

    const articleLinks = extractArticleLinks(listingHtml, lang);
    console.log(`[FCB News] Found ${articleLinks.length} article links (${lang})`);

    // Filter out already scraped
    const newArticles = articleLinks.filter(a => !scrapedUrls.includes(a.url));
    console.log(`[FCB News] ${newArticles.length} new articles to scrape (${lang})`);

    // Take only MAX_ARTICLES_PER_RUN
    const toScrape = newArticles.slice(0, MAX_ARTICLES_PER_RUN);

    for (const article of toScrape) {
      console.log(`[FCB News] Waiting ${DELAY_BETWEEN_REQUESTS_MS / 1000}s before next request...`);
      await sleep(DELAY_BETWEEN_REQUESTS_MS);

      console.log(`[FCB News] Fetching: ${article.url}`);
      const articleHtml = await fetchPage(article.url);
      if (!articleHtml) {
        result.errors.push(`Failed to fetch: ${article.url}`);
        continue;
      }

      const { title, content, date } = extractArticleContent(articleHtml);

      if (!content || content.length < 100) {
        console.log(`[FCB News] Skipping ${article.url} - insufficient content (${content.length} chars)`);
        result.skipped++;
        newScrapedUrls.push(article.url); // Mark as scraped to not retry
        continue;
      }

      // Create a source ID from the URL
      const urlParts = article.url.split("/");
      const sourceId = `fcb-${lang}-${urlParts.slice(-2).join("-")}`.slice(0, 200);

      // Delete previous chunks for this article (in case of re-scrape)
      await deleteChunksBySource("official_news", sourceId);

      // Build chunk text
      const fullText = `FC Barcelona Official News: ${title}\n\n${content}`;

      // Split into chunks if needed (using simple splitting)
      const MAX_CHUNK = 1000;
      const textChunks: string[] = [];
      if (fullText.length <= MAX_CHUNK) {
        textChunks.push(fullText);
      } else {
        // Split by paragraphs
        const paragraphs = fullText.split("\n\n");
        let current = "";
        for (const para of paragraphs) {
          if ((current + "\n\n" + para).length > MAX_CHUNK && current.length > 0) {
            textChunks.push(current.trim());
            current = para;
          } else {
            current = current ? current + "\n\n" + para : para;
          }
        }
        if (current.trim()) textChunks.push(current.trim());
      }

      const chunks = textChunks.map((text, i) => ({
        sourceType: "official_news",
        sourceId,
        text,
        language: lang,
        freshnessDate: new Date(date || Date.now()),
        ttlHours: 0, // Permanent
        metadata: {
          source: "fcbarcelona.com",
          url: article.url,
          title: title.slice(0, 200),
          part: String(i + 1),
        },
      }));

      const created = await ingestChunks(chunks);
      result.chunksCreated += created;
      result.articlesScraped++;
      result.articles.push({
        url: article.url,
        title: title.slice(0, 100),
        lang,
        chunks: created,
      });

      newScrapedUrls.push(article.url);
      console.log(`[FCB News] Indexed "${title.slice(0, 60)}..." (${lang}): ${created} chunks`);
    }

    // Delay between language switches
    if (NEWS_PATHS.indexOf({ path, lang }) < NEWS_PATHS.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  // Save updated URLs
  await saveScrapedUrls(newScrapedUrls);

  // Track last scrape
  await prisma.setting.upsert({
    where: { key: "FCB_NEWS_LAST_SCRAPE" },
    update: { value: new Date().toISOString() },
    create: { key: "FCB_NEWS_LAST_SCRAPE", value: new Date().toISOString() },
  });

  console.log(`[FCB News] Done: ${result.articlesScraped} articles, ${result.chunksCreated} chunks, ${result.skipped} skipped`);
  return result;
}

/**
 * Check if we should scrape (not scraped in last N hours).
 */
export async function shouldScrapeFCBNews(minHoursInterval: number = 6): Promise<boolean> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FCB_NEWS_LAST_SCRAPE" } });
    if (!s?.value) return true;
    const lastScrape = new Date(s.value);
    const hoursSince = (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60);
    return hoursSince >= minHoursInterval;
  } catch {
    return true;
  }
}
