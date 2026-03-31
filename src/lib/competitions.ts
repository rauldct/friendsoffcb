import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { addApiAlert, clearApiAlert } from "@/lib/api-alerts";

// ============== CONSTANTS ==============

const BARCA_ID_API_FOOTBALL = 529; // FC Barcelona ID in API-Football (api-sports.io)
const BARCA_ID_FOOTBALL_DATA = 81; // FC Barcelona ID in football-data.org
const FOOTBALL_API_BASE = "https://v3.football.api-sports.io";
const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";

// ============== INTERFACES ==============

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

// ============== COMPETITIONS CONFIG ==============

interface Competition {
  id: string;
  name: string;
  hasStandings: boolean;
  // football-data.org (primary for La Liga + CL)
  footballDataCode?: string;
  // API-Football fallback (Copa del Rey)
  leagueId: number;
}

const COMPETITIONS: Competition[] = [
  { id: "la-liga", name: "La Liga", hasStandings: true, footballDataCode: "PD", leagueId: 140 },
  { id: "champions-league", name: "Champions League", hasStandings: true, footballDataCode: "CL", leagueId: 2 },
  { id: "copa-del-rey", name: "Copa del Rey", hasStandings: false, leagueId: 143 },
];

// ============== API KEY HELPERS ==============

async function getSettingKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

const getApiKey = () => getSettingKey("API_FOOTBALL_KEY");
const getFootballDataApiKey = () => getSettingKey("FOOTBALL_DATA_API_KEY");
const getAnthropicKey = () => getSettingKey("ANTHROPIC_API_KEY");

// ============== FOOTBALL-DATA.ORG (PRIMARY) ==============

async function fetchFromFootballData(endpoint: string): Promise<unknown> {
  const apiKey = await getFootballDataApiKey();
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not configured");

  const res = await fetch(`${FOOTBALL_DATA_BASE}${endpoint}`, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    await addApiAlert("football-data", `${res.status} ${res.statusText}`, res.status, "competitions fetch");
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`);
  }

  await clearApiAlert("football-data");
  return res.json();
}

async function fetchStandingsFromFootballData(code: string): Promise<{ standings: StandingEntry[]; season: string }> {
  try {
    const data = await fetchFromFootballData(`/competitions/${code}/standings`) as {
      season: { startDate: string; endDate: string };
      standings: Array<{
        type: string;
        table: Array<{
          position: number;
          team: { id: number; name: string; crest: string };
          playedGames: number;
          won: number;
          draw: number;
          lost: number;
          points: number;
          goalsFor: number;
          goalsAgainst: number;
          goalDifference: number;
        }>;
      }>;
    };

    // Use TOTAL standings (not HOME/AWAY)
    const totalStandings = data.standings?.find(s => s.type === "TOTAL");
    if (!totalStandings?.table?.length) return { standings: [], season: "" };

    const startYear = new Date(data.season.startDate).getFullYear();
    const seasonStr = `${startYear}-${startYear + 1}`;

    const standings: StandingEntry[] = totalStandings.table.map(entry => ({
      rank: entry.position,
      team: { id: entry.team.id, name: entry.team.name, logo: entry.team.crest },
      points: entry.points,
      goalsDiff: entry.goalDifference,
      all: {
        played: entry.playedGames,
        win: entry.won,
        draw: entry.draw,
        lose: entry.lost,
        goals: { for: entry.goalsFor, against: entry.goalsAgainst },
      },
    }));

    return { standings, season: seasonStr };
  } catch (err) {
    console.error(`Error fetching standings from football-data.org (${code}):`, err);
    return { standings: [], season: "" };
  }
}

async function fetchMatchesFromFootballData(code: string, dateFrom: string, dateTo: string, status?: string): Promise<MatchEntry[]> {
  try {
    let endpoint = `/competitions/${code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    if (status) endpoint += `&status=${status}`;

    const data = await fetchFromFootballData(endpoint) as {
      matches: Array<{
        id: number;
        utcDate: string;
        status: string;
        homeTeam: { id: number; name: string; crest: string };
        awayTeam: { id: number; name: string; crest: string };
        score: {
          fullTime: { home: number | null; away: number | null };
        };
        competition: { id: number; name: string; emblem: string };
      }>;
    };

    if (!data.matches) return [];

    // Map to our MatchEntry format
    return data.matches.map(m => {
      // Map football-data.org status to API-Football status codes
      let shortStatus = "NS";
      if (m.status === "FINISHED") shortStatus = "FT";
      else if (m.status === "IN_PLAY") shortStatus = "LIVE";
      else if (m.status === "PAUSED") shortStatus = "HT";
      else if (m.status === "POSTPONED") shortStatus = "PST";
      else if (m.status === "SCHEDULED" || m.status === "TIMED") shortStatus = "NS";

      return {
        fixture: { id: m.id, date: m.utcDate, status: { short: shortStatus } },
        teams: {
          home: { id: m.homeTeam.id, name: m.homeTeam.name, logo: m.homeTeam.crest },
          away: { id: m.awayTeam.id, name: m.awayTeam.name, logo: m.awayTeam.crest },
        },
        league: { id: m.competition.id, name: m.competition.name, logo: m.competition.emblem },
        goals: {
          home: m.score.fullTime.home,
          away: m.score.fullTime.away,
        },
      };
    });
  } catch (err) {
    console.error(`Error fetching matches from football-data.org (${code}):`, err);
    return [];
  }
}

// ============== API-FOOTBALL (FALLBACK FOR COPA DEL REY) ==============

function getCurrentSeason(): number {
  const now = new Date();
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

async function fetchStandingsApiFootball(leagueId: number): Promise<{ standings: StandingEntry[]; season: number }> {
  try {
    const season = getCurrentSeason();
    const data = (await fetchApi(`/standings?league=${leagueId}&season=${season}`)) as {
      response: Array<{ league: { standings: StandingEntry[][] } }>;
    };

    let firstResponse = data.response?.[0];
    let usedSeason = season;

    if (!firstResponse?.league?.standings?.[0] && season > 2022) {
      usedSeason = season - 1;
      const fallbackData = (await fetchApi(`/standings?league=${leagueId}&season=${usedSeason}`)) as {
        response: Array<{ league: { standings: StandingEntry[][] } }>;
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

async function fetchBarcaUpcomingApiFootball(season: number): Promise<MatchEntry[]> {
  try {
    const now = new Date();
    const fromDate = now.toISOString().slice(0, 10);
    const toDate = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);

    const data = (await fetchApi(`/fixtures?team=${BARCA_ID_API_FOOTBALL}&from=${fromDate}&to=${toDate}&season=${season}`)) as {
      response: MatchEntry[];
    };

    const matches = data.response || [];
    return matches.filter((m) => ["NS", "TBD", "PST"].includes(m.fixture.status.short));
  } catch (err) {
    console.error("Error fetching upcoming matches (API-Football):", err);
    return [];
  }
}

async function fetchBarcaRecentResultsApiFootball(season: number): Promise<MatchEntry[]> {
  try {
    const data = (await fetchApi(`/fixtures?team=${BARCA_ID_API_FOOTBALL}&season=${season}&status=FT-AET-PEN`)) as {
      response: MatchEntry[];
    };

    const matches = data.response || [];
    return matches.sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
  } catch (err) {
    console.error("Error fetching recent results (API-Football):", err);
    return [];
  }
}

// ============== AI PREDICTIONS ==============

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
  upcomingMatches: MatchEntry[],
  allLeagueFixtures?: MatchEntry[],
  recentResults?: MatchEntry[],
  bracketContext?: string
): Promise<{
  prediction: string;
  predictionEs: string;
  explanation: string;
  explanationEs: string;
  seasonForecast: string;
  seasonForecastEs: string;
  seasonExplanation: string;
  seasonExplanationEs: string;
  structuredData: Record<string, unknown>;
}> {
  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) {
    return {
      prediction: "AI predictions unavailable - API key not configured.",
      predictionEs: "Predicciones IA no disponibles - API key no configurada.",
      explanation: "",
      explanationEs: "",
      seasonForecast: "",
      seasonForecastEs: "",
      seasonExplanation: "",
      seasonExplanationEs: "",
      structuredData: {},
    };
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const top8 = standings.slice(0, 8).map((s) => {
    const gd = s.goalsDiff;
    return `${s.rank}. ${s.team.name} - ${s.points}pts (${s.all.win}W ${s.all.draw}D ${s.all.lose}L, GD: ${gd > 0 ? "+" : ""}${gd})`;
  });

  // Send ALL remaining matches for complete match-by-match predictions
  const allUpcomingStr = upcomingMatches.map(
    (m) => {
      const isHome = m.teams.home.id === BARCA_ID_FOOTBALL_DATA || m.teams.home.id === BARCA_ID_API_FOOTBALL;
      return `${m.teams.home.name} vs ${m.teams.away.name} (${new Date(m.fixture.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${isHome ? "HOME" : "AWAY"})`;
    }
  );

  // For La Liga: format ALL league fixtures (all teams) for comprehensive predictions
  const allFixturesStr = (allLeagueFixtures || []).map(
    (m) => `${m.teams.home.name} vs ${m.teams.away.name}`
  );

  // Format recent results for context
  const recentResultsStr = (recentResults || []).map((m) => {
    const isHome = m.teams.home.id === BARCA_ID_FOOTBALL_DATA || m.teams.home.id === BARCA_ID_API_FOOTBALL;
    return `${m.teams.home.name} ${m.goals.home ?? "?"}-${m.goals.away ?? "?"} ${m.teams.away.name} (${new Date(m.fixture.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${isHome ? "HOME" : "AWAY"})`;
  });

  const hasStandings = standings.length > 0 && barcaStats.played > 0;
  const isLeague = competitionName === "La Liga";
  const isKnockout = !isLeague; // CL + Copa are knockout from this stage

  // Different structured data instructions per competition type
  let structuredInstruction = "";
  if (isLeague) {
    structuredInstruction = `"projectedPoints": [{"team": "FC Barcelona", "projected": 89}, ...] (top 6 teams),
  "matchByMatch": [],
  "allFixtures": [{"h": "FC Barcelona", "a": "Girona FC", "hs": 2, "as": 1}, ...] (predict EVERY remaining La Liga fixture listed in ALL REMAINING FIXTURES below - one entry per match with home team, away team, home goals, away goals. Do NOT skip any fixture.),`;
  } else {
    structuredInstruction = `"projectedPoints": [],
  "matchByMatch": [],
  "allFixtures": [],
  "bracketRounds": [{"round": "Round of 16", "opponent": "Team Name", "winPct": 75, "reason": "Brief reason"}, {"round": "Quarter-finals", "opponent": "Likely opponent", "winPct": 55, "reason": "Brief reason"}, {"round": "Semi-finals", "opponent": "Probable opponent", "winPct": 40, "reason": "Brief reason"}, {"round": "Final", "opponent": "Expected finalist", "winPct": 35, "reason": "Brief reason"}] (predict Barcelona's path through the knockout rounds with win probability per round. CRITICAL: Only include rounds Barcelona has NOT yet been eliminated from. Use REAL opponents from the COMPETITION BRACKET CONTEXT - do NOT include teams that have already been eliminated from the competition. Only include the current round and potential future rounds.),`;
  }

  const prompt = `You are a football analyst expert. Analyze FC Barcelona's current situation in ${competitionName}.

CURRENT STANDINGS (Top 8):
${top8.join("\n")}

BARCELONA STATS:
Position: ${barcaStats.position}
Points: ${barcaStats.points} in ${barcaStats.played} games
Record: ${barcaStats.won}W ${barcaStats.draw}D ${barcaStats.lost}L
Goals: ${barcaStats.goalsFor} scored, ${barcaStats.goalsAgainst} conceded (GD: ${barcaStats.goalsFor - barcaStats.goalsAgainst > 0 ? "+" : ""}${barcaStats.goalsFor - barcaStats.goalsAgainst})

RECENT RESULTS IN THIS COMPETITION:
${recentResultsStr.length > 0 ? recentResultsStr.join("\n") : "No recent results"}

BARCELONA'S UPCOMING MATCHES:
${allUpcomingStr.length > 0 ? allUpcomingStr.join("\n") : "No scheduled matches"}
${isLeague && allFixturesStr.length > 0 ? `\nALL REMAINING LA LIGA FIXTURES (${allFixturesStr.length} matches - predict ALL of them in "allFixtures"):\n${allFixturesStr.join("\n")}` : ""}
${isKnockout ? "\nIMPORTANT: Copa del Rey and Champions League use TWO-LEGGED TIES. If a recent result shows a first leg score, the team is NOT eliminated - there is still a return leg to play. Consider aggregate scores across both legs when making predictions. A team losing 4-0 in the first leg is in a very difficult position but is NOT yet eliminated until the second leg is played." : ""}
${bracketContext ? `\nCOMPETITION BRACKET CONTEXT (other teams' results - use this to determine REAL opponents for bracketRounds, do NOT guess eliminated teams):\n${bracketContext}` : ""}

Respond ONLY with valid JSON (no markdown, no code blocks). Provide BOTH English and Spanish versions:
{
  "nextMatchPrediction": "Brief prediction for the next match in English (1-2 sentences)",
  "nextMatchPredictionEs": "Misma predicción en español natural con terminología futbolística (1-2 frases)",
  "nextMatchExplanation": "Detailed explanation in English (3-5 sentences) considering form, home/away, historical results, and current momentum",
  "nextMatchExplanationEs": "Misma explicación detallada en español (3-5 frases)",
  "seasonForecast": "Brief forecast in English for where Barcelona will finish (1-2 sentences)",
  "seasonForecastEs": "Mismo pronóstico en español (1-2 frases)",
  "seasonExplanation": "Detailed explanation in English (4-6 sentences) considering remaining fixtures, point gaps, squad depth, injuries context, and historical patterns",
  "seasonExplanationEs": "Misma explicación detallada en español (4-6 frases)",
  "nextMatchWinPct": 65,
  "nextMatchDrawPct": 20,
  "nextMatchLossPct": 15,
  "eliminated": false,
  "titlePct": 30,
  "top4Pct": 85,
  ${structuredInstruction}
}

IMPORTANT for numeric fields:
- eliminated: set to true ONLY if Barcelona has been DEFINITIVELY knocked out of this competition (lost on aggregate in a two-legged tie, lost a single-leg knockout match, or mathematically cannot qualify). If eliminated is true, set titlePct and top4Pct to 0 and leave bracketRounds empty.
- nextMatchWinPct + nextMatchDrawPct + nextMatchLossPct MUST sum to 100 (integers). If eliminated, set all three to 0.
- titlePct: probability of winning the title (Liga), winning the competition (CL), or reaching the final (Copa). Integer 0-100.
- top4Pct: probability of finishing top 4 (Liga), reaching quarter-finals+ (CL), or reaching semi-finals+ (Copa). Integer 0-100.
${isLeague ? "- projectedPoints: project final season points for top 6 teams based on allFixtures results. Each: {\"team\": \"Name\", \"projected\": number}\n- allFixtures: predict EVERY remaining La Liga fixture listed above. Each: {\"h\": \"Home Team\", \"a\": \"Away Team\", \"hs\": homeGoals, \"as\": awayGoals}. Do NOT skip any match. The projected points for each team should be consistent with these fixture results." : "- bracketRounds: predict Barcelona's path through knockout rounds. Each: {\"round\": \"Round name\", \"opponent\": \"Team\", \"winPct\": number 0-100, \"reason\": \"brief reason\"}"}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    await clearApiAlert("anthropic");

    const structuredData: Record<string, unknown> = {
      eliminated: parsed.eliminated === true,
      nextMatchWinPct: Number(parsed.nextMatchWinPct) || 0,
      nextMatchDrawPct: Number(parsed.nextMatchDrawPct) || 0,
      nextMatchLossPct: Number(parsed.nextMatchLossPct) || 0,
      titlePct: Number(parsed.titlePct) || 0,
      top4Pct: Number(parsed.top4Pct) || 0,
      projectedPoints: Array.isArray(parsed.projectedPoints) ? parsed.projectedPoints : [],
      matchByMatch: Array.isArray(parsed.matchByMatch) ? parsed.matchByMatch : [],
      allFixtures: Array.isArray(parsed.allFixtures) ? parsed.allFixtures : [],
      bracketRounds: Array.isArray(parsed.bracketRounds) ? parsed.bracketRounds : [],
    };

    return {
      prediction: parsed.nextMatchPrediction || "",
      predictionEs: parsed.nextMatchPredictionEs || "",
      explanation: parsed.nextMatchExplanation || "",
      explanationEs: parsed.nextMatchExplanationEs || "",
      seasonForecast: parsed.seasonForecast || "",
      seasonForecastEs: parsed.seasonForecastEs || "",
      seasonExplanation: parsed.seasonExplanation || "",
      seasonExplanationEs: parsed.seasonExplanationEs || "",
      structuredData,
    };
  } catch (err) {
    console.error("AI prediction error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    await addApiAlert("anthropic", errMsg, undefined, "AI prediction").catch(() => {});
    return {
      prediction: "Unable to generate prediction at this time.",
      predictionEs: "",
      explanation: "",
      explanationEs: "",
      seasonForecast: "",
      seasonForecastEs: "",
      seasonExplanation: "",
      seasonExplanationEs: "",
      structuredData: {},
    };
  }
}

// ============== COPA DEL REY VIA BRAVE SEARCH + CLAUDE ==============

async function fetchCopaBracketContext(braveKey: string, seasonStr: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      q: `Copa del Rey ${seasonStr} semifinales cuartos bracket cuadro resultados`,
      count: "8",
      search_lang: "es",
    });
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: { Accept: "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey },
    });
    if (!res.ok) return "";
    const data = await res.json();
    const results = data.web?.results || [];
    const snippets = results
      .map((r: { title: string; description: string }) => `[${r.title}] ${r.description}`)
      .join("\n\n");
    console.log(`[Competitions] Copa bracket context: ${results.length} search results`);
    return snippets;
  } catch {
    return "";
  }
}

async function fetchCopaDelReyViaSearch(): Promise<{
  recentResults: MatchEntry[];
  upcomingMatches: MatchEntry[];
  season: string;
  bracketContext: string;
}> {
  const braveKey = await getSettingKey("BRAVE_API_KEY");
  const anthropicKey = await getAnthropicKey();
  const season = getCurrentSeason();
  const seasonStr = `${season}-${season + 1}`;

  if (!braveKey || !anthropicKey) {
    console.error("[Competitions] Copa del Rey: Missing BRAVE_API_KEY or ANTHROPIC_API_KEY");
    return { recentResults: [], upcomingMatches: [], season: seasonStr, bracketContext: "" };
  }

  try {
    const params = new URLSearchParams({
      q: `FC Barcelona Copa del Rey ${seasonStr} results schedule`,
      count: "10",
      search_lang: "en",
    });

    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": braveKey,
      },
    });

    if (!res.ok) {
      console.error(`[Competitions] Brave Search error: ${res.status}`);
      await addApiAlert("brave-search", `${res.status} ${res.statusText}`, res.status, "Copa del Rey search");
      return { recentResults: [], upcomingMatches: [], season: seasonStr, bracketContext: "" };
    }

    await clearApiAlert("brave-search");

    const data = await res.json();
    const results = data.web?.results || [];
    const snippets = results
      .map((r: { title: string; description: string; url: string }) =>
        `[${r.title}] ${r.description}`
      )
      .join("\n\n");

    if (!snippets) {
      return { recentResults: [], upcomingMatches: [], season: seasonStr, bracketContext: "" };
    }

    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Based on these search results about FC Barcelona in the Copa del Rey ${seasonStr}, extract match information.

IMPORTANT: Copa del Rey uses TWO-LEGGED TIES (ida/vuelta) from the Round of 16 onwards. If a first leg (ida) result is found, there MUST be a return leg (vuelta) scheduled unless one team won by a very large aggregate margin AND the rules say so (they don't - both legs are always played). Always check for return legs.

Today's date: ${new Date().toISOString().split("T")[0]}

SEARCH RESULTS:
${snippets}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "recentResults": [
    {
      "date": "YYYY-MM-DDTHH:mm:ssZ",
      "homeTeam": "Team Name",
      "awayTeam": "Team Name",
      "homeGoals": 0,
      "awayGoals": 0,
      "round": "Semi-finals - 1st Leg"
    }
  ],
  "upcomingMatches": [
    {
      "date": "YYYY-MM-DDTHH:mm:ssZ",
      "homeTeam": "Team Name",
      "awayTeam": "Team Name",
      "round": "Semi-finals - 2nd Leg"
    }
  ]
}

Only include matches involving FC Barcelona. Use real data from the search results. For two-legged ties, mark rounds with "1st Leg" or "2nd Leg". If a first leg result exists but you don't find the return leg date, still include the return leg in upcomingMatches with your best estimate of the date (typically 2-3 weeks after the first leg, with home/away reversed). If no data is found for a category, return an empty array.`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    // Look up crests from the Match table for Copa del Rey opponents
    const copaMatches = await prisma.match.findMany({
      where: { competition: "Copa del Rey" },
      select: { opponent: true, opponentLogo: true },
    });
    const crestMap: Record<string, string> = {};
    for (const cm of copaMatches) {
      if (cm.opponentLogo) crestMap[cm.opponent.toLowerCase()] = cm.opponentLogo;
    }
    const barcaCrest = "https://crests.football-data.org/81.png";
    const findCrest = (name: string): string => {
      const lower = name.toLowerCase();
      if (lower.includes("barcelona") || lower.includes("barça")) return barcaCrest;
      for (const [key, val] of Object.entries(crestMap)) {
        if (lower.includes(key.split(" ")[0].toLowerCase()) || key.toLowerCase().includes(lower.split(" ")[0].toLowerCase())) return val;
      }
      return "";
    };

    const recentResults: MatchEntry[] = (parsed.recentResults || []).map(
      (m: { date: string; homeTeam: string; awayTeam: string; homeGoals: number; awayGoals: number; round?: string }, i: number) => ({
        fixture: { id: 90000 + i, date: m.date, status: { short: "FT" } },
        teams: {
          home: { id: m.homeTeam.includes("Barcelona") || m.homeTeam.includes("Barça") ? BARCA_ID_FOOTBALL_DATA : 0, name: m.homeTeam, logo: findCrest(m.homeTeam) },
          away: { id: m.awayTeam.includes("Barcelona") || m.awayTeam.includes("Barça") ? BARCA_ID_FOOTBALL_DATA : 0, name: m.awayTeam, logo: findCrest(m.awayTeam) },
        },
        league: { id: 143, name: "Copa del Rey", logo: "" },
        goals: { home: m.homeGoals ?? null, away: m.awayGoals ?? null },
      })
    );

    const upcomingMatches: MatchEntry[] = (parsed.upcomingMatches || []).map(
      (m: { date: string; homeTeam: string; awayTeam: string; round?: string }, i: number) => ({
        fixture: { id: 91000 + i, date: m.date, status: { short: "NS" } },
        teams: {
          home: { id: m.homeTeam.includes("Barcelona") || m.homeTeam.includes("Barça") ? BARCA_ID_FOOTBALL_DATA : 0, name: m.homeTeam, logo: findCrest(m.homeTeam) },
          away: { id: m.awayTeam.includes("Barcelona") || m.awayTeam.includes("Barça") ? BARCA_ID_FOOTBALL_DATA : 0, name: m.awayTeam, logo: findCrest(m.awayTeam) },
        },
        league: { id: 143, name: "Copa del Rey", logo: "" },
        goals: { home: null, away: null },
      })
    );

    // Merge with Match table: DB matches have accurate dates, so prefer them over Brave Search estimates
    const now = new Date();
    const dbCopaFuture = await prisma.match.findMany({
      where: { competition: "Copa del Rey", date: { gt: now } },
      orderBy: { date: "asc" },
    });
    for (const dbMatch of dbCopaFuture) {
      const opponentLower = dbMatch.opponent.toLowerCase();
      // Check if Brave Search already found a match vs the same opponent
      const existingIdx = upcomingMatches.findIndex((u) => {
        const homeN = u.teams.home.name.toLowerCase();
        const awayN = u.teams.away.name.toLowerCase();
        return homeN.includes(opponentLower.split(" ")[0]) || awayN.includes(opponentLower.split(" ")[0]) ||
               opponentLower.includes(homeN.split(" ")[0]) || opponentLower.includes(awayN.split(" ")[0]);
      });
      const isHome = dbMatch.venue === "home";
      // Use same Barca ID as Brave Search path for consistency with barcaId check in refreshCompetition
      const barcaIdForEntry = BARCA_ID_FOOTBALL_DATA;
      const dbEntry: MatchEntry = {
        fixture: { id: 91000 + upcomingMatches.length, date: dbMatch.date.toISOString(), status: { short: "NS" } },
        teams: {
          home: {
            id: isHome ? barcaIdForEntry : 0,
            name: isHome ? "FC Barcelona" : dbMatch.opponent,
            logo: isHome ? barcaCrest : (dbMatch.opponentLogo || ""),
          },
          away: {
            id: isHome ? 0 : barcaIdForEntry,
            name: isHome ? dbMatch.opponent : "FC Barcelona",
            logo: isHome ? (dbMatch.opponentLogo || "") : barcaCrest,
          },
        },
        league: { id: 143, name: "Copa del Rey", logo: "" },
        goals: { home: null, away: null },
      };
      if (existingIdx >= 0) {
        // Replace Brave Search estimate with DB accurate date
        console.log(`[Competitions] Copa del Rey: Replacing Brave estimate with DB match vs ${dbMatch.opponent} on ${dbMatch.date.toISOString()}`);
        upcomingMatches[existingIdx] = dbEntry;
      } else {
        console.log(`[Competitions] Copa del Rey: Added DB fallback match vs ${dbMatch.opponent} on ${dbMatch.date.toISOString()}`);
        upcomingMatches.push(dbEntry);
      }
    }

    // Fetch bracket context (other teams' results) for better AI predictions
    const bracketContext = await fetchCopaBracketContext(braveKey, seasonStr);

    console.log(`[Competitions] Copa del Rey via Brave Search: ${recentResults.length} results, ${upcomingMatches.length} upcoming`);
    return { recentResults, upcomingMatches, season: seasonStr, bracketContext };
  } catch (err) {
    console.error("[Competitions] Copa del Rey search error:", err);
    return { recentResults: [], upcomingMatches: [], season: seasonStr, bracketContext: "" };
  }
}

// ============== REFRESH COMPETITION ==============

export async function refreshCompetition(comp: Competition): Promise<void> {
  // Skip refresh for competitions already marked inactive (Barça eliminated)
  // This prevents wasting API calls and avoids AI hallucinating reactivation
  const existingComp = await prisma.competitionData.findUnique({
    where: { id: comp.id },
    select: { active: true },
  });
  if (existingComp && !existingComp.active) {
    console.log(`[Competitions] ${comp.name}: Skipped (inactive/eliminated)`);
    return;
  }

  let standings: StandingEntry[] = [];
  let barcaEntry: StandingEntry | undefined;
  let seasonStr = "";
  let upcomingMatches: MatchEntry[] = [];
  let allLeagueFixtures: MatchEntry[] = [];
  let recentResults: MatchEntry[] = [];
  let bracketContext = "";

  const barcaId = comp.footballDataCode ? BARCA_ID_FOOTBALL_DATA : BARCA_ID_API_FOOTBALL;

  if (comp.footballDataCode) {
    // ========= PRIMARY: football-data.org (La Liga, Champions League) =========
    console.log(`[Competitions] ${comp.name}: Using football-data.org (code: ${comp.footballDataCode})`);

    if (comp.hasStandings) {
      const result = await fetchStandingsFromFootballData(comp.footballDataCode);
      standings = result.standings;
      seasonStr = result.season;
      barcaEntry = standings.find((s) => s.team.id === BARCA_ID_FOOTBALL_DATA);
    }

    // Upcoming matches (next 90 days)
    const now = new Date();
    const fromDate = now.toISOString().slice(0, 10);
    const toDate = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);

    // Delay between requests (football-data.org: 10 req/min)
    await new Promise((r) => setTimeout(r, 7000));

    const allUpcoming = await fetchMatchesFromFootballData(comp.footballDataCode, fromDate, toDate, "SCHEDULED");
    // Store all league fixtures for AI predictions
    allLeagueFixtures = allUpcoming;
    // Filter Barça matches
    upcomingMatches = allUpcoming.filter(
      (m) => m.teams.home.id === BARCA_ID_FOOTBALL_DATA || m.teams.away.id === BARCA_ID_FOOTBALL_DATA
    );

    // Recent results (last 90 days)
    const pastDate = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);

    await new Promise((r) => setTimeout(r, 7000));

    const allFinished = await fetchMatchesFromFootballData(comp.footballDataCode, pastDate, fromDate, "FINISHED");
    recentResults = allFinished
      .filter((m) => m.teams.home.id === BARCA_ID_FOOTBALL_DATA || m.teams.away.id === BARCA_ID_FOOTBALL_DATA)
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());

    if (!seasonStr) {
      const season = getCurrentSeason();
      seasonStr = `${season}-${season + 1}`;
    }
  } else {
    // ========= COPA DEL REY: Brave Search + Claude AI =========
    console.log(`[Competitions] ${comp.name}: Using Brave Search + Claude AI`);

    const copaData = await fetchCopaDelReyViaSearch();
    recentResults = copaData.recentResults;
    upcomingMatches = copaData.upcomingMatches;
    seasonStr = copaData.season;
    bracketContext = copaData.bracketContext;
  }

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

  const ai = await generateAiPrediction(comp.name, barcaStats, standings, upcomingMatches, allLeagueFixtures, recentResults, bracketContext);

  // --- Elimination detection (multi-layered) ---
  const aiSaysEliminated = (ai.structuredData as Record<string, unknown>)?.eliminated === true;
  const isKnockoutComp = !comp.hasStandings; // Copa, CL knockout stages
  const hasUpcoming = upcomingMatches.length > 0;
  const hasResults = recentResults.length > 0;

  // Determine elimination:
  // 1. AI explicitly says eliminated → eliminated
  // 2. Knockout competition with NO upcoming matches AND NO recent results → eliminated (no data = not in competition)
  // 3. Knockout competition with NO upcoming matches AND has recent results (all played) → eliminated (knocked out)
  let isEliminated = false;
  if (aiSaysEliminated) {
    isEliminated = true;
    console.log(`[Competitions] ${comp.name}: AI detected ELIMINATION`);
  } else if (isKnockoutComp && !hasUpcoming && !hasResults) {
    isEliminated = true;
    console.log(`[Competitions] ${comp.name}: No data found (knockout) - marking eliminated`);
  } else if (isKnockoutComp && !hasUpcoming && hasResults) {
    isEliminated = true;
    console.log(`[Competitions] ${comp.name}: No upcoming matches in knockout comp - marking eliminated`);
  }

  if (isEliminated) {
    console.log(`[Competitions] ${comp.name}: Barcelona ELIMINATED - active=false`);
  }

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

  const isBarcaTeam = (id: number) => id === BARCA_ID_FOOTBALL_DATA || id === BARCA_ID_API_FOOTBALL;
  const nextMatchesJson = upcomingMatches.slice(0, 3).map((m) => ({
    id: m.fixture.id,
    date: m.fixture.date,
    homeTeam: m.teams.home.name,
    homeCrest: m.teams.home.logo,
    awayTeam: m.teams.away.name,
    awayCrest: m.teams.away.logo,
    isHome: isBarcaTeam(m.teams.home.id),
    type: "upcoming" as const,
  }));

  const recentResultsJson = recentResults.slice(0, 5).map((m) => ({
    id: m.fixture.id,
    date: m.fixture.date,
    homeTeam: m.teams.home.name,
    homeCrest: m.teams.home.logo,
    awayTeam: m.teams.away.name,
    awayCrest: m.teams.away.logo,
    homeGoals: m.goals.home,
    awayGoals: m.goals.away,
    isHome: isBarcaTeam(m.teams.home.id),
    type: "result" as const,
  }));

  const matchesJson = [...nextMatchesJson, ...recentResultsJson];

  const upsertData = {
    name: comp.name,
    active: !isEliminated,
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
    aiPredictionEs: ai.predictionEs,
    aiExplanation: ai.explanation,
    aiExplanationEs: ai.explanationEs,
    seasonForecast: ai.seasonForecast,
    seasonForecastEs: ai.seasonForecastEs,
    seasonExplanation: ai.seasonExplanation,
    seasonExplanationEs: ai.seasonExplanationEs,
    aiStructuredData: ai.structuredData as unknown as import("@prisma/client").Prisma.InputJsonValue,
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
    // Delay between competitions
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { success: errors.length === 0, errors };
}
