import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const BARCA_FD_ID = 81;
const BARCA_AF_ID = 529;
const FD_BASE = "https://api.football-data.org/v4";
const AF_BASE = "https://v3.football.api-sports.io";
const CRESTS_DIR = path.join(process.cwd(), "public", "images", "crests");

async function getApiKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch {}
  return process.env[key] || "";
}

// Download crest image to local disk, return local path
async function downloadCrest(url: string, teamName: string): Promise<string> {
  if (!url || url.startsWith("/images/crests/")) return url;
  try {
    if (!fs.existsSync(CRESTS_DIR)) fs.mkdirSync(CRESTS_DIR, { recursive: true });
    // Create a safe filename from team name
    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const ext = url.includes(".svg") ? "svg" : "png";
    const filename = `${safeName}.${ext}`;
    const filepath = path.join(CRESTS_DIR, filename);
    const localPath = `/images/crests/${filename}`;

    // Skip if already downloaded
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 100) {
      return localPath;
    }

    // Download the image
    const buffer = await fetchBuffer(url);
    if (buffer && buffer.length > 100) {
      fs.writeFileSync(filepath, buffer);
      return localPath;
    }
  } catch (err) {
    console.error(`Failed to download crest for ${teamName}:`, err);
  }
  return url; // fallback to original URL
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// Normalize competition name
function normalizeCompetition(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("liga") || lower.includes("primera")) return "La Liga";
  if (lower.includes("champions")) return "Champions League";
  if (lower.includes("copa") || lower.includes("rey")) return "Copa del Rey";
  if (lower.includes("supercopa")) return "Supercopa";
  return name;
}

interface MatchEntry {
  date: Date;
  time: string;
  opponent: string;
  opponentCrestUrl: string;
  competition: string;
  venue: string;
}

export async function POST() {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "match_sync", status: "running" },
  });

  try {
    const fdKey = await getApiKey("FOOTBALL_DATA_API_KEY");
    const afKey = await getApiKey("API_FOOTBALL_KEY");
    if (!fdKey && !afKey) throw new Error("No football API key configured");

    const allMatches: MatchEntry[] = [];

    // 1. Fetch from football-data.org (La Liga + CL + others in free tier)
    if (fdKey) {
      const now = new Date();
      const fromDate = now.toISOString().slice(0, 10);
      const toDate = new Date(now.getTime() + 150 * 86400000).toISOString().slice(0, 10);

      const res = await fetch(
        `${FD_BASE}/teams/${BARCA_FD_ID}/matches?status=SCHEDULED,TIMED&dateFrom=${fromDate}&dateTo=${toDate}`,
        { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        for (const m of data.matches || []) {
          const matchDate = new Date(m.utcDate);
          const isHome = m.homeTeam.id === BARCA_FD_ID;
          allMatches.push({
            date: matchDate,
            time: matchDate.toLocaleTimeString("en-US", {
              hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid",
            }),
            opponent: isHome ? m.awayTeam.name : m.homeTeam.name,
            opponentCrestUrl: isHome ? (m.awayTeam.crest || "") : (m.homeTeam.crest || ""),
            competition: normalizeCompetition(m.competition?.name || ""),
            venue: isHome ? "home" : "away",
          });
        }
      }
    }

    // 2. Fetch Copa del Rey from API-Football (not in football-data.org free tier)
    if (afKey) {
      await new Promise(r => setTimeout(r, 1000)); // small delay
      // Try current season, fall back to 2024 if free tier blocks it
      const currentSeason = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1;
      let afRes = await fetch(
        `${AF_BASE}/fixtures?team=${BARCA_AF_ID}&league=143&season=${currentSeason}&status=NS-TBD`,
        { headers: { "x-apisports-key": afKey }, cache: "no-store" }
      );
      // If current season fails (free tier), try 2024
      if (afRes.ok) {
        const check = await afRes.json();
        if (check.errors?.plan) {
          await new Promise(r => setTimeout(r, 500));
          afRes = await fetch(
            `${AF_BASE}/fixtures?team=${BARCA_AF_ID}&league=143&season=2024&status=NS-TBD`,
            { headers: { "x-apisports-key": afKey }, cache: "no-store" }
          );
        } else {
          // Reconstruct response since we already consumed it
          afRes = new Response(JSON.stringify(check), { status: 200 });
        }
      }

      if (afRes.ok) {
        const afData = await afRes.json();
        for (const fix of afData.response || []) {
          const matchDate = new Date(fix.fixture.date);
          if (matchDate < new Date()) continue; // skip past matches
          const isHome = fix.teams.home.id === BARCA_AF_ID;
          const opponent = isHome ? fix.teams.away.name : fix.teams.home.name;

          // Check if we already have this match from football-data.org
          const alreadyExists = allMatches.some(m =>
            m.opponent === opponent &&
            Math.abs(m.date.getTime() - matchDate.getTime()) < 86400000
          );
          if (alreadyExists) continue;

          allMatches.push({
            date: matchDate,
            time: matchDate.toLocaleTimeString("en-US", {
              hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid",
            }),
            opponent,
            opponentCrestUrl: isHome ? (fix.teams.away.logo || "") : (fix.teams.home.logo || ""),
            competition: "Copa del Rey",
            venue: isHome ? "home" : "away",
          });
        }
      }

      // Also fetch CL from API-Football if not already in football-data results
      if (allMatches.filter(m => m.competition === "Champions League").length === 0) {
        await new Promise(r => setTimeout(r, 500));
        let clRes = await fetch(
          `${AF_BASE}/fixtures?team=${BARCA_AF_ID}&league=2&season=${currentSeason}&status=NS-TBD`,
          { headers: { "x-apisports-key": afKey }, cache: "no-store" }
        );
        if (clRes.ok) {
          const clCheck = await clRes.json();
          if (clCheck.errors?.plan) {
            await new Promise(r => setTimeout(r, 500));
            clRes = await fetch(
              `${AF_BASE}/fixtures?team=${BARCA_AF_ID}&league=2&season=2024&status=NS-TBD`,
              { headers: { "x-apisports-key": afKey }, cache: "no-store" }
            );
          } else {
            clRes = new Response(JSON.stringify(clCheck), { status: 200 });
          }
        }
        if (clRes.ok) {
          const clData = await clRes.json();
          for (const fix of clData.response || []) {
            const matchDate = new Date(fix.fixture.date);
            if (matchDate < new Date()) continue;
            const isHome = fix.teams.home.id === BARCA_AF_ID;
            const opponent = isHome ? fix.teams.away.name : fix.teams.home.name;
            const alreadyExists = allMatches.some(m =>
              m.opponent === opponent &&
              Math.abs(m.date.getTime() - matchDate.getTime()) < 86400000
            );
            if (!alreadyExists) {
              allMatches.push({
                date: matchDate,
                time: matchDate.toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid",
                }),
                opponent,
                opponentCrestUrl: isHome ? (fix.teams.away.logo || "") : (fix.teams.home.logo || ""),
                competition: "Champions League",
                venue: isHome ? "home" : "away",
              });
            }
          }
        }
      }
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const m of allMatches) {
      // Download crest locally
      const localCrest = await downloadCrest(m.opponentCrestUrl, m.opponent);

      // Check existing match
      const existing = await prisma.match.findFirst({
        where: {
          opponent: m.opponent,
          date: {
            gte: new Date(m.date.getTime() - 86400000),
            lte: new Date(m.date.getTime() + 86400000),
          },
        },
      });

      if (existing) {
        // Update time/logo/competition if changed
        const needsUpdate =
          existing.time !== m.time ||
          existing.opponentLogo !== localCrest ||
          existing.competition !== m.competition;

        if (needsUpdate) {
          await prisma.match.update({
            where: { id: existing.id },
            data: {
              time: m.time,
              opponentLogo: localCrest,
              competition: m.competition,
            },
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      await prisma.match.create({
        data: {
          date: m.date,
          time: m.time,
          opponent: m.opponent,
          opponentLogo: localCrest,
          competition: m.competition,
          venue: m.venue,
        },
      });
      created++;
    }

    // Also update existing matches that have remote URLs as logos
    const matchesWithRemoteLogos = await prisma.match.findMany({
      where: {
        opponentLogo: { startsWith: "http" },
        date: { gte: new Date() },
      },
    });
    for (const m of matchesWithRemoteLogos) {
      const localCrest = await downloadCrest(m.opponentLogo, m.opponent);
      if (localCrest !== m.opponentLogo) {
        await prisma.match.update({
          where: { id: m.id },
          data: { opponentLogo: localCrest },
        });
        updated++;
      }
    }

    const msg = `Synced: ${created} new, ${updated} updated, ${skipped} unchanged. Total API matches: ${allMatches.length}`;
    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: msg,
        details: { created, updated, skipped, total: allMatches.length },
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: msg, created, updated, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
