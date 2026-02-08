import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const BARCA_ID = 529; // FC Barcelona ID in API-Football (api-sports.io)
const FOOTBALL_API_BASE = "https://v3.football.api-sports.io";

interface StandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

interface MatchEntry {
  fixture: { id: number; date: string; status: { short: string } };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  league: { id: number; name: string; logo: string };
  goals: { home: number | null; away: number | null };
}

const COMPETITIONS = [
  { leagueId: 140, id: "la-liga", name: "La Liga", hasStandings: true },
  { leagueId: 2, id: "champions-league", name: "Champions League", hasStandings: true },
  { leagueId: 143, id: "copa-del-rey", name: "Copa del Rey", hasStandings: false },
];

async function getApiKey(): Promise<string> {
  try {
    const dbSetting = await prisma.setting.findUnique({ where: { key: "API_FOOTBALL_KEY" } });
    if (dbSetting?.value) return dbSetting.value;
  } catch { /* fallback */ }
  return process.env.API_FOOTBALL_KEY || "";
}

async function getAnthropicKey(): Promise<string> {
  try {
    const dbSetting = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (dbSetting?.value) return dbSetting.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

function getCurrentSeason(): number {
  const now = new Date();
  // Football seasons span two years: 2025-26 season starts mid-2025
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

async function fetchApi(endpoint: string): Promise<unknown> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("API_FOOTBALL_KEY not configured");

  const res = await fetch(`${FOOTBALL_API_BASE}${endpoint}`, {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Football API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function fetchStandings(leagueId: number): Promise<{ standings: StandingEntry[]; season: number }> {
  try {
    const season = getCurrentSeason();
    const data = (await fetchApi(`/standings?league=${leagueId}&season=${season}`)) as {
      response: Array<{
        league: {
          standings: StandingEntry[][];
        };
      }>;
    };

    let firstResponse = data.response?.[0];
    let usedSeason = season;

    // Fallback to previous season if current season has no data (free tier limitation)
    if (!firstResponse?.league?.standings?.[0] && season > 2022) {
      usedSeason = season - 1;
      const fallbackData = (await fetchApi(`/standings?league=${leagueId}&season=${usedSeason}`)) as {
        response: Array<{
          league: {
            standings: StandingEntry[][];
          };
        }>;
      };
      firstResponse = fallbackData.response?.[0];
    }

    if (!firstResponse?.league?.standings?.[0]) return { standings: [], season: usedSeason };
    return { standings: firstResponse.league.standings[0], season: usedSeason };
  } catch (err) {
    console.error(`Error fetching standings for league ${leagueId}:`, err);
    return { standings: [], season: getCurrentSeason() };
  }
}

async function fetchBarcaUpcoming(season: number): Promise<MatchEntry[]> {
  try {
    const now = new Date();
    const fromDate = now.toISOString().slice(0, 10);
    const toDate = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);

    const data = (await fetchApi(`/fixtures?team=${BARCA_ID}&from=${fromDate}&to=${toDate}&season=${season}`)) as {
      response: MatchEntry[];
    };

    const matches = data.response || [];
    return matches.filter((m) => ["NS", "TBD", "PST"].includes(m.fixture.status.short));
  } catch (err) {
    console.error("Error fetching upcoming matches:", err);
    return [];
  }
}

async function fetchBarcaRecentResults(season: number): Promise<MatchEntry[]> {
  try {
    // Get all finished matches from the season
    const data = (await fetchApi(`/fixtures?team=${BARCA_ID}&season=${season}&status=FT-AET-PEN`)) as {
      response: MatchEntry[];
    };

    const matches = data.response || [];
    // Sort by date desc - return all so each competition can take its own slice
    return matches.sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
  } catch (err) {
    console.error("Error fetching recent results:", err);
    return [];
  }
}

async function generateAiPrediction(
  competitionName: string,
  barcaStats: {
    position: number;
    points: number;
    played: number;
    won: number;
    draw: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  },
  standings: StandingEntry[],
  upcomingMatches: MatchEntry[]
): Promise<{
  prediction: string;
  explanation: string;
  seasonForecast: string;
  seasonExplanation: string;
}> {
  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) {
    return {
      prediction: "AI predictions unavailable - API key not configured.",
      explanation: "",
      seasonForecast: "",
      seasonExplanation: "",
    };
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const top8 = standings.slice(0, 8).map(
    (s) => {
      const gd = s.goalsDiff;
      return `${s.rank}. ${s.team.name} - ${s.points}pts (${s.all.win}W ${s.all.draw}D ${s.all.lose}L, GD: ${gd > 0 ? "+" : ""}${gd})`;
    }
  );

  const nextMatchesStr = upcomingMatches.slice(0, 3).map(
    (m) => `${m.teams.home.name} vs ${m.teams.away.name} (${new Date(m.fixture.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
  );

  const prompt = `You are a football analyst expert. Analyze FC Barcelona's current situation in ${competitionName}.

CURRENT STANDINGS (Top 8):
${top8.join("\n")}

BARCELONA STATS:
Position: ${barcaStats.position}
Points: ${barcaStats.points} in ${barcaStats.played} games
Record: ${barcaStats.won}W ${barcaStats.draw}D ${barcaStats.lost}L
Goals: ${barcaStats.goalsFor} scored, ${barcaStats.goalsAgainst} conceded (GD: ${barcaStats.goalsFor - barcaStats.goalsAgainst > 0 ? "+" : ""}${barcaStats.goalsFor - barcaStats.goalsAgainst})

UPCOMING MATCHES:
${nextMatchesStr.length > 0 ? nextMatchesStr.join("\n") : "No scheduled matches"}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "nextMatchPrediction": "Brief prediction for the next match (1-2 sentences)",
  "nextMatchExplanation": "Detailed explanation (3-5 sentences) considering form, home/away, historical results, and current momentum",
  "seasonForecast": "Brief forecast for where Barcelona will finish in this competition (1-2 sentences)",
  "seasonExplanation": "Detailed explanation (4-6 sentences) considering remaining fixtures, point gaps, squad depth, injuries context, and historical patterns"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);
    return {
      prediction: parsed.nextMatchPrediction || "",
      explanation: parsed.nextMatchExplanation || "",
      seasonForecast: parsed.seasonForecast || "",
      seasonExplanation: parsed.seasonExplanation || "",
    };
  } catch (err) {
    console.error("AI prediction error:", err);
    return {
      prediction: "Unable to generate prediction at this time.",
      explanation: "",
      seasonForecast: "",
      seasonExplanation: "",
    };
  }
}

export async function refreshCompetition(
  comp: { leagueId: number; id: string; name: string; hasStandings: boolean }
): Promise<void> {
  let standings: StandingEntry[] = [];
  let barcaEntry: StandingEntry | undefined;
  let usedSeason = getCurrentSeason();

  if (comp.hasStandings) {
    const result = await fetchStandings(comp.leagueId);
    standings = result.standings;
    usedSeason = result.season;
    barcaEntry = standings.find((s) => s.team.id === BARCA_ID);
  } else {
    // For competitions without standings (Copa del Rey), use same fallback logic
    // Free tier only supports 2022-2024, so fallback to previous season
    if (usedSeason > 2024) {
      usedSeason = 2024;
    }
  }

  // Try upcoming matches first with used season, then fallback
  let upcomingMatches = await fetchBarcaUpcoming(usedSeason);
  if (upcomingMatches.length === 0 && usedSeason > 2022) {
    upcomingMatches = await fetchBarcaUpcoming(usedSeason - 1);
  }

  const competitionUpcoming = upcomingMatches.filter(
    (m) => m.league.id === comp.leagueId
  );

  // Fetch recent results from the season we have standings for
  const recentResults = await fetchBarcaRecentResults(usedSeason);
  const competitionRecent = recentResults.filter(
    (m) => m.league.id === comp.leagueId
  );

  const barcaStats = barcaEntry
    ? {
        position: barcaEntry.rank,
        points: barcaEntry.points,
        played: barcaEntry.all.played,
        won: barcaEntry.all.win,
        draw: barcaEntry.all.draw,
        lost: barcaEntry.all.lose,
        goalsFor: barcaEntry.all.goals.for,
        goalsAgainst: barcaEntry.all.goals.against,
      }
    : { position: 0, points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };

  const ai = await generateAiPrediction(
    comp.name,
    barcaStats,
    standings,
    competitionUpcoming
  );

  const standingsJson = standings.slice(0, 10).map((s) => ({
    position: s.rank,
    teamName: s.team.name,
    teamCrest: s.team.logo,
    teamId: s.team.id,
    played: s.all.played,
    won: s.all.win,
    draw: s.all.draw,
    lost: s.all.lose,
    goalsFor: s.all.goals.for,
    goalsAgainst: s.all.goals.against,
    goalDifference: s.goalsDiff,
    points: s.points,
  }));

  const nextMatchesJson = competitionUpcoming.slice(0, 3).map((m) => ({
    id: m.fixture.id,
    date: m.fixture.date,
    homeTeam: m.teams.home.name,
    homeCrest: m.teams.home.logo,
    awayTeam: m.teams.away.name,
    awayCrest: m.teams.away.logo,
    isHome: m.teams.home.id === BARCA_ID,
    type: "upcoming" as const,
  }));

  const recentResultsJson = competitionRecent.slice(0, 5).map((m) => ({
    id: m.fixture.id,
    date: m.fixture.date,
    homeTeam: m.teams.home.name,
    homeCrest: m.teams.home.logo,
    awayTeam: m.teams.away.name,
    awayCrest: m.teams.away.logo,
    homeGoals: m.goals.home,
    awayGoals: m.goals.away,
    isHome: m.teams.home.id === BARCA_ID,
    type: "result" as const,
  }));

  // Combine: upcoming first, then recent results
  const matchesJson = [...nextMatchesJson, ...recentResultsJson];

  const seasonStr = `${usedSeason}-${usedSeason + 1}`;

  const upsertData = {
    name: comp.name,
    season: seasonStr,
    emblemUrl: "",
    standings: standingsJson,
    barcaPosition: barcaStats.position,
    barcaPoints: barcaStats.points,
    barcaPlayed: barcaStats.played,
    barcaWon: barcaStats.won,
    barcaDraw: barcaStats.draw,
    barcaLost: barcaStats.lost,
    barcaGoalsFor: barcaStats.goalsFor,
    barcaGoalsAgainst: barcaStats.goalsAgainst,
    nextMatches: matchesJson,
    aiPrediction: ai.prediction,
    aiExplanation: ai.explanation,
    seasonForecast: ai.seasonForecast,
    seasonExplanation: ai.seasonExplanation,
  };

  await prisma.competitionData.upsert({
    where: { id: comp.id },
    update: upsertData,
    create: { id: comp.id, ...upsertData },
  });
}

export async function refreshAllCompetitions(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const comp of COMPETITIONS) {
    try {
      await refreshCompetition(comp);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${comp.name}: ${msg}`);
      console.error(`Error refreshing ${comp.name}:`, msg);
    }
    // Rate limit: 100 req/day for free tier, 2s delay is sufficient
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { success: errors.length === 0, errors };
}
