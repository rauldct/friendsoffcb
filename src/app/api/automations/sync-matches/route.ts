import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BARCA_ID = 529; // FC Barcelona ID in API-Football (api-sports.io)
const API_BASE = "https://v3.football.api-sports.io";

async function getApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "API_FOOTBALL_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.API_FOOTBALL_KEY || "";
}

export async function POST() {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "match_sync", status: "running" },
  });

  try {
    const apiKey = await getApiKey();
    if (!apiKey) throw new Error("API_FOOTBALL_KEY not configured");

    // Calculate current season and fetch scheduled/not-started fixtures
    const now = new Date();
    const season = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const fromDate = now.toISOString().slice(0, 10);
    const toDate = new Date(now.getTime() + 120 * 86400000).toISOString().slice(0, 10);

    let res = await fetch(
      `${API_BASE}/fixtures?team=${BARCA_ID}&from=${fromDate}&to=${toDate}&season=${season}`,
      { headers: { "x-apisports-key": apiKey }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    let data = await res.json();
    let matches = data.response || [];

    // Fallback to previous season if no results (free tier limitation)
    if (matches.length === 0 && season > 2022) {
      res = await fetch(
        `${API_BASE}/fixtures?team=${BARCA_ID}&from=${fromDate}&to=${toDate}&season=${season - 1}`,
        { headers: { "x-apisports-key": apiKey }, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      data = await res.json();
      matches = data.response || [];
    }

    // Filter only not-started matches
    matches = matches.filter((m: { fixture: { status: { short: string } } }) =>
      ["NS", "TBD", "PST"].includes(m.fixture.status.short)
    );

    let created = 0;
    let skipped = 0;

    for (const m of matches) {
      const matchDate = new Date(m.fixture.date);
      const isHome = m.teams.home.id === BARCA_ID;
      const opponent = isHome ? m.teams.away.name : m.teams.home.name;
      const opponentLogo = isHome ? m.teams.away.logo : m.teams.home.logo;

      const existing = await prisma.match.findFirst({
        where: {
          opponent,
          date: {
            gte: new Date(matchDate.getTime() - 86400000),
            lte: new Date(matchDate.getTime() + 86400000),
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.match.create({
        data: {
          date: matchDate,
          time: matchDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Europe/Madrid",
          }),
          opponent,
          opponentLogo: opponentLogo || "",
          competition: m.league.name || "La Liga",
          venue: isHome ? "home" : "away",
        },
      });
      created++;
    }

    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: `Synced: ${created} new, ${skipped} existing.`,
        details: { created, skipped, total: matches.length },
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, created, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
