import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { indexNewsArticle } from "@/lib/rag";
import { refreshAllCompetitions } from "@/lib/competitions";
import { addApiAlert, clearApiAlert } from "@/lib/api-alerts";
import { slugify } from "@/lib/slugify";

// ── Constants ──
const BARCA_FD_ID = 81;
const FD_BASE = "https://api.football-data.org/v4";
const SETTING_KEY = "LIVE_MATCH";
const PRE_MATCH_MINUTES = 30;
const MATCH_WINDOW_AFTER_MS = 3 * 60 * 60 * 1000;
// Half-time break ~15 min
const HT_BREAK_MINUTES = 15;

// Source budgets per match
const MAX_PERPLEXITY_CALLS = 25;
const MAX_BRAVE_CALLS = 30;
const MAX_GROK_CALLS = 15;

// Commentary tones rotation
const COMMENTARY_TONES = [
  { name: "Analítico", instruction: "Focus on formations, pressing, positioning, spaces, and tactical shape. Analyze the game structure." },
  { name: "Emocional", instruction: "Convey drama, excitement, tension. Use vivid language and capture the emotion of the moment." },
  { name: "Narrativo", instruction: "Tell the story of the match — the narrative arc, tension building, context of what's at stake." },
  { name: "Jugadores", instruction: "Focus on individual player performances, 1v1 duels, standout moments, who's running the show." },
  { name: "Táctico", instruction: "Analyze system changes, defensive line height, transitions, pressing triggers, shape shifts." },
] as const;

// ── Types ──
interface LiveMatchEvent {
  id: string;
  type: string;
  team: "home" | "away";
  player: string;
  minute: number;
  detail?: string;
}

interface LiveMatchCommentary {
  id: string;
  minute: number;
  text: string;
  textEs?: string;
  timestamp: string;
}

interface ContextEntry {
  minute: number;
  source: string;
  text: string;
  timestamp: string;
}

interface LiveMatchData {
  active: boolean;
  matchId?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeCrest: string;
  awayCrest: string;
  competition: string;
  venue: string;
  status: "pre" | "1H" | "HT" | "2H" | "ET1" | "ET2" | "PEN" | "FT";
  minute: number;
  startedAt?: string;
  events: LiveMatchEvent[];
  commentary: LiveMatchCommentary[];
  lastFetchedScore?: { home: number; away: number };
  lastCommentaryMinute?: number;
  lastCommentaryTime?: string;
  chronicleSaved?: boolean;
  sourceRotation?: number;
  // New fields for enhanced chronicle
  contextHistory?: ContextEntry[];
  disabledSources?: Record<string, boolean>;
  sourceBudget?: { perplexity: number; brave: number; grok: number };
  // Pending score: AI sources must confirm score changes on consecutive runs
  pendingScore?: { home: number; away: number; source: string; events?: ScoreData["events"] } | null;
  // Counter for failed chronicle save attempts (auto-deactivate after 3)
  chronicleAttempts?: number;
}

interface ScoreData {
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
  events?: { type: string; team: "home" | "away"; player: string; minute: number; detail?: string }[];
  source: string;
  context?: string; // Extra context from source for commentary
}

// ── Helpers ──
async function getKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch {}
  return process.env[key] || "";
}

function extractJson(raw: string): string {
  let text = raw.trim();
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (m) text = m[1].trim();
  if (!text.startsWith("{") && !text.startsWith("[")) {
    const f = text.indexOf("{");
    const l = text.lastIndexOf("}");
    if (f !== -1 && l > f) text = text.substring(f, l + 1);
  }
  return text;
}

/** Status ordering for comparison */
const STATUS_ORDER: Record<string, number> = { pre: 0, "1H": 1, HT: 2, "2H": 3, ET1: 4, ET2: 5, PEN: 6, FT: 7 };

/** Calculate match minute from elapsed time since kickoff */
function calcMinuteFromTime(startedAt: string): { minute: number; status: "pre" | "1H" | "HT" | "2H" | "FT" } {
  const kickoff = new Date(startedAt).getTime();
  const elapsed = Math.floor((Date.now() - kickoff) / 60000);

  // 1H: 0-47 elapsed (45 min + ~2 min stoppage)
  // HT: 47 to 47+HT_BREAK_MINUTES elapsed
  // 2H: after HT ends, up to ~52 min of play (45 + ~7 stoppage)
  // FT: after 2H ends
  const firstHalfEnd = 47;
  const htEnd = firstHalfEnd + HT_BREAK_MINUTES; // 62

  if (elapsed < 0) return { minute: 0, status: "pre" };
  if (elapsed <= firstHalfEnd) return { minute: Math.min(elapsed, 46), status: "1H" };
  if (elapsed <= htEnd) return { minute: 45, status: "HT" };
  const secondHalfMin = elapsed - htEnd;
  // 2H lasts ~50 real min (45 + ~5 stoppage). After that → FT
  if (secondHalfMin <= 50) return { minute: 45 + Math.min(secondHalfMin, 50), status: "2H" };
  return { minute: 90, status: "FT" };
}

/** Check if two strings are similar (basic Jaccard similarity on words) */
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) { if (wordsB.has(w)) intersection++; }
  return intersection / Math.max(wordsA.size, wordsB.size);
}

/** Normalize player name for dedup (lowercase, strip accents) */
function normalizePlayer(name: string): string {
  return name.toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .trim();
}

/** Validate and sanitize events: goals capped by score, max 2 yellows/player, max 1 sub/player */
function validateEvents(events: LiveMatchEvent[], homeScore: number, awayScore: number): LiveMatchEvent[] {
  const goalTypes = ["goal", "penalty_scored", "own_goal"];
  const homeGoals: LiveMatchEvent[] = [];
  const awayGoals: LiveMatchEvent[] = [];
  const nonGoals: LiveMatchEvent[] = [];

  for (const e of events) {
    if (goalTypes.includes(e.type)) {
      // own_goal counts for the other team
      if (e.type === "own_goal") {
        if (e.team === "home") awayGoals.push(e); else homeGoals.push(e);
      } else {
        if (e.team === "home") homeGoals.push(e); else awayGoals.push(e);
      }
    } else {
      nonGoals.push(e);
    }
  }

  // Trim excess goals — keep earliest by minute
  homeGoals.sort((a, b) => a.minute - b.minute);
  awayGoals.sort((a, b) => a.minute - b.minute);
  const validHome = homeGoals.slice(0, homeScore);
  const validAway = awayGoals.slice(0, awayScore);

  // Validate non-goal events with player-level limits
  const yellowCount: Record<string, number> = {}; // "normalizedName-team" → count
  const subCount: Record<string, number> = {};
  const seen = new Set<string>();
  const validNonGoals: LiveMatchEvent[] = [];

  // Sort by minute so we keep earliest occurrences
  nonGoals.sort((a, b) => a.minute - b.minute);

  for (const e of nonGoals) {
    // Dedup: same type + team + minute
    const dedupKey = `${e.type}-${e.team}-${e.minute}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const playerKey = `${normalizePlayer(e.player)}-${e.team}`;

    if (e.type === "yellow") {
      // Max 2 yellows per player (2nd yellow = red, handled separately)
      const count = yellowCount[playerKey] || 0;
      if (count >= 2) continue;
      yellowCount[playerKey] = count + 1;
    } else if (e.type === "sub") {
      // A player can only be substituted once
      const count = subCount[playerKey] || 0;
      if (count >= 1) continue;
      subCount[playerKey] = count + 1;
    }

    validNonGoals.push(e);
  }

  return [...validHome, ...validAway, ...validNonGoals].sort((a, b) => a.minute - b.minute);
}

// ── Score Sources ──

/** Source 1: football-data.org (La Liga + CL) */
async function fetchFromFootballData(dateStr: string): Promise<ScoreData | null> {
  const fdKey = await getKey("FOOTBALL_DATA_API_KEY");
  if (!fdKey) return null;
  try {
    const res = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?dateFrom=${dateStr}&dateTo=${dateStr}`,
      { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
    );
    if (!res.ok) {
      await addApiAlert("football-data", `${res.status} ${res.statusText}`, res.status, "live match score");
      return null;
    }
    await clearApiAlert("football-data");
    const data = await res.json();
    const matches = data.matches || [];
    if (matches.length === 0) return null;
    const match = matches[0];
    const statusMap: Record<string, string> = {
      SCHEDULED: "pre", TIMED: "pre", IN_PLAY: match.minute > 45 ? "2H" : "1H",
      PAUSED: "HT", HALFTIME: "HT", FINISHED: "FT", EXTRA_TIME: "ET1", PENALTY_SHOOTOUT: "PEN",
    };
    return {
      homeScore: match.score.fullTime.home ?? 0, awayScore: match.score.fullTime.away ?? 0,
      minute: match.minute ?? 0, status: statusMap[match.status] || "1H", source: "football-data.org",
    };
  } catch { return null; }
}

/** Source 2: Brave Search */
async function fetchFromBrave(homeTeam: string, awayTeam: string, query?: string): Promise<ScoreData | null> {
  const braveKey = await getKey("BRAVE_API_KEY");
  if (!braveKey) return null;
  try {
    const q = query || `${homeTeam} vs ${awayTeam} live score today`;
    const params = new URLSearchParams({ q, count: "8", freshness: "pd" });
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: { Accept: "application/json", "X-Subscription-Token": braveKey },
    });
    if (!res.ok) {
      await addApiAlert("brave-search", `${res.status} ${res.statusText}`, res.status, "live match search");
      return null;
    }
    await clearApiAlert("brave-search");
    const data = await res.json();
    const results = data.web?.results || [];
    if (results.length === 0) return null;

    const snippets = results.map((r: { title: string; description: string }) => `${r.title} - ${r.description}`).join("\n");

    const anthropicKey = await getKey("ANTHROPIC_API_KEY");
    if (!anthropicKey) return null;
    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Extract the current score AND key match events/highlights from these search results for ${homeTeam} vs ${awayTeam}.

SEARCH RESULTS:
${snippets}

Respond ONLY with valid JSON (no markdown):
{
  "homeScore": <number>,
  "awayScore": <number>,
  "minute": <number or 0>,
  "status": "<pre|1H|HT|2H|FT|ET1|ET2|PEN>",
  "events": [{"type":"goal|yellow|red|sub|penalty_scored|own_goal","team":"home|away","player":"name","minute":<num>,"detail":"optional"}],
  "context": "<brief summary of what is happening in the match right now, 2-3 sentences>"
}
If you cannot determine the score, respond: {"error": true}`,
      }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(extractJson(text));
    if (parsed.error) return null;
    return { ...parsed, source: "brave-search" };
  } catch { return null; }
}

/** Source 3: Perplexity Sonar (AI + live web search) */
async function fetchFromPerplexity(homeTeam: string, awayTeam: string, competition: string): Promise<ScoreData | null> {
  const pplxKey = await getKey("PERPLEXITY_API_KEY");
  if (!pplxKey) return null;
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${pplxKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages: [{
          role: "user",
          content: `What is the current live score and latest events in the ${competition} match ${homeTeam} vs ${awayTeam} being played right now? Include: goal scorers with minutes, cards (yellow/red), substitutions, possession %, dominant team, pressing intensity, notable player performances. Be specific and factual.`,
        }],
        max_tokens: 600,
        search_recency_filter: "day",
      }),
    });
    if (!res.ok) {
      await addApiAlert("perplexity", `${res.status} ${res.statusText}`, res.status, "live match");
      return null;
    }
    await clearApiAlert("perplexity");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    // Use Claude to parse Perplexity's response into structured data
    const anthropicKey = await getKey("ANTHROPIC_API_KEY");
    if (!anthropicKey) return { homeScore: 0, awayScore: 0, minute: 0, status: "1H", source: "perplexity", context: content };

    const client = new Anthropic({ apiKey: anthropicKey });
    const parseRes = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Parse this live match report into structured JSON. Match: ${homeTeam} vs ${awayTeam}.

REPORT:
${content}

Respond ONLY with JSON (no markdown):
{
  "homeScore": <number>,
  "awayScore": <number>,
  "minute": <number or 0>,
  "status": "<pre|1H|HT|2H|FT|ET1|ET2|PEN>",
  "events": [{"type":"goal|yellow|red|sub|penalty_scored|own_goal","team":"home|away","player":"name","minute":<num>,"detail":"optional"}],
  "context": "<key tactical/contextual info from the report, 2-3 sentences>"
}
If info insufficient: {"error": true}`,
      }],
    });
    const text = parseRes.content[0].type === "text" ? parseRes.content[0].text : "";
    const parsed = JSON.parse(extractJson(text));
    if (parsed.error) return null;
    return { ...parsed, source: "perplexity" };
  } catch { return null; }
}

/** Source 4: Grok (xAI - has real-time knowledge) */
async function fetchFromGrok(homeTeam: string, awayTeam: string, competition: string): Promise<ScoreData | null> {
  const grokKey = await getKey("GROK_API_KEY");
  if (!grokKey) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${grokKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [{
          role: "user",
          content: `What is the current live score and minute in the ${competition} match ${homeTeam} vs ${awayTeam} being played right now today? List goal scorers with minutes, any cards, and key events. Be factual and specific.`,
        }],
        max_tokens: 500,
      }),
    });
    if (!res.ok) {
      await addApiAlert("grok", `${res.status} ${res.statusText}`, res.status, "live match");
      return null;
    }
    await clearApiAlert("grok");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    // Parse with Claude
    const anthropicKey = await getKey("ANTHROPIC_API_KEY");
    if (!anthropicKey) return { homeScore: 0, awayScore: 0, minute: 0, status: "1H", source: "grok", context: content };

    const client = new Anthropic({ apiKey: anthropicKey });
    const parseRes = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Parse this live match info into JSON. Match: ${homeTeam} vs ${awayTeam}.

INFO:
${content}

Respond ONLY with JSON (no markdown):
{
  "homeScore": <number>,
  "awayScore": <number>,
  "minute": <number or 0>,
  "status": "<pre|1H|HT|2H|FT|ET1|ET2|PEN>",
  "events": [{"type":"goal|yellow|red|sub|penalty_scored|own_goal","team":"home|away","player":"name","minute":<num>,"detail":""}],
  "context": "<key context, 2-3 sentences>"
}
If info insufficient: {"error": true}`,
      }],
    });
    const text = parseRes.content[0].type === "text" ? parseRes.content[0].text : "";
    const parsed = JSON.parse(extractJson(text));
    if (parsed.error) return null;
    return { ...parsed, source: "grok" };
  } catch { return null; }
}

// ── Commentary ──

async function generateCommentary(
  match: LiveMatchData,
  scoreData: ScoreData | null,
  newEvents: LiveMatchEvent[],
  statusChanged: boolean,
): Promise<{ text: string; textEs: string }[]> {
  const anthropicKey = await getKey("ANTHROPIC_API_KEY");
  if (!anthropicKey) return [];

  const hasGoal = newEvents.some(e => ["goal", "penalty_scored", "own_goal"].includes(e.type));
  const hasRedCard = newEvents.some(e => e.type === "red");
  const context = scoreData?.context || "";

  // Build situation description
  const scoreStr = `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`;
  const minute = match.minute;

  // Build context from history (last 5 entries)
  const recentContext = (match.contextHistory || []).slice(-5)
    .map(c => `[${c.minute}' ${c.source}] ${c.text}`).join("\n");

  // Select tone based on commentary count
  const commCount = match.commentary.length;
  const tone = COMMENTARY_TONES[commCount % COMMENTARY_TONES.length];

  const results: { text: string; textEs: string }[] = [];
  const client = new Anthropic({ apiKey: anthropicKey });

  // ── Helper to generate one commentary ──
  async function genOne(prompt: string, toneOverride?: string): Promise<{ text: string; textEs: string } | null> {
    try {
      const toneInstruction = toneOverride || tone.instruction;
      const prevComm = match.commentary.slice(-6).map(c => c.text).join(" | ");
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 400,
        system: `You are a professional live football commentator for FriendsOfBarca.com covering FC Barcelona. Your tone for this commentary: ${toneInstruction}. Be vivid, specific, and engaging.`,
        messages: [{
          role: "user",
          content: `${prompt}

${recentContext ? `MATCH CONTEXT FROM SOURCES:\n${recentContext}\n` : ""}
Recent commentary (DO NOT repeat similar ideas): ${prevComm || "none yet"}

Write an engaging live commentary line (2-3 sentences). Be specific — mention players, positions, tactical details. Vary phrasing from previous entries.
Respond ONLY with JSON: {"text": "English", "textEs": "Spanish"}`,
        }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      return JSON.parse(extractJson(text));
    } catch { return null; }
  }

  // ── Build prompt based on situation ──
  if (hasGoal) {
    // DOUBLE commentary for goals
    const goals = newEvents.filter(e => ["goal", "penalty_scored", "own_goal"].includes(e.type));
    const desc = goals.map(e => `${e.type === "own_goal" ? "Own goal by" : "Goal by"} ${e.player} (${e.team === "home" ? match.homeTeam : match.awayTeam}) at ${e.minute}'`).join(". ");

    // 1. Immediate factual reaction
    const factual = await genOne(
      `GOAL! ${desc}. Score: ${scoreStr}. Min ${minute}'.${context ? ` Context: ${context}` : ""}`,
      "React with immediate excitement and emotion. Describe the goal celebration, the crowd reaction. Be dramatic and vivid."
    );
    if (factual) results.push(factual);

    // 2. Tactical analysis of the goal
    const analysis = await genOne(
      `Analyze the goal(s): ${desc}. Score now: ${scoreStr}. Min ${minute}'.${context ? ` Context: ${context}` : ""} How was the goal created? What tactical move led to it?`,
      "Analyze the tactical build-up to the goal. Discuss the movement, the pass sequence, the defensive error or the brilliant play that created the chance."
    );
    if (analysis) results.push(analysis);

  } else if (hasRedCard) {
    // DOUBLE commentary for red cards
    const cards = newEvents.filter(e => e.type === "red");
    const desc = cards.map(e => `Red card: ${e.player} (${e.team === "home" ? match.homeTeam : match.awayTeam}) ${e.minute}'`).join(". ");

    // 1. Immediate reaction
    const reaction = await genOne(
      `RED CARD! ${desc}. Score: ${scoreStr}. Min ${minute}'.`,
      "React with shock and drama. Describe the foul, the referee's decision, the immediate impact on the game."
    );
    if (reaction) results.push(reaction);

    // 2. Tactical implications
    const implications = await genOne(
      `Red card impact: ${desc}. Score: ${scoreStr}. Min ${minute}'. How will the team reorganize with 10 men?`,
      "Analyze the tactical implications: formation change, who drops back, how the other team will exploit the extra man."
    );
    if (implications) results.push(implications);

  } else if (statusChanged) {
    const labels: Record<string, string> = {
      "1H": "Kick off!", "HT": `Half-time. ${scoreStr}`, "2H": "Second half begins!",
      "FT": `Full time! ${scoreStr}`, "ET1": "Extra time!", "PEN": "Penalties!",
    };
    const comm = await genOne(
      `${labels[match.status] || "Status change"}. ${match.competition}. Min ${minute}'.${context ? ` Context: ${context}` : ""}`
    );
    if (comm) results.push(comm);
  } else {
    // Regular update with context
    const comm = await genOne(
      `Live update at minute ${minute}'. ${scoreStr}. ${match.competition}.${context ? ` Here's what's happening: ${context}` : ""} Write an engaging observation about the match state.`
    );
    if (comm) results.push(comm);
  }

  return results;
}

// ── Chronicle saving ──

async function saveChronicle(match: LiveMatchData): Promise<string | null> {
  if (match.chronicleSaved) return null;
  const anthropicKey = await getKey("ANTHROPIC_API_KEY");
  if (!anthropicKey) return null;

  const isHome = match.venue === "home";
  const barcaScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const result = barcaScore > oppScore ? "win" : barcaScore < oppScore ? "loss" : "draw";
  const dateStr = (match.startedAt || new Date().toISOString()).slice(0, 10);

  // Check for existing chronicle (legacy slug pattern)
  const legacyLiveSlug = slugify(`live-chronicle-barca-${result}-${opponent}-${barcaScore}-${oppScore}-${dateStr}`);
  const existing = await prisma.newsArticle.findFirst({
    where: { OR: [{ slug: legacyLiveSlug }, { oldSlug: legacyLiveSlug }], category: "chronicle" },
  });
  if (existing) return existing.id;

  const sortedEvents = [...match.events].sort((a, b) => a.minute - b.minute);
  const eventLines = sortedEvents.map(e => {
    const team = e.team === "home" ? match.homeTeam : match.awayTeam;
    const icons: Record<string, string> = { goal: "⚽", penalty_scored: "⚽(P)", own_goal: "⚽(OG)", yellow: "🟨", red: "🟥", sub: "🔄", var: "📺" };
    return `${e.minute}' ${icons[e.type] || "•"} ${e.player} (${team})${e.detail ? ` - ${e.detail}` : ""}`;
  }).join("\n");

  const sortedComm = [...match.commentary].sort((a, b) => a.minute - b.minute);
  const commLines = sortedComm.map(c => `${c.minute}' - ${c.text}`).join("\n");

  // Build context dossier grouped by phase
  const contextHistory = match.contextHistory || [];
  const firstHalfCtx = contextHistory.filter(c => c.minute <= 45).map(c => `[${c.minute}' ${c.source}] ${c.text}`).join("\n");
  const secondHalfCtx = contextHistory.filter(c => c.minute > 45).map(c => `[${c.minute}' ${c.source}] ${c.text}`).join("\n");

  try {
    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      system: `You are a professional sports journalist for FriendsOfBarca.com, the leading English-language FC Barcelona community. Write with authority, passion, and deep tactical insight. Your chronicles are known for their vivid storytelling and sharp analysis.`,
      messages: [{
        role: "user",
        content: `Write a detailed, professional match chronicle from this LIVE data.

MATCH: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}
Competition: ${match.competition} | Date: ${dateStr} | Venue: ${match.venue === "home" ? "Camp Nou (Home)" : "Away"}
Result for Barcelona: ${result.toUpperCase()}

EVENTS:
${eventLines || "No detailed events recorded"}

LIVE COMMENTARY (real-time observations during the match):
${commLines || "No commentary"}

FIRST HALF CONTEXT FROM SOURCES:
${firstHalfCtx || "No additional context"}

SECOND HALF CONTEXT FROM SOURCES:
${secondHalfCtx || "No additional context"}

REQUIRED STRUCTURE (800-1200 words per language):
1. **Dramatic headline** with the score and key narrative
2. **Opening** (~150 words): Set the scene — what was at stake, the atmosphere, pre-match context
3. **First Half** (~250 words): Narrative of the first 45 minutes — tactical approach, key moments, turning points
4. **Second Half** (~250 words): How the game evolved — substitutions impact, tactical shifts, goals described in vivid detail
5. **Player Spotlight** (~150 words): 2-3 standout performers with specific observations about their game
6. **Looking Ahead** (~100 words): What this result means for the season, upcoming fixtures, implications

STYLE GUIDELINES:
- Use vivid, cinematic language for key moments
- Include tactical analysis (formations, pressing, transitions)
- Reference specific minutes for key events
- Build narrative tension throughout
- End with a forward-looking perspective

Respond ONLY with JSON (no markdown):
{"title":"English headline with score","titleEs":"Spanish headline","excerpt":"2-3 sentences max 200 chars","excerptEs":"Spanish","content":"Full markdown article","contentEs":"Spanish full markdown article","metaTitle":"SEO <60 chars","metaTitleEs":"Spanish","metaDescription":"SEO <160 chars","metaDescriptionEs":"Spanish"}`,
      }],
    });
    let text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(extractJson(text));
    const pool = ["/images/packages/camp-nou-match.jpg", "/images/packages/camp-nou-aerial.jpg", "/images/packages/camp-nou-night.jpg"];

    // Generate SEO-friendly slug from AI title
    const liveTitle = parsed.title || `Barcelona ${barcaScore}-${oppScore} ${opponent}`;
    let liveSlug = slugify(liveTitle);
    const liveSlugExists = await prisma.newsArticle.findUnique({ where: { slug: liveSlug } });
    if (liveSlugExists) liveSlug = `${liveSlug}-${dateStr}`;

    const article = await prisma.newsArticle.create({
      data: {
        slug: liveSlug, title: liveTitle,
        titleEs: parsed.titleEs || null, excerpt: parsed.excerpt || "", excerptEs: parsed.excerptEs || null,
        content: parsed.content || "", contentEs: parsed.contentEs || null,
        coverImage: pool[Math.floor(Math.random() * pool.length)],
        category: "chronicle", matchDate: match.startedAt ? new Date(match.startedAt) : new Date(),
        matchResult: `${barcaScore}-${oppScore} (${result})`, sources: [],
        author: "Friends of Barça AI", metaTitle: parsed.metaTitle || "",
        metaTitleEs: parsed.metaTitleEs || null, metaDescription: parsed.metaDescription || "",
        metaDescriptionEs: parsed.metaDescriptionEs || null,
      },
    });
    try { await indexNewsArticle(article.id); } catch {}
    return article.id;
  } catch (e) {
    console.error("[LiveAuto] Chronicle save error:", e);
    return null;
  }
}

// ── Main ──

export async function runLiveMatchAuto(): Promise<{ action: string; details?: unknown }> {
  const now = new Date();

  // 1. Read current state
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  let lm: LiveMatchData | null = null;
  if (setting?.value) { try { lm = JSON.parse(setting.value); } catch {} }

  // 2. No active match → check if one should start
  if (!lm || !lm.active) {
    // FT but chronicle not yet saved → save it now instead of reactivating
    if (lm && lm.status === "FT" && !lm.chronicleSaved) {
      try {
        const articleId = await saveChronicle(lm);
        lm.chronicleSaved = true;
        await prisma.setting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(lm) } });
        refreshAllCompetitions().catch(err => console.error("[live-match] Competition refresh failed:", err));
        return { action: "chronicle_saved", details: { articleId } };
      } catch (err) {
        console.error("[LiveAuto] Chronicle save failed (inactive path):", err);
        const attempts = (lm.chronicleAttempts || 0) + 1;
        lm.chronicleAttempts = attempts;
        if (attempts >= 3) {
          lm.chronicleSaved = true; // Give up after 3 attempts
          console.log("[LiveAuto] Giving up on chronicle after 3 failed attempts");
        }
        await prisma.setting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(lm) } });
        return { action: "chronicle_failed", details: { attempt: attempts } };
      }
    }

    // Don't re-activate a match that already has a chronicle saved or is marked FT
    if (lm && (lm.chronicleSaved || lm.status === "FT")) {
      return { action: "match_ended" };
    }

    const upcoming = await prisma.match.findFirst({
      where: {
        date: { gte: new Date(now.getTime() - MATCH_WINDOW_AFTER_MS), lte: new Date(now.getTime() + PRE_MATCH_MINUTES * 60 * 1000) },
      },
      orderBy: { date: "asc" },
    });
    if (!upcoming) return { action: "no_match" };

    // Skip if this is the same match that was already completed with chronicle
    if (lm && lm.matchId === upcoming.id && (lm.status === "FT" || lm.chronicleSaved)) {
      return { action: "match_ended" };
    }

    const elapsed = now.getTime() - upcoming.date.getTime();
    if (elapsed > 2.5 * 60 * 60 * 1000) return { action: "match_too_old" };

    const isHome = upcoming.venue === "home";
    const newMatch: LiveMatchData = {
      active: true, matchId: upcoming.id,
      homeTeam: isHome ? "FC Barcelona" : upcoming.opponent,
      awayTeam: isHome ? upcoming.opponent : "FC Barcelona",
      homeScore: 0, awayScore: 0,
      homeCrest: isHome ? "/images/fcb-crest.png" : upcoming.opponentLogo,
      awayCrest: isHome ? upcoming.opponentLogo : "/images/fcb-crest.png",
      competition: upcoming.competition, venue: upcoming.venue,
      status: elapsed >= 0 ? "1H" : "pre",
      minute: elapsed >= 0 ? Math.min(Math.floor(elapsed / 60000), 45) : 0,
      startedAt: upcoming.date.toISOString(),
      events: [], commentary: [], lastCommentaryMinute: -10, sourceRotation: 0,
      contextHistory: [], disabledSources: {}, sourceBudget: { perplexity: 0, brave: 0, grok: 0 },
      pendingScore: null,
    };

    // Inject match preview context if available
    try {
      const preview = await prisma.newsArticle.findFirst({
        where: {
          category: "preview",
          OR: [
            { title: { contains: upcoming.opponent, mode: "insensitive" } },
            { titleEs: { contains: upcoming.opponent, mode: "insensitive" } },
          ],
          publishedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { publishedAt: "desc" },
      });
      if (preview?.content) {
        const previewSnippet = preview.content.slice(0, 500);
        newMatch.contextHistory!.push({
          minute: 0, source: "match-preview",
          text: `Pre-match: ${previewSnippet}`,
          timestamp: now.toISOString(),
        });
      }
    } catch {}

    newMatch.commentary.push({
      id: crypto.randomUUID(), minute: 0,
      text: elapsed >= 0
        ? `Kick off! ${newMatch.homeTeam} vs ${newMatch.awayTeam} in the ${newMatch.competition}!`
        : `Welcome! ${newMatch.homeTeam} vs ${newMatch.awayTeam} in the ${newMatch.competition}. Kick off coming soon!`,
      textEs: elapsed >= 0
        ? `¡Comienza el partido! ${newMatch.homeTeam} vs ${newMatch.awayTeam} en la ${newMatch.competition}.`
        : `¡Bienvenidos! ${newMatch.homeTeam} vs ${newMatch.awayTeam} en la ${newMatch.competition}. ¡Empieza en breve!`,
      timestamp: now.toISOString(),
    });

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(newMatch) },
      create: { key: SETTING_KEY, value: JSON.stringify(newMatch) },
    });
    return { action: "activated", details: { status: newMatch.status, teams: `${newMatch.homeTeam} vs ${newMatch.awayTeam}` } };
  }

  // 3. Match finished → save chronicle
  if (lm.status === "FT") {
    if (!lm.chronicleSaved) {
      const articleId = await saveChronicle(lm);
      lm.chronicleSaved = true;
      lm.active = false;
      await prisma.setting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(lm) } });
      // Refresh competitions async (fire-and-forget)
      refreshAllCompetitions().catch(err => console.error("[live-match] Competition refresh failed:", err));
      return { action: "chronicle_saved", details: { articleId } };
    }
    return { action: "match_ended" };
  }

  // Initialize new fields if missing (backward compat with existing live match data)
  if (!lm.contextHistory) lm.contextHistory = [];
  if (!lm.disabledSources) lm.disabledSources = {};
  if (!lm.sourceBudget) lm.sourceBudget = { perplexity: 0, brave: 0, grok: 0 };
  if (lm.pendingScore === undefined) lm.pendingScore = null;

  // 4. Advance minute/status from elapsed time (only forward, never backwards)
  if (lm.startedAt) {
    const calc = calcMinuteFromTime(lm.startedAt);
    const calcOrder = STATUS_ORDER[calc.status] ?? 0;
    const currentOrder = STATUS_ORDER[lm.status] ?? 0;

    // Only use time calc if it would advance us forward (not drag backwards)
    if (calcOrder > currentOrder) {
      // Time says we should be in a later phase
      lm.status = calc.status;
      if (calc.minute > lm.minute) lm.minute = calc.minute;
    } else if (calcOrder === currentOrder && calc.minute > lm.minute) {
      // Same phase, but time says minute should be higher
      lm.minute = calc.minute;
    }
    // If sources already moved us ahead of time calc, DON'T go backwards
  }

  // 5. Cascading source fetch — priority with fallback
  const rotation = (lm.sourceRotation || 0);
  lm.sourceRotation = rotation + 1;

  let scoreData: ScoreData | null = null;
  const dateStr = (lm.startedAt || now.toISOString()).slice(0, 10);

  // Always try football-data.org first (fastest, free, no AI cost)
  scoreData = await fetchFromFootballData(dateStr);

  // If no data from football-data, cascade through sources
  if (!scoreData) {
    const disabled = lm.disabledSources || {};
    const budget = lm.sourceBudget!;

    // Alternate primary between Perplexity and Brave each run
    const primaryIsPerplexity = rotation % 2 === 0;

    // Build ordered cascade based on alternation
    type SourceFn = () => Promise<ScoreData | null>;
    const cascade: { name: string; fn: SourceFn; budgetKey: "perplexity" | "brave" | "grok"; max: number }[] = [];

    if (primaryIsPerplexity) {
      if (!disabled.perplexity && budget.perplexity < MAX_PERPLEXITY_CALLS) {
        cascade.push({ name: "perplexity", fn: () => fetchFromPerplexity(lm!.homeTeam, lm!.awayTeam, lm!.competition), budgetKey: "perplexity", max: MAX_PERPLEXITY_CALLS });
      }
      if (!disabled.brave && budget.brave < MAX_BRAVE_CALLS) {
        // Alternate EN/ES queries
        const braveQuery = rotation % 4 < 2
          ? `${lm.homeTeam} vs ${lm.awayTeam} live score ${lm.competition} today`
          : `${lm.homeTeam} ${lm.awayTeam} resultado crónica en directo ${lm.competition}`;
        cascade.push({ name: "brave", fn: () => fetchFromBrave(lm!.homeTeam, lm!.awayTeam, braveQuery), budgetKey: "brave", max: MAX_BRAVE_CALLS });
      }
    } else {
      if (!disabled.brave && budget.brave < MAX_BRAVE_CALLS) {
        const braveQuery = rotation % 4 < 2
          ? `${lm.homeTeam} vs ${lm.awayTeam} live score ${lm.competition} today`
          : `${lm.homeTeam} ${lm.awayTeam} resultado crónica en directo ${lm.competition}`;
        cascade.push({ name: "brave", fn: () => fetchFromBrave(lm!.homeTeam, lm!.awayTeam, braveQuery), budgetKey: "brave", max: MAX_BRAVE_CALLS });
      }
      if (!disabled.perplexity && budget.perplexity < MAX_PERPLEXITY_CALLS) {
        cascade.push({ name: "perplexity", fn: () => fetchFromPerplexity(lm!.homeTeam, lm!.awayTeam, lm!.competition), budgetKey: "perplexity", max: MAX_PERPLEXITY_CALLS });
      }
    }
    // Grok always last in cascade
    if (!disabled.grok && budget.grok < MAX_GROK_CALLS) {
      cascade.push({ name: "grok", fn: () => fetchFromGrok(lm!.homeTeam, lm!.awayTeam, lm!.competition), budgetKey: "grok", max: MAX_GROK_CALLS });
    }

    // Try each source in order until one succeeds
    for (const src of cascade) {
      try {
        const result = await src.fn();
        budget[src.budgetKey]++;
        if (result) {
          scoreData = result;
          break;
        }
      } catch {
        // Mark as disabled if auth error (caught inside fetchers, but just in case)
        disabled[src.name] = true;
      }
    }

    lm.disabledSources = disabled;
    lm.sourceBudget = budget;
  }

  // 6. Process score data
  const newEvents: LiveMatchEvent[] = [];
  let statusChanged = false;

  if (scoreData) {
    // Store context in history buffer
    if (scoreData.context) {
      lm.contextHistory!.push({
        minute: lm.minute,
        source: scoreData.source,
        text: scoreData.context,
        timestamp: now.toISOString(),
      });
      // Keep max 30 entries
      if (lm.contextHistory!.length > 30) {
        lm.contextHistory = lm.contextHistory!.slice(-30);
      }
    }

    const prev = { home: lm.homeScore, away: lm.awayScore };

    // Score change detection
    const scoreChanged = scoreData.homeScore !== prev.home || scoreData.awayScore !== prev.away;
    const scoreIncreased = scoreData.homeScore >= prev.home && scoreData.awayScore >= prev.away;
    const isTrustedSource = scoreData.source === "football-data.org";

    // For trusted sources (football-data.org): accept immediately
    // For AI sources (brave/perplexity/grok): require confirmation via pendingScore
    let acceptScore = false;

    if (scoreIncreased && scoreChanged) {
      if (isTrustedSource) {
        // football-data.org is authoritative — accept immediately, clear pending
        acceptScore = true;
        lm.pendingScore = null;
      } else {
        // AI source: check if pending score matches (confirmation)
        if (lm.pendingScore &&
            lm.pendingScore.home === scoreData.homeScore &&
            lm.pendingScore.away === scoreData.awayScore) {
          // Confirmed by 2nd source/run — accept
          acceptScore = true;
          // Use pending events if current source has none
          if (!scoreData.events?.length && lm.pendingScore.events?.length) {
            scoreData.events = lm.pendingScore.events;
          }
          lm.pendingScore = null;
        } else {
          // First time seeing this score — store as pending, don't apply yet
          lm.pendingScore = {
            home: scoreData.homeScore,
            away: scoreData.awayScore,
            source: scoreData.source,
            events: scoreData.events,
          };
        }
      }
    } else if (!scoreChanged) {
      // Score matches current — if there was a pending different score, clear it (source disagrees)
      if (lm.pendingScore &&
          (lm.pendingScore.home !== prev.home || lm.pendingScore.away !== prev.away)) {
        lm.pendingScore = null; // Source confirmed current score, not the pending one
      }
    }

    if (acceptScore && scoreIncreased) {
      const homeDiff = scoreData.homeScore - prev.home;
      const awayDiff = scoreData.awayScore - prev.away;

      // Track which source events we've used (by index) to avoid reusing same source event
      const usedSourceIdx = new Set<number>();

      for (let i = 0; i < Math.max(0, homeDiff); i++) {
        const idx = scoreData.events?.findIndex((e, idx) =>
          !usedSourceIdx.has(idx) && e.team === "home" &&
          ["goal", "penalty_scored", "own_goal"].includes(e.type));
        const detail = idx !== undefined && idx >= 0 ? scoreData.events![idx] : undefined;
        if (detail && idx !== undefined) usedSourceIdx.add(idx);
        const evt: LiveMatchEvent = {
          id: crypto.randomUUID(), type: detail?.type || "goal", team: "home",
          player: detail?.player || "Unknown", minute: detail?.minute || lm.minute, detail: detail?.detail,
        };
        newEvents.push(evt);
        lm.events.push(evt);
      }
      for (let i = 0; i < Math.max(0, awayDiff); i++) {
        const idx = scoreData.events?.findIndex((e, idx) =>
          !usedSourceIdx.has(idx) && e.team === "away" &&
          ["goal", "penalty_scored", "own_goal"].includes(e.type));
        const detail = idx !== undefined && idx >= 0 ? scoreData.events![idx] : undefined;
        if (detail && idx !== undefined) usedSourceIdx.add(idx);
        const evt: LiveMatchEvent = {
          id: crypto.randomUUID(), type: detail?.type || "goal", team: "away",
          player: detail?.player || "Unknown", minute: detail?.minute || lm.minute, detail: detail?.detail,
        };
        newEvents.push(evt);
        lm.events.push(evt);
      }

      lm.homeScore = scoreData.homeScore;
      lm.awayScore = scoreData.awayScore;
    }

    // Non-goal events: dedup by type+team+minute (ignore player name variations)
    if (scoreData.events) {
      for (const e of scoreData.events) {
        if (!["goal", "penalty_scored", "own_goal"].includes(e.type)) {
          const isDup = lm.events.some(x => x.type === e.type && x.team === e.team && Math.abs(x.minute - e.minute) <= 1);
          if (!isDup) {
            const evt: LiveMatchEvent = { id: crypto.randomUUID(), ...e };
            newEvents.push(evt);
            lm.events.push(evt);
          }
        }
      }
    }

    // Use source minute if it's more advanced, but cap AI sources to ±5 of time calc
    if (scoreData.minute > lm.minute) {
      const isTrustedMinute = scoreData.source === "football-data.org";
      if (isTrustedMinute) {
        lm.minute = scoreData.minute;
      } else {
        // AI sources: only accept if within 5 minutes of time calc (prevent hallucinated jumps)
        const timeCalc = lm.startedAt ? calcMinuteFromTime(lm.startedAt) : null;
        const maxAllowed = (timeCalc?.minute ?? lm.minute) + 5;
        lm.minute = Math.min(scoreData.minute, maxAllowed);
      }
    }

    // Status from source (only forward transitions, with FT protection)
    const srcOrder = STATUS_ORDER[scoreData.status] ?? 0;
    const curOrder = STATUS_ORDER[lm.status] ?? 0;
    if (scoreData.status && srcOrder > curOrder) {
      const isTrustedSource = scoreData.source === "football-data.org";
      // FT protection: AI sources can only set FT if real-time clock says minute >= 85
      // This prevents hallucinated "FT" from ending the match prematurely
      if (scoreData.status === "FT" && !isTrustedSource) {
        const timeCalc = lm.startedAt ? calcMinuteFromTime(lm.startedAt) : null;
        const timeMinute = timeCalc?.minute ?? lm.minute;
        if (timeMinute < 85) {
          // Too early for FT — ignore this status, keep current
          console.log(`[LiveAuto] Rejected premature FT from ${scoreData.source} (time calc minute: ${timeMinute})`);
        } else {
          lm.status = "FT";
          statusChanged = true;
        }
      } else {
        lm.status = scoreData.status as LiveMatchData["status"];
        statusChanged = true;
      }
    }

    lm.lastFetchedScore = { home: scoreData.homeScore, away: scoreData.awayScore };
  }

  // Validate events: no more goal events than the score allows + remove duplicates
  lm.events = validateEvents(lm.events, lm.homeScore, lm.awayScore);

  // Ensure minute is consistent with status
  if (lm.status === "2H" && lm.minute < 46) lm.minute = 46;
  if (lm.status === "HT" && lm.minute < 45) lm.minute = 45;
  if (lm.status === "FT" && lm.minute < 90) lm.minute = 90;

  // Note: minute is driven by calcMinuteFromTime (real-time) and source data.
  // No manual increment — prevents minute drift from accumulating +1 per cron run.

  // 7. Generate commentary — based on real time elapsed since last comment
  const lastCommTime = lm.lastCommentaryTime ? new Date(lm.lastCommentaryTime).getTime() : 0;
  const secsSinceLastComm = (now.getTime() - lastCommTime) / 1000;
  const hasNewEvents = newEvents.length > 0;
  // Generate if: new events, status change, or >90s since last commentary
  const shouldComment = hasNewEvents || statusChanged || secsSinceLastComm >= 90;

  if (shouldComment && ["1H", "2H", "HT", "ET1", "ET2", "PEN"].includes(lm.status)) {
    const commentaries = await generateCommentary(lm, scoreData, newEvents, statusChanged);
    for (const comm of commentaries) {
      // Check similarity with recent commentary to avoid repetition (window=6, threshold=0.5)
      const recentTexts = lm.commentary.slice(-6).map(c => c.text);
      const isTooSimilar = recentTexts.some(prev => textSimilarity(prev, comm.text) > 0.5);

      if (!isTooSimilar) {
        lm.commentary.push({
          id: crypto.randomUUID(), minute: lm.minute,
          text: comm.text, textEs: comm.textEs, timestamp: now.toISOString(),
        });
        lm.lastCommentaryMinute = lm.minute;
        lm.lastCommentaryTime = now.toISOString();
      }
    }
  }

  // Hard timeout: if match has been active for >3 hours, force FT and deactivate
  // This prevents zombie matches stuck in 1H/2H due to source/chronicle errors
  if (lm.startedAt) {
    const elapsedMs = Date.now() - new Date(lm.startedAt).getTime();
    const MAX_ACTIVE_MS = 3 * 60 * 60 * 1000; // 3 hours
    if (elapsedMs > MAX_ACTIVE_MS && lm.status !== "FT") {
      console.log(`[LiveAuto] Hard timeout: match active for ${Math.round(elapsedMs / 60000)}min, forcing FT`);
      lm.status = "FT";
      if (lm.minute < 90) lm.minute = 90;
    }
  }

  // FT → save chronicle (wrapped in try/catch so state always gets saved)
  if (lm.status === "FT" && !lm.chronicleSaved) {
    try {
      const articleId = await saveChronicle(lm);
      lm.chronicleSaved = true;
      console.log(`[LiveAuto] Chronicle saved: ${articleId}`);
      // Refresh competitions async (fire-and-forget)
      refreshAllCompetitions().catch(err => console.error("[live-match] Competition refresh failed:", err));
    } catch (err) {
      console.error("[LiveAuto] Chronicle save failed, will retry next run:", err);
      // Don't set chronicleSaved=true — will retry next cron run
      // But still save the FT status below so the match shows as finished
    }
  }

  // Auto-deactivate: if FT + chronicle saved (or 3 failed attempts), deactivate
  if (lm.status === "FT") {
    const chronicleAttempts = (lm.chronicleAttempts || 0) + (!lm.chronicleSaved ? 1 : 0);
    lm.chronicleAttempts = chronicleAttempts;
    if (lm.chronicleSaved || chronicleAttempts >= 3) {
      lm.active = false;
      if (!lm.chronicleSaved) {
        console.log(`[LiveAuto] Deactivating after ${chronicleAttempts} failed chronicle attempts`);
      }
    }
  }

  // 8. Save (always executes — state is persisted even if chronicle failed)
  await prisma.setting.update({ where: { key: SETTING_KEY }, data: { value: JSON.stringify(lm) } });

  return {
    action: "updated",
    details: {
      status: lm.status, minute: lm.minute, score: `${lm.homeScore}-${lm.awayScore}`,
      events: lm.events.length, commentary: lm.commentary.length,
      source: scoreData?.source || "time-only",
      budget: lm.sourceBudget,
      contextEntries: lm.contextHistory?.length || 0,
      pendingScore: lm.pendingScore || null,
    },
  };
}
