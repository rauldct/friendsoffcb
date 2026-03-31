import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { XMLParser } from "fast-xml-parser";
import { indexNewsArticle } from "@/lib/rag";
import { slugify } from "@/lib/slugify";

const BARCA_ID = 529; // FC Barcelona ID in API-Football (api-sports.io)
const BARCA_FD_ID = 81; // FC Barcelona ID in football-data.org
const API_BASE = "https://v3.football.api-sports.io";
const FD_BASE = "https://api.football-data.org/v4";

/** Pool of cover images for news articles */
const COVER_IMAGES = [
  "/images/packages/camp-nou-match.jpg",
  "/images/packages/camp-nou-aerial.jpg",
  "/images/packages/camp-nou-night.jpg",
  "/images/packages/camp-nou-match2.jpg",
  "/images/packages/camp-nou-exterior.jpg",
  "/images/blog/camp-nou-wide.jpg",
  "/images/blog/champions-league-trophy.jpg",
  "/images/blog/camp-nou-tickets.jpg",
];

/** Get a random cover image, including approved gallery photos */
async function getRandomCoverImage(): Promise<string> {
  const pool = [...COVER_IMAGES];
  try {
    const galleryPhotos = await prisma.photo.findMany({
      where: { status: "approved" },
      select: { filename: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    for (const p of galleryPhotos) {
      pool.push(`/uploads/gallery/${p.filename}`);
    }
  } catch { /* ignore - use static pool only */ }
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Strip markdown code blocks and extract raw JSON from Claude responses */
function extractJson(raw: string): string {
  let text = raw.trim();
  // Remove markdown code block wrapping (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }
  // If still not starting with {, try to find the JSON object
  if (!text.startsWith("{")) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
  }
  return text;
}

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

function getSeasonForDate(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

async function getAnthropicKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

async function getFootballApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "API_FOOTBALL_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.API_FOOTBALL_KEY || "";
}

async function getFootballDataApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FOOTBALL_DATA_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

/** Ensure sources array has at least 1 item per source name, max 15 total */
function deduplicateSources(sources: Array<{ name: string; url: string }>): Array<{ name: string; url: string }> {
  const seen = new Map<string, { name: string; url: string }[]>();
  for (const s of sources) {
    if (!seen.has(s.name)) seen.set(s.name, []);
    seen.get(s.name)!.push(s);
  }
  const result: Array<{ name: string; url: string }> = [];
  // First pass: 1 per source
  for (const [, items] of seen) result.push(items[0]);
  // Second pass: fill remaining slots round-robin
  let idx = 0;
  const sourceNames = Array.from(seen.keys());
  while (result.length < 15 && idx < sources.length) {
    const remaining = sources.filter(s => !result.includes(s));
    if (remaining.length === 0) break;
    result.push(remaining[0]);
    sources = sources.filter(s => s !== remaining[0]);
    idx++;
  }
  return result.slice(0, 15);
}

/** Balance items across sources: max N items per source */
function balanceItems(items: RssItem[], maxPerSource: number = 5): RssItem[] {
  const bySource = new Map<string, RssItem[]>();
  for (const item of items) {
    if (!bySource.has(item.source)) bySource.set(item.source, []);
    bySource.get(item.source)!.push(item);
  }
  const result: RssItem[] = [];
  for (const [, sourceItems] of bySource) {
    result.push(...sourceItems.slice(0, maxPerSource));
  }
  return result.sort((a, b) => {
    try { return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(); } catch { return 0; }
  });
}

// ============== RSS FEED READING ==============

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

async function fetchRssItems(url: string, sourceName: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FriendsOfBarca/1.0 News Aggregator" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(xml);

    let items: unknown[] = [];
    if (parsed?.rss?.channel?.item) {
      items = Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : [parsed.rss.channel.item];
    } else if (parsed?.feed?.entry) {
      items = Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry];
    }

    return items.slice(0, 15).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      // Atom feeds have link as object(s) with @_href attribute
      let link = "";
      if (typeof i.link === "string") {
        link = i.link;
      } else if (Array.isArray(i.link)) {
        const alt = (i.link as Record<string, string>[]).find(l => l["@_rel"] === "alternate");
        link = (alt || i.link[0])?.["@_href"] || "";
      } else if (i.link && typeof i.link === "object") {
        link = (i.link as Record<string, string>)["@_href"] || "";
      }
      if (!link) link = String(i.guid || "");
      // Atom title may be wrapped in object with #text
      const title = typeof i.title === "object" && i.title !== null
        ? String((i.title as Record<string, unknown>)["#text"] || "")
        : String(i.title || "");
      return {
        title,
        link,
        description: String(i.description || i.summary || i.content || "").replace(/<[^>]*>/g, "").slice(0, 300),
        pubDate: String(i.pubDate || i.published || i.updated || ""),
        source: sourceName,
      };
    });
  } catch (err) {
    console.error(`RSS fetch error for ${sourceName}:`, err);
    return [];
  }
}

// ============== NEWS DIGEST ==============

export async function generateNewsDigest(customDate?: Date): Promise<string> {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "news_digest", status: "running" },
  });

  try {
    const anthropicKey = await getAnthropicKey();
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Fetch RSS sources
    const sources = await prisma.rssSource.findMany({ where: { active: true } });
    if (sources.length === 0) throw new Error("No RSS sources configured");

    const allItems: RssItem[] = [];
    for (const src of sources) {
      const items = await fetchRssItems(src.url, src.name);
      allItems.push(...items);
    }

    // Filter last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentItems = allItems.filter((item) => {
      try {
        return new Date(item.pubDate) >= threeDaysAgo;
      } catch {
        return true; // Include if date parsing fails
      }
    });

    const itemsForPrompt = balanceItems(
      recentItems.length > 0
        ? recentItems
        : allItems.slice(0, 30), // Fallback to latest items
      5 // Max 5 items per source
    );

    const itemsSummary = itemsForPrompt
      .map(
        (i) =>
          `[${i.source}] ${i.title}\n${i.description}`
      )
      .join("\n\n");

    const publishDate = customDate || new Date();
    const dateStr = publishDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3500,
      messages: [
        {
          role: "user",
          content: `You are a sports journalist writing for FriendsOfBarca.com, a fan site for FC Barcelona.

Based on the following news items from various sources, write a comprehensive news digest for ${dateStr} in BOTH English and Spanish.

NEWS ITEMS:
${itemsSummary}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Catchy, content-specific headline in English. NEVER use generic titles like 'Barcelona News Digest' or 'News Roundup'. Instead, highlight the 2-3 main stories, e.g. 'Araujo Returns, Copa Clash Looms & Laporta's Bold Promise'. Include date.",
  "titleEs": "Titular llamativo y específico en español. NUNCA uses títulos genéricos como 'Resumen de Noticias del Barça'. Destaca las 2-3 noticias principales, ej: 'Araujo Vuelve, Se Acerca el Duelo de Copa y la Promesa de Laporta'. Incluir fecha.",
  "excerpt": "2-3 sentence summary in English (max 200 chars)",
  "excerptEs": "Resumen de 2-3 frases en español (max 200 chars)",
  "content": "Full article in English with ## headers. Cover the 3-5 most important stories. Write 400-600 words.",
  "contentEs": "Artículo completo en español con ## para encabezados. Cubrir las 3-5 noticias más importantes. Escribir 400-600 palabras.",
  "metaTitle": "SEO title in English (under 60 chars)",
  "metaTitleEs": "Título SEO en español (menos de 60 chars)",
  "metaDescription": "SEO description in English (under 160 chars)",
  "metaDescriptionEs": "Descripción SEO en español (menos de 160 chars)"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if Claude wraps them
    text = extractJson(text);
    const parsed = JSON.parse(text);

    // Check if digest already exists for this date (by old-style slug)
    const dateSlug = slugify(`barca-news-digest-${publishDate.toISOString().slice(0, 10)}`);
    const existingByDate = await prisma.newsArticle.findFirst({
      where: {
        OR: [
          { slug: dateSlug },
          { oldSlug: dateSlug },
          { slug: { startsWith: `barca-news-digest-${publishDate.toISOString().slice(0, 10)}` } },
        ],
        category: "digest",
      },
    });
    if (existingByDate) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "Digest already exists for this date.", endedAt: new Date() },
      });
      return existingByDate.id;
    }

    // Generate SEO-friendly slug from AI title
    const titleForSlug = parsed.title || `FC Barcelona News Digest ${dateStr}`;
    let slug = slugify(titleForSlug);
    const existingSlugCheck = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existingSlugCheck) slug = `${slug}-${publishDate.toISOString().slice(0, 10)}`;

    const coverImage = await getRandomCoverImage();
    const article = await prisma.newsArticle.create({
      data: {
        slug,
        title: parsed.title || `FC Barcelona News Digest - ${dateStr}`,
        titleEs: parsed.titleEs || null,
        excerpt: parsed.excerpt || "",
        excerptEs: parsed.excerptEs || null,
        content: parsed.content || "",
        contentEs: parsed.contentEs || null,
        coverImage,
        category: "digest",
        sources: deduplicateSources(itemsForPrompt.map((i) => ({ name: i.source, url: i.link }))),
        author: "Friends of Barça AI",
        metaTitle: parsed.metaTitle || "",
        metaTitleEs: parsed.metaTitleEs || null,
        metaDescription: parsed.metaDescription || "",
        metaDescriptionEs: parsed.metaDescriptionEs || null,
        publishedAt: publishDate,
      },
    });

    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: `Digest created: "${parsed.title}"`,
        details: { articleId: article.id, slug, itemsProcessed: itemsForPrompt.length },
        endedAt: new Date(),
      },
    });

    // Index into RAG knowledge base
    try { await indexNewsArticle(article.id); } catch (e) { console.error("[RAG] Index digest error:", e); }

    return article.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    throw err;
  }
}

// ============== MATCH CHRONICLE ==============

interface MatchResult {
  fixture: { id: number; date: string; referee: string | null; status: { short: string } };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number; away: number };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
  league: { id: number; name: string };
}

export async function generateMatchChronicle(customDate?: Date): Promise<string | null> {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "match_chronicle", status: "running" },
  });

  try {
    const footballKey = await getFootballApiKey();
    if (!footballKey) throw new Error("API_FOOTBALL_KEY not configured");

    const anthropicKey = await getAnthropicKey();
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Fetch today's finished matches for Barca
    const checkDate = customDate || new Date();
    const dateStr = checkDate.toISOString().slice(0, 10);
    const season = getSeasonForDate(checkDate);

    // Try current season first, fallback to previous if no results (free tier limitation)
    let res = await fetch(
      `${API_BASE}/fixtures?team=${BARCA_ID}&from=${dateStr}&to=${dateStr}&status=FT&season=${season}`,
      { headers: { "x-apisports-key": footballKey }, cache: "no-store" }
    );

    if (!res.ok) throw new Error(`Football API error: ${res.status}`);
    let data = await res.json();
    let matches: MatchResult[] = data.response || [];

    // Fallback to previous season if no results (free tier limitation)
    if (matches.length === 0 && season > 2022) {
      res = await fetch(
        `${API_BASE}/fixtures?team=${BARCA_ID}&from=${dateStr}&to=${dateStr}&status=FT&season=${season - 1}`,
        { headers: { "x-apisports-key": footballKey }, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Football API error: ${res.status}`);
      data = await res.json();
      matches = data.response || [];
    }

    if (matches.length === 0) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: "success",
          message: `No Barcelona match on ${dateStr}.`,
          endedAt: new Date(),
        },
      });
      return null;
    }

    const match = matches[0];
    const isHome = match.teams.home.id === BARCA_ID;
    const opponent = isHome ? match.teams.away.name : match.teams.home.name;
    const barcaGoals = isHome ? match.goals.home : match.goals.away;
    const opponentGoals = isHome ? match.goals.away : match.goals.home;
    const result =
      barcaGoals > opponentGoals ? "win" : barcaGoals < opponentGoals ? "loss" : "draw";
    const scoreStr = isHome
      ? `${match.goals.home}-${match.goals.away}`
      : `${match.goals.away}-${match.goals.home}`;

    // Check if chronicle already exists for this match (by slug OR matchDate)
    const matchDateObj = new Date(match.fixture.date);
    const legacySlug = slugify(`barca-${result}-${opponent}-${scoreStr}-${dateStr}`);
    const dayStart = new Date(matchDateObj); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(matchDateObj); dayEnd.setHours(23, 59, 59, 999);
    const existing = await prisma.newsArticle.findFirst({
      where: {
        category: "chronicle",
        OR: [
          { slug: legacySlug },
          { oldSlug: legacySlug },
          { matchDate: { gte: dayStart, lte: dayEnd } },
        ],
      },
    });
    if (existing) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "Chronicle already exists.", endedAt: new Date() },
      });
      return existing.id;
    }

    const referee = match.fixture.referee || "Unknown";
    const htHome = match.score.halftime.home ?? 0;
    const htAway = match.score.halftime.away ?? 0;
    const halfTimeScore = `${htHome}-${htAway}`;

    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4500,
      messages: [
        {
          role: "user",
          content: `You are a passionate sports journalist for FriendsOfBarca.com. Write a detailed match chronicle in BOTH English and Spanish.

MATCH DATA:
- Competition: ${match.league.name}
- Date: ${new Date(match.fixture.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
- ${match.teams.home.name} ${match.goals.home} - ${match.goals.away} ${match.teams.away.name}
- Half-time: ${halfTimeScore}
- Venue: ${isHome ? "Spotify Camp Nou, Barcelona" : "Away"}
- Referee: ${referee}
- Result for Barcelona: ${result.toUpperCase()}

Write an engaging match report in both languages. Consider the scoreline, the competition context, and what this means for Barcelona's season.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Engaging headline in English (include score)",
  "titleEs": "Titular atractivo en español (incluir resultado)",
  "excerpt": "Brief 2-sentence summary in English (max 200 chars)",
  "excerptEs": "Resumen breve de 2 frases en español (max 200 chars)",
  "content": "Full match report in English. Use ## for section headers. 500-800 words.",
  "contentEs": "Crónica completa en español. Usar ## para encabezados. 500-800 palabras.",
  "metaTitle": "SEO title in English (under 60 chars)",
  "metaTitleEs": "Título SEO en español (menos de 60 chars)",
  "metaDescription": "SEO description in English (under 160 chars)",
  "metaDescriptionEs": "Descripción SEO en español (menos de 160 chars)"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if Claude wraps them
    text = extractJson(text);
    const parsed = JSON.parse(text);

    // Generate SEO-friendly slug from AI title
    const chronicleTitle = parsed.title || `Barcelona ${scoreStr} ${opponent}`;
    let chronicleSlug = slugify(chronicleTitle);
    const slugExists = await prisma.newsArticle.findUnique({ where: { slug: chronicleSlug } });
    if (slugExists) chronicleSlug = `${chronicleSlug}-${dateStr}`;

    const chronicleCover = await getRandomCoverImage();
    const article = await prisma.newsArticle.create({
      data: {
        slug: chronicleSlug,
        title: chronicleTitle,
        titleEs: parsed.titleEs || null,
        excerpt: parsed.excerpt || "",
        excerptEs: parsed.excerptEs || null,
        content: parsed.content || "",
        contentEs: parsed.contentEs || null,
        coverImage: chronicleCover,
        category: "chronicle",
        matchDate: matchDateObj,
        matchResult: `${scoreStr} (${result})`,
        sources: [],
        author: "Friends of Barça AI",
        metaTitle: parsed.metaTitle || "",
        metaTitleEs: parsed.metaTitleEs || null,
        metaDescription: parsed.metaDescription || "",
        metaDescriptionEs: parsed.metaDescriptionEs || null,
        publishedAt: matchDateObj,
      },
    });

    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: `Chronicle created: "${parsed.title}"`,
        details: {
          articleId: article.id,
          slug: chronicleSlug,
          match: `${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name}`,
        },
        endedAt: new Date(),
      },
    });

    // Index into RAG knowledge base
    try { await indexNewsArticle(article.id); } catch (e) { console.error("[RAG] Index chronicle error:", e); }

    return article.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    throw err;
  }
}

// ============== SEED RETROACTIVE CONTENT ==============

export async function seedRetroactiveContent(weeks: number = 10): Promise<{
  chronicles: number;
  digests: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let chronicles = 0;
  let digests = 0;

  const footballKey = await getFootballApiKey();
  const anthropicKey = await getAnthropicKey();

  if (!footballKey || !anthropicKey) {
    throw new Error("Both API_FOOTBALL_KEY and ANTHROPIC_API_KEY must be configured");
  }

  // 1. Fetch past matches
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  const season = getSeasonForDate(endDate);

  let res = await fetch(
    `${API_BASE}/fixtures?team=${BARCA_ID}&from=${startDate.toISOString().slice(0, 10)}&to=${endDate.toISOString().slice(0, 10)}&status=FT&season=${season}`,
    { headers: { "x-apisports-key": footballKey }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`Football API error: ${res.status}`);
  let data = await res.json();
  let matches: MatchResult[] = data.response || [];

  // Fallback to previous season if no results (free tier limitation)
  if (matches.length === 0 && season > 2022) {
    res = await fetch(
      `${API_BASE}/fixtures?team=${BARCA_ID}&from=${startDate.toISOString().slice(0, 10)}&to=${endDate.toISOString().slice(0, 10)}&status=FT&season=${season - 1}`,
      { headers: { "x-apisports-key": footballKey }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Football API error: ${res.status}`);
    data = await res.json();
    matches = data.response || [];
  }

  // 2. Generate chronicles for each match
  for (const match of matches) {
    try {
      const matchDate = new Date(match.fixture.date);
      const isHome = match.teams.home.id === BARCA_ID;
      const opponent = isHome ? match.teams.away.name : match.teams.home.name;
      const barcaGoals = isHome ? match.goals.home : match.goals.away;
      const opponentGoals = isHome ? match.goals.away : match.goals.home;
      const result = barcaGoals > opponentGoals ? "win" : barcaGoals < opponentGoals ? "loss" : "draw";
      const scoreStr = isHome
        ? `${match.goals.home}-${match.goals.away}`
        : `${match.goals.away}-${match.goals.home}`;
      const legacySeedSlug = slugify(`barca-${result}-${opponent}-${scoreStr}-${matchDate.toISOString().slice(0, 10)}`);

      const existing = await prisma.newsArticle.findFirst({
        where: { OR: [{ slug: legacySeedSlug }, { oldSlug: legacySeedSlug }], category: "chronicle" },
      });
      if (existing) continue;

      const htHome = match.score.halftime.home ?? 0;
      const htAway = match.score.halftime.away ?? 0;
      const halfTimeScore = `${htHome}-${htAway}`;
      const referee = match.fixture.referee || "Unknown";

      const client = new Anthropic({ apiKey: anthropicKey });
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: `You are a sports journalist for FriendsOfBarca.com. Write a match chronicle.

MATCH: ${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name}
Competition: ${match.league.name}
Date: ${matchDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
Half-time: ${halfTimeScore}
Venue: ${isHome ? "Spotify Camp Nou" : "Away"}
Referee: ${referee}
Barcelona result: ${result.toUpperCase()}

Respond ONLY with valid JSON:
{
  "title": "Headline with score",
  "excerpt": "2-sentence summary (max 200 chars)",
  "content": "Match report with ## headers. 400-600 words.",
  "metaTitle": "SEO title (under 60 chars)",
  "metaDescription": "SEO description (under 160 chars)"
}`,
          },
        ],
      });

      let text = response.content[0].type === "text" ? response.content[0].text : "";
      text = extractJson(text);
      const parsed = JSON.parse(text);

      const seedTitle = parsed.title || `Barcelona ${scoreStr} ${opponent}`;
      let seedSlug = slugify(seedTitle);
      const seedSlugExists = await prisma.newsArticle.findUnique({ where: { slug: seedSlug } });
      if (seedSlugExists) seedSlug = `${seedSlug}-${matchDate.toISOString().slice(0, 10)}`;

      const seedCover = await getRandomCoverImage();
      await prisma.newsArticle.create({
        data: {
          slug: seedSlug,
          title: seedTitle,
          excerpt: parsed.excerpt || "",
          content: parsed.content || "",
          coverImage: seedCover,
          category: "chronicle",
          matchDate,
          matchResult: `${scoreStr} (${result})`,
          sources: [],
          author: "Friends of Barça AI",
          metaTitle: parsed.metaTitle || "",
          metaDescription: parsed.metaDescription || "",
          publishedAt: matchDate,
        },
      });

      chronicles++;
      // Rate limit
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      errors.push(`Chronicle ${match.teams.home.name} vs ${match.teams.away.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Generate weekly digests (every 3 days)
  const digestDates: Date[] = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    digestDates.push(new Date(d));
    d.setDate(d.getDate() + 3);
  }

  for (const digestDate of digestDates) {
    try {
      const legacyDigestSlug = slugify(`barca-news-digest-${digestDate.toISOString().slice(0, 10)}`);
      const existing = await prisma.newsArticle.findFirst({
        where: { OR: [{ slug: legacyDigestSlug }, { oldSlug: legacyDigestSlug }], category: "digest" },
      });
      if (existing) continue;

      const dateStr = digestDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Find matches around this date for context
      const nearbyMatches = matches.filter((m) => {
        const md = new Date(m.fixture.date);
        return Math.abs(md.getTime() - digestDate.getTime()) < 3 * 86400000;
      });

      const matchContext = nearbyMatches
        .map((m) => {
          return `${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name} (${m.league.name}, ${new Date(m.fixture.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
        })
        .join("\n");

      const client = new Anthropic({ apiKey: anthropicKey });
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a sports journalist for FriendsOfBarca.com. Write a news digest for ${dateStr} covering the last 3 days of FC Barcelona news.

${matchContext ? `RECENT MATCHES:\n${matchContext}\n` : ""}
The 2025-26 season is ongoing. Cover transfer rumors, team news, match previews/reviews, and any relevant Barcelona news for this period. Be creative but realistic.

Respond ONLY with valid JSON:
{
  "title": "Engaging digest title with date range",
  "excerpt": "2-sentence summary (max 200 chars)",
  "content": "Full digest with ## headers. Cover 3-4 stories. 400-500 words.",
  "metaTitle": "SEO title (under 60 chars)",
  "metaDescription": "SEO description (under 160 chars)"
}`,
          },
        ],
      });

      let text = response.content[0].type === "text" ? response.content[0].text : "";
      text = extractJson(text);
      const parsed = JSON.parse(text);

      const seedDigestTitle = parsed.title || `FC Barcelona News Digest - ${dateStr}`;
      let seedDigestSlug = slugify(seedDigestTitle);
      const seedDigestExists = await prisma.newsArticle.findUnique({ where: { slug: seedDigestSlug } });
      if (seedDigestExists) seedDigestSlug = `${seedDigestSlug}-${digestDate.toISOString().slice(0, 10)}`;

      await prisma.newsArticle.create({
        data: {
          slug: seedDigestSlug,
          title: seedDigestTitle,
          excerpt: parsed.excerpt || "",
          content: parsed.content || "",
          category: "digest",
          sources: [
            { name: "FC Barcelona Official", url: "https://www.fcbarcelona.com" },
            { name: "Marca", url: "https://www.marca.com" },
            { name: "Sport", url: "https://www.sport.es" },
          ],
          author: "Friends of Barça AI",
          metaTitle: parsed.metaTitle || "",
          metaDescription: parsed.metaDescription || "",
          publishedAt: digestDate,
        },
      });

      digests++;
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      errors.push(`Digest ${digestDate.toISOString().slice(0, 10)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { chronicles, digests, errors };
}

// ============== AUTO CHRONICLE (football-data.org) ==============

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string; shortName: string; crest: string };
  awayTeam: { id: number; name: string; shortName: string; crest: string };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: { id: number; name: string; code: string };
  referees: Array<{ name: string; nationality: string }>;
}

export async function generateAutoChronicle(targetDate?: Date): Promise<string | null> {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "auto_chronicle", status: "running" },
  });

  try {
    const fdKey = await getFootballDataApiKey();
    if (!fdKey) throw new Error("FOOTBALL_DATA_API_KEY not configured");

    const anthropicKey = await getAnthropicKey();
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Check yesterday's matches (or target date)
    const checkDate = targetDate || new Date();
    if (!targetDate) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    const dateStr = checkDate.toISOString().slice(0, 10);

    // Fetch Barça matches for this date from football-data.org
    const res = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?status=FINISHED&dateFrom=${dateStr}&dateTo=${dateStr}`,
      {
        headers: { "X-Auth-Token": fdKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`football-data.org API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const matches: FDMatch[] = data.matches || [];

    if (matches.length === 0) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: "success",
          message: `No Barcelona match on ${dateStr}.`,
          endedAt: new Date(),
        },
      });
      return null;
    }

    const match = matches[0];
    const isHome = match.homeTeam.id === BARCA_FD_ID;
    const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
    const barcaGoals = isHome
      ? (match.score.fullTime.home ?? 0)
      : (match.score.fullTime.away ?? 0);
    const opponentGoals = isHome
      ? (match.score.fullTime.away ?? 0)
      : (match.score.fullTime.home ?? 0);
    const result =
      barcaGoals > opponentGoals ? "win" : barcaGoals < opponentGoals ? "loss" : "draw";
    const scoreStr = `${barcaGoals}-${opponentGoals}`;
    const htHome = match.score.halfTime.home ?? 0;
    const htAway = match.score.halfTime.away ?? 0;
    const halfTimeScore = `${htHome}-${htAway}`;

    // Check if chronicle already exists (by slug OR matchDate)
    const matchDateObj = new Date(match.utcDate);
    const autoLegacySlug = slugify(`barca-${result}-${opponent}-${scoreStr}-${dateStr}`);
    const dayStart = new Date(matchDateObj); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(matchDateObj); dayEnd.setHours(23, 59, 59, 999);
    const existing = await prisma.newsArticle.findFirst({
      where: {
        category: "chronicle",
        OR: [
          { slug: autoLegacySlug },
          { oldSlug: autoLegacySlug },
          { matchDate: { gte: dayStart, lte: dayEnd } },
        ],
      },
    });
    if (existing) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "Chronicle already exists for this match.", endedAt: new Date() },
      });
      return existing.id;
    }
    const referee = match.referees?.[0]?.name || "Unknown";
    const competitionName = match.competition.name;
    const venue = isHome ? "Spotify Camp Nou, Barcelona" : "Away";

    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 5000,
      messages: [
        {
          role: "user",
          content: `You are a passionate sports journalist writing for FriendsOfBarca.com, a fan site dedicated to FC Barcelona.

Write a detailed, engaging match chronicle based on the following data. You MUST provide BOTH English and Spanish versions.

MATCH DATA:
- Competition: ${competitionName}
- Date: ${matchDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
- ${match.homeTeam.name} ${match.score.fullTime.home} - ${match.score.fullTime.away} ${match.awayTeam.name}
- Half-time: ${halfTimeScore}
- Venue: ${venue}
- Referee: ${referee}
- Result for Barcelona: ${result.toUpperCase()}

Write an engaging match report. Each version should be 500-800 words. Use ## for section headers. Include:
1. An engaging introduction
2. First half summary
3. Second half summary
4. Key moments and player performances
5. What this means for Barcelona's season

Respond ONLY with valid JSON (no markdown code blocks):
{
  "title": "Engaging headline with score (English)",
  "titleEs": "Titular atractivo con resultado (Spanish)",
  "excerpt": "2-3 sentence summary in English (max 200 chars)",
  "excerptEs": "Resumen de 2-3 frases en español (max 200 chars)",
  "content": "Full match report in English with ## section headers",
  "contentEs": "Crónica completa en español con ## para encabezados de sección",
  "metaTitle": "SEO title under 60 chars (English)",
  "metaTitleEs": "Título SEO menos de 60 chars (Spanish)",
  "metaDescription": "SEO description under 160 chars (English)",
  "metaDescriptionEs": "Descripción SEO menos de 160 chars (Spanish)"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if present
    text = extractJson(text);
    const parsed = JSON.parse(text);

    // Generate SEO-friendly slug from AI title
    const autoTitle = parsed.title || `Barcelona ${scoreStr} ${opponent}`;
    let autoSlug = slugify(autoTitle);
    const autoSlugExists = await prisma.newsArticle.findUnique({ where: { slug: autoSlug } });
    if (autoSlugExists) autoSlug = `${autoSlug}-${dateStr}`;

    const coverImage = await getRandomCoverImage();
    const article = await prisma.newsArticle.create({
      data: {
        slug: autoSlug,
        title: autoTitle,
        titleEs: parsed.titleEs || null,
        excerpt: parsed.excerpt || "",
        excerptEs: parsed.excerptEs || null,
        content: parsed.content || "",
        contentEs: parsed.contentEs || null,
        coverImage,
        category: "chronicle",
        matchDate: matchDateObj,
        matchResult: `${scoreStr} (${result})`,
        sources: [],
        author: "Friends of Barça AI",
        metaTitle: parsed.metaTitle || "",
        metaTitleEs: parsed.metaTitleEs || null,
        metaDescription: parsed.metaDescription || "",
        metaDescriptionEs: parsed.metaDescriptionEs || null,
        publishedAt: matchDateObj,
      },
    });

    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: `Auto chronicle created: "${parsed.title}"`,
        details: {
          articleId: article.id,
          slug: autoSlug,
          match: `${match.homeTeam.name} ${match.score.fullTime.home}-${match.score.fullTime.away} ${match.awayTeam.name}`,
          competition: competitionName,
        },
        endedAt: new Date(),
      },
    });

    // Index into RAG knowledge base
    try { await indexNewsArticle(article.id); } catch (e) { console.error("[RAG] Index auto-chronicle error:", e); }

    return article.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    throw err;
  }
}

// ============== MATCH PREVIEW ==============

export async function generateMatchPreview(): Promise<string | null> {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "match_preview", status: "running" },
  });

  try {
    const fdKey = await getFootballDataApiKey();
    if (!fdKey) throw new Error("FOOTBALL_DATA_API_KEY not configured");
    const anthropicKey = await getAnthropicKey();
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Fetch next scheduled Barça match
    const now = new Date();
    const dateFrom = now.toISOString().slice(0, 10);
    const dateTo = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);

    const matchesRes = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}`,
      { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
    );

    if (!matchesRes.ok) throw new Error(`football-data.org error: ${matchesRes.status}`);
    const matchesData = await matchesRes.json();
    const scheduledMatches = matchesData.matches || [];

    if (scheduledMatches.length === 0) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "No upcoming matches in next 14 days", endedAt: new Date() },
      });
      return null;
    }

    const nextMatch = scheduledMatches[0];
    const isHome = nextMatch.homeTeam.id === BARCA_FD_ID;
    const opponent = isHome ? nextMatch.awayTeam.name : nextMatch.homeTeam.name;
    const matchDate = new Date(nextMatch.utcDate);
    const competition = nextMatch.competition.name;
    const venue = isHome ? "Spotify Camp Nou" : "Away";
    const matchDateStr = matchDate.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    // Check for duplicate preview
    const legacyPreviewSlug = slugify(`preview-barca-vs-${opponent}-${matchDate.toISOString().slice(0, 10)}`);
    const existingPreview = await prisma.newsArticle.findFirst({
      where: {
        OR: [
          { slug: legacyPreviewSlug },
          { oldSlug: legacyPreviewSlug },
        ],
        category: "preview",
      },
    });
    if (existingPreview) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: `Preview already exists`, endedAt: new Date() },
      });
      return null;
    }

    // Fetch Barça recent form
    await new Promise(r => setTimeout(r, 7000)); // rate limit
    const formRes = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?status=FINISHED&limit=5`,
      { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
    );
    let formContext = "Recent form unavailable.";
    if (formRes.ok) {
      const formData = await formRes.json();
      const recentMatches = (formData.matches || []).map((m: {
        homeTeam: { id: number; name: string };
        awayTeam: { name: string };
        score: { fullTime: { home: number | null; away: number | null } };
        competition: { name: string };
      }) => {
        const home = m.homeTeam.id === BARCA_FD_ID;
        const opp = home ? m.awayTeam.name : m.homeTeam.name;
        const bG = home ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0);
        const oG = home ? (m.score.fullTime.away ?? 0) : (m.score.fullTime.home ?? 0);
        const r = bG > oG ? "W" : bG < oG ? "L" : "D";
        return `${r} ${bG}-${oG} vs ${opp} (${m.competition.name})`;
      });
      formContext = recentMatches.join("\n");
    }

    // Fetch standings if league match
    let standingsContext = "";
    if (["PD", "PL", "SA", "BL1", "FL1"].includes(nextMatch.competition.code)) {
      await new Promise(r => setTimeout(r, 7000));
      const standRes = await fetch(
        `${FD_BASE}/competitions/${nextMatch.competition.code}/standings`,
        { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
      );
      if (standRes.ok) {
        const standData = await standRes.json();
        const table = standData.standings?.[0]?.table || [];
        const top5 = table.slice(0, 5).map((t: { position: number; team: { name: string }; points: number; playedGames: number; won: number; draw: number; lost: number }) =>
          `${t.position}. ${t.team.name} - ${t.points}pts (${t.playedGames}GP, ${t.won}W ${t.draw}D ${t.lost}L)`
        );
        standingsContext = `\nCurrent standings (top 5):\n${top5.join("\n")}`;
      }
    }

    // Generate preview with Claude AI
    const client = new Anthropic({ apiKey: anthropicKey });
    const aiResponse = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `You are a football journalist for FriendsOfBarca.com. Write a match PREVIEW article for the upcoming game.

Match: FC Barcelona vs ${opponent}
Competition: ${competition}
Date: ${matchDateStr}
Venue: ${venue}

Barcelona recent form (last 5):
${formContext}
${standingsContext}

Write a JSON with these fields:
{
  "title": "English title (include both team names)",
  "titleEs": "Spanish title",
  "excerpt": "English excerpt (2-3 sentences)",
  "excerptEs": "Spanish excerpt",
  "content": "Full English article in markdown (600-800 words). Include: ## Match Context, ## Key Players to Watch, ## Tactical Preview, ## Prediction. Be analytical and insightful.",
  "contentEs": "Full Spanish article in markdown (600-800 words). Same sections: ## Contexto del Partido, ## Jugadores Clave, ## Vista Previa Táctica, ## Predicción.",
  "metaTitle": "SEO title EN (max 60 chars)",
  "metaTitleEs": "SEO title ES",
  "metaDescription": "SEO description EN (max 160 chars)",
  "metaDescriptionEs": "SEO description ES"
}

Respond with ONLY the raw JSON (no markdown blocks).`,
      }],
    });

    let responseText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    responseText = extractJson(responseText);
    const parsed = JSON.parse(responseText);

    const coverImage = await getRandomCoverImage();

    // Generate SEO-friendly slug from AI title
    let previewSlug = slugify(parsed.title || `Preview Barcelona vs ${opponent}`);
    const previewSlugExists = await prisma.newsArticle.findUnique({ where: { slug: previewSlug } });
    if (previewSlugExists) previewSlug = `${previewSlug}-${matchDate.toISOString().slice(0, 10)}`;

    const previewArticle = await prisma.newsArticle.create({
      data: {
        slug: previewSlug,
        title: parsed.title,
        titleEs: parsed.titleEs || null,
        excerpt: parsed.excerpt,
        excerptEs: parsed.excerptEs || null,
        content: parsed.content,
        contentEs: parsed.contentEs || null,
        category: "preview",
        status: "published",
        coverImage,
        author: "FriendsOfBarca AI",
        matchResult: `vs ${opponent}`,
        publishedAt: new Date(),
        metaTitle: parsed.metaTitle || parsed.title,
        metaTitleEs: parsed.metaTitleEs || parsed.titleEs || null,
        metaDescription: parsed.metaDescription || parsed.excerpt,
        metaDescriptionEs: parsed.metaDescriptionEs || parsed.excerptEs || null,
      },
    });

    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: `Preview generated: ${parsed.title}`,
        endedAt: new Date(),
        details: { articleId: previewArticle.id, opponent, matchDate: matchDate.toISOString() },
      },
    });

    // Index into RAG knowledge base
    try { await indexNewsArticle(previewArticle.id); } catch (e) { console.error("[RAG] Index preview error:", e); }

    return previewArticle.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    throw err;
  }
}
