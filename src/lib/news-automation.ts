import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { XMLParser } from "fast-xml-parser";

const BARCA_ID = 529; // FC Barcelona ID in API-Football (api-sports.io)
const BARCA_FD_ID = 81; // FC Barcelona ID in football-data.org
const API_BASE = "https://v3.football.api-sports.io";
const FD_BASE = "https://api.football-data.org/v4";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
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
      return {
        title: String(i.title || ""),
        link: String(i.link || i.guid || ""),
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

    const itemsForPrompt =
      recentItems.length > 0
        ? recentItems
        : allItems.slice(0, 20); // Fallback to latest items

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
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a sports journalist writing for FriendsOfBarca.com, a fan site for FC Barcelona.

Based on the following news items from various sources, write a comprehensive news digest for ${dateStr}.

NEWS ITEMS:
${itemsSummary}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Engaging title for the digest (include date range like 'Feb 5-8')",
  "excerpt": "2-3 sentence summary of the main stories (max 200 chars)",
  "content": "Full article in plain text with paragraphs separated by double newlines. Include sections with ## headers. Cover the 3-5 most important stories. Write 400-600 words. Be engaging and informative. Reference source names when citing info.",
  "metaTitle": "SEO title (under 60 chars)",
  "metaDescription": "SEO description (under 160 chars)"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if Claude wraps them
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    const slug = slugify(`barca-news-digest-${publishDate.toISOString().slice(0, 10)}`);

    // Check if slug exists
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existing) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "Digest already exists for this date.", endedAt: new Date() },
      });
      return existing.id;
    }

    const article = await prisma.newsArticle.create({
      data: {
        slug,
        title: parsed.title || `FC Barcelona News Digest - ${dateStr}`,
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
        category: "digest",
        sources: itemsForPrompt.map((i) => ({ name: i.source, url: i.link })).slice(0, 10),
        author: "Friends of Barça AI",
        metaTitle: parsed.metaTitle || "",
        metaDescription: parsed.metaDescription || "",
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

    // Check if chronicle already exists for this match
    const matchDateObj = new Date(match.fixture.date);
    const existingSlug = slugify(
      `barca-${result}-${opponent}-${scoreStr}-${dateStr}`
    );
    const existing = await prisma.newsArticle.findUnique({ where: { slug: existingSlug } });
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
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: `You are a passionate sports journalist for FriendsOfBarca.com. Write a detailed match chronicle.

MATCH DATA:
- Competition: ${match.league.name}
- Date: ${new Date(match.fixture.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
- ${match.teams.home.name} ${match.goals.home} - ${match.goals.away} ${match.teams.away.name}
- Half-time: ${halfTimeScore}
- Venue: ${isHome ? "Spotify Camp Nou, Barcelona" : "Away"}
- Referee: ${referee}
- Result for Barcelona: ${result.toUpperCase()}

Write an engaging match report. Consider the scoreline, the competition context, and what this means for Barcelona's season.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Engaging headline (include score, e.g. 'Barcelona Cruise Past Real Madrid 3-1 in El Clásico')",
  "excerpt": "Brief 2-sentence summary of the match (max 200 chars)",
  "content": "Full match report in plain text. Use ## for section headers. Include: Pre-match context, First half summary, Second half summary, Key moments, Player performances, What this means for the season. Write 500-800 words. Be passionate but objective.",
  "metaTitle": "SEO title (under 60 chars)",
  "metaDescription": "SEO description (under 160 chars)"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if Claude wraps them
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    const article = await prisma.newsArticle.create({
      data: {
        slug: existingSlug,
        title: parsed.title || `Barcelona ${scoreStr} ${opponent}`,
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
        category: "chronicle",
        matchDate: matchDateObj,
        matchResult: `${scoreStr} (${result})`,
        sources: [],
        author: "Friends of Barça AI",
        metaTitle: parsed.metaTitle || "",
        metaDescription: parsed.metaDescription || "",
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
          slug: existingSlug,
          match: `${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name}`,
        },
        endedAt: new Date(),
      },
    });

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
      const slug = slugify(`barca-${result}-${opponent}-${scoreStr}-${matchDate.toISOString().slice(0, 10)}`);

      const existing = await prisma.newsArticle.findUnique({ where: { slug } });
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
      text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const parsed = JSON.parse(text);

      await prisma.newsArticle.create({
        data: {
          slug,
          title: parsed.title || `Barcelona ${scoreStr} ${opponent}`,
          excerpt: parsed.excerpt || "",
          content: parsed.content || "",
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
      const slug = slugify(`barca-news-digest-${digestDate.toISOString().slice(0, 10)}`);
      const existing = await prisma.newsArticle.findUnique({ where: { slug } });
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
      text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const parsed = JSON.parse(text);

      await prisma.newsArticle.create({
        data: {
          slug,
          title: parsed.title || `FC Barcelona News Digest - ${dateStr}`,
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

    // Generate slug
    const existingSlug = slugify(
      `barca-${result}-${opponent}-${scoreStr}-${dateStr}`
    );

    // Check if chronicle already exists
    const existing = await prisma.newsArticle.findUnique({ where: { slug: existingSlug } });
    if (existing) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "Chronicle already exists for this match.", endedAt: new Date() },
      });
      return existing.id;
    }

    const matchDateObj = new Date(match.utcDate);
    const referee = match.referees?.[0]?.name || "Unknown";
    const competitionName = match.competition.name;
    const venue = isHome ? "Spotify Camp Nou, Barcelona" : "Away";

    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `You are a passionate sports journalist writing for FriendsOfBarca.com, a fan site dedicated to FC Barcelona.

Write a detailed, engaging match chronicle based on the following data.

MATCH DATA:
- Competition: ${competitionName}
- Date: ${matchDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
- ${match.homeTeam.name} ${match.score.fullTime.home} - ${match.score.fullTime.away} ${match.awayTeam.name}
- Half-time: ${halfTimeScore}
- Venue: ${venue}
- Referee: ${referee}
- Result for Barcelona: ${result.toUpperCase()}

Write an engaging match report in English. The article should be 500-800 words. Use ## for section headers. Include:
1. An engaging introduction
2. First half summary
3. Second half summary
4. Key moments and player performances
5. What this means for Barcelona's season

Respond ONLY with valid JSON (no markdown code blocks):
{
  "title": "Engaging headline with score",
  "excerpt": "2-3 sentence summary (max 200 chars)",
  "content": "Full match report with ## section headers",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 160 chars"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if present
    text = text.replace(/^```json\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    const article = await prisma.newsArticle.create({
      data: {
        slug: existingSlug,
        title: parsed.title || `Barcelona ${scoreStr} ${opponent}`,
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
        coverImage: "/images/packages/camp-nou-match.jpg",
        category: "chronicle",
        matchDate: matchDateObj,
        matchResult: `${scoreStr} (${result})`,
        sources: [],
        author: "Friends of Barça AI",
        metaTitle: parsed.metaTitle || "",
        metaDescription: parsed.metaDescription || "",
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
          slug: existingSlug,
          match: `${match.homeTeam.name} ${match.score.fullTime.home}-${match.score.fullTime.away} ${match.awayTeam.name}`,
          competition: competitionName,
        },
        endedAt: new Date(),
      },
    });

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
