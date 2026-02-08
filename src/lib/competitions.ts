import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

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
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`);
  }

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

  const top8 = standings.slice(0, 8).map((s) => {
    const gd = s.goalsDiff;
    return `${s.rank}. ${s.team.name} - ${s.points}pts (${s.all.win}W ${s.all.draw}D ${s.all.lose}L, GD: ${gd > 0 ? "+" : ""}${gd})`;
  });

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

// ============== REFRESH COMPETITION ==============

export async function refreshCompetition(comp: Competition): Promise<void> {
  let standings: StandingEntry[] = [];
  let barcaEntry: StandingEntry | undefined;
  let seasonStr = "";
  let upcomingMatches: MatchEntry[] = [];
  let recentResults: MatchEntry[] = [];

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
    // ========= FALLBACK: API-Football (Copa del Rey) =========
    console.log(`[Competitions] ${comp.name}: Using API-Football (leagueId: ${comp.leagueId})`);

    let usedSeason = getCurrentSeason();

    if (comp.hasStandings) {
      const result = await fetchStandingsApiFootball(comp.leagueId);
      standings = result.standings;
      usedSeason = result.season;
      barcaEntry = standings.find((s) => s.team.id === BARCA_ID_API_FOOTBALL);
    } else {
      // Copa del Rey: no standings, free tier caps at 2024
      if (usedSeason > 2024) usedSeason = 2024;
    }

    let upcoming = await fetchBarcaUpcomingApiFootball(usedSeason);
    if (upcoming.length === 0 && usedSeason > 2022) {
      upcoming = await fetchBarcaUpcomingApiFootball(usedSeason - 1);
    }
    upcomingMatches = upcoming.filter((m) => m.league.id === comp.leagueId);

    const recent = await fetchBarcaRecentResultsApiFootball(usedSeason);
    recentResults = recent.filter((m) => m.league.id === comp.leagueId);

    seasonStr = `${usedSeason}-${usedSeason + 1}`;
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

  const ai = await generateAiPrediction(comp.name, barcaStats, standings, upcomingMatches);

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

  const nextMatchesJson = upcomingMatches.slice(0, 3).map((m) => ({
    id: m.fixture.id,
    date: m.fixture.date,
    homeTeam: m.teams.home.name,
    homeCrest: m.teams.home.logo,
    awayTeam: m.teams.away.name,
    awayCrest: m.teams.away.logo,
    isHome: m.teams.home.id === barcaId,
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
    isHome: m.teams.home.id === barcaId,
    type: "result" as const,
  }));

  const matchesJson = [...nextMatchesJson, ...recentResultsJson];

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
    // Delay between competitions
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { success: errors.length === 0, errors };
}
