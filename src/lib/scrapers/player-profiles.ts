import prisma from "@/lib/prisma";
import { ingestChunks, deleteChunksBySource } from "@/lib/knowledge-pipeline";

// ============== CONFIG ==============

const FD_BASE = "https://api.football-data.org/v4";
const BARCA_TEAM_ID = 81;

async function getFootballDataKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FOOTBALL_DATA_API_KEY" } });
    if (s?.value) return s.value;
  } catch {}
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

// ============== TYPES ==============

interface FDPlayer {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  shirtNumber: number | null;
}

interface FDTeam {
  name: string;
  shortName: string;
  crest: string;
  coach: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    nationality: string;
    dateOfBirth: string;
  };
  squad: FDPlayer[];
}

// ============== HELPERS ==============

function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function translatePosition(pos: string, lang: string): string {
  if (lang !== "es") return pos;
  const map: Record<string, string> = {
    Goalkeeper: "Portero",
    Defence: "Defensa",
    Midfield: "Centrocampista",
    Offence: "Delantero",
  };
  return map[pos] || pos;
}

function buildPlayerChunkText(player: FDPlayer, lang: string): string {
  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : "unknown";
  const pos = translatePosition(player.position, lang);
  const shirt = player.shirtNumber ? `#${player.shirtNumber}` : "";

  if (lang === "es") {
    return [
      `Jugador del FC Barcelona: ${player.name} ${shirt}`,
      `Posición: ${pos}`,
      `Nacionalidad: ${player.nationality}`,
      `Edad: ${age} años (nacido: ${player.dateOfBirth || "desconocido"})`,
      `Nombre completo: ${player.firstName} ${player.lastName}`,
    ].join("\n");
  }

  return [
    `FC Barcelona Player: ${player.name} ${shirt}`,
    `Position: ${pos}`,
    `Nationality: ${player.nationality}`,
    `Age: ${age} (born: ${player.dateOfBirth || "unknown"})`,
    `Full name: ${player.firstName} ${player.lastName}`,
  ].join("\n");
}

function buildCoachChunkText(coach: FDTeam["coach"], lang: string): string {
  const age = coach.dateOfBirth ? calculateAge(coach.dateOfBirth) : "unknown";

  if (lang === "es") {
    return [
      `Entrenador del FC Barcelona: ${coach.name}`,
      `Nombre completo: ${coach.firstName} ${coach.lastName}`,
      `Nacionalidad: ${coach.nationality}`,
      `Edad: ${age} años`,
    ].join("\n");
  }

  return [
    `FC Barcelona Head Coach: ${coach.name}`,
    `Full name: ${coach.firstName} ${coach.lastName}`,
    `Nationality: ${coach.nationality}`,
    `Age: ${age}`,
  ].join("\n");
}

function buildSquadSummaryText(team: FDTeam, lang: string): string {
  const byPosition: Record<string, FDPlayer[]> = {};
  for (const p of team.squad) {
    const pos = p.position || "Other";
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(p);
  }

  const positionOrder = ["Goalkeeper", "Defence", "Midfield", "Offence"];
  const lines: string[] = [];

  if (lang === "es") {
    lines.push(`Plantilla del FC Barcelona - Temporada actual`);
    lines.push(`Entrenador: ${team.coach.name}`);
    lines.push(`Total jugadores: ${team.squad.length}\n`);
  } else {
    lines.push(`FC Barcelona Squad - Current Season`);
    lines.push(`Head Coach: ${team.coach.name}`);
    lines.push(`Total players: ${team.squad.length}\n`);
  }

  for (const pos of positionOrder) {
    const players = byPosition[pos];
    if (!players) continue;
    lines.push(`${translatePosition(pos, lang)}:`);
    for (const p of players) {
      const shirt = p.shirtNumber ? ` #${p.shirtNumber}` : "";
      const age = p.dateOfBirth ? ` (${calculateAge(p.dateOfBirth)})` : "";
      lines.push(`  - ${p.name}${shirt}${age} - ${p.nationality}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ============== MAIN SCRAPE FUNCTION ==============

export interface PlayerScrapeResult {
  playersIndexed: number;
  chunksCreated: number;
  coachIndexed: boolean;
  error?: string;
}

export async function scrapePlayerProfiles(): Promise<PlayerScrapeResult> {
  const apiKey = await getFootballDataKey();
  if (!apiKey) {
    return { playersIndexed: 0, chunksCreated: 0, coachIndexed: false, error: "FOOTBALL_DATA_API_KEY not configured" };
  }

  console.log("[Players] Fetching FC Barcelona squad from football-data.org...");

  try {
    const res = await fetch(`${FD_BASE}/teams/${BARCA_TEAM_ID}`, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Players] API error: ${res.status} ${text}`);
      return { playersIndexed: 0, chunksCreated: 0, coachIndexed: false, error: `API error: ${res.status}` };
    }

    const team: FDTeam = await res.json();
    const chunks: Array<{
      sourceType: string;
      sourceId: string;
      text: string;
      language: string;
      freshnessDate: Date;
      ttlHours: number;
      metadata: Record<string, string>;
    }> = [];

    const now = new Date();

    // Delete all previous player chunks
    await deleteChunksBySource("player", "squad-summary");
    await deleteChunksBySource("coach", "coach");

    // 1. Squad summary (1 chunk EN + 1 ES)
    const summaryEn = buildSquadSummaryText(team, "en");
    chunks.push({
      sourceType: "player",
      sourceId: "squad-summary",
      text: summaryEn,
      language: "en",
      freshnessDate: now,
      ttlHours: 0,
      metadata: { source: "football-data.org", type: "squad_summary" },
    });

    const summaryEs = buildSquadSummaryText(team, "es");
    chunks.push({
      sourceType: "player",
      sourceId: "squad-summary",
      text: summaryEs,
      language: "es",
      freshnessDate: now,
      ttlHours: 0,
      metadata: { source: "football-data.org", type: "squad_summary" },
    });

    // 2. Individual player profiles
    for (const player of team.squad) {
      const playerId = `player-${player.id}`;
      await deleteChunksBySource("player", playerId);

      // EN
      chunks.push({
        sourceType: "player",
        sourceId: playerId,
        text: buildPlayerChunkText(player, "en"),
        language: "en",
        freshnessDate: now,
        ttlHours: 0,
        metadata: {
          source: "football-data.org",
          playerName: player.name,
          position: player.position,
          nationality: player.nationality,
          shirtNumber: String(player.shirtNumber || ""),
        },
      });

      // ES
      chunks.push({
        sourceType: "player",
        sourceId: playerId,
        text: buildPlayerChunkText(player, "es"),
        language: "es",
        freshnessDate: now,
        ttlHours: 0,
        metadata: {
          source: "football-data.org",
          playerName: player.name,
          position: player.position,
          nationality: player.nationality,
          shirtNumber: String(player.shirtNumber || ""),
        },
      });
    }

    // 3. Coach profile
    if (team.coach) {
      chunks.push({
        sourceType: "coach",
        sourceId: "coach",
        text: buildCoachChunkText(team.coach, "en"),
        language: "en",
        freshnessDate: now,
        ttlHours: 0,
        metadata: { source: "football-data.org", coachName: team.coach.name },
      });
      chunks.push({
        sourceType: "coach",
        sourceId: "coach",
        text: buildCoachChunkText(team.coach, "es"),
        language: "es",
        freshnessDate: now,
        ttlHours: 0,
        metadata: { source: "football-data.org", coachName: team.coach.name },
      });
    }

    // Ingest all
    const created = await ingestChunks(chunks);

    // Track last scrape
    await prisma.setting.upsert({
      where: { key: "PLAYERS_LAST_SCRAPE" },
      update: { value: now.toISOString() },
      create: { key: "PLAYERS_LAST_SCRAPE", value: now.toISOString() },
    });

    console.log(`[Players] Done: ${team.squad.length} players + coach, ${created} chunks`);
    return {
      playersIndexed: team.squad.length,
      chunksCreated: created,
      coachIndexed: !!team.coach,
    };
  } catch (err) {
    console.error("[Players] Error:", err);
    return {
      playersIndexed: 0,
      chunksCreated: 0,
      coachIndexed: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Check if we should scrape (not scraped in last N days).
 */
export async function shouldScrapePlayers(minDaysInterval: number = 3): Promise<boolean> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "PLAYERS_LAST_SCRAPE" } });
    if (!s?.value) return true;
    const lastScrape = new Date(s.value);
    const daysSince = (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= minDaysInterval;
  } catch {
    return true;
  }
}
