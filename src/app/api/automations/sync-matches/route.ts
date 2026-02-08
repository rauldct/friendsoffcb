import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BARCA_FD_ID = 81;
const FD_BASE = "https://api.football-data.org/v4";

async function getFootballDataApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FOOTBALL_DATA_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

export async function POST() {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "match_sync", status: "running" },
  });

  try {
    const apiKey = await getFootballDataApiKey();
    if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not configured");

    const now = new Date();
    const fromDate = now.toISOString().slice(0, 10);
    const toDate = new Date(now.getTime() + 120 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?status=SCHEDULED,TIMED&dateFrom=${fromDate}&dateTo=${toDate}`,
      {
        headers: { "X-Auth-Token": apiKey },
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`football-data.org API error: ${res.status}`);

    const data = await res.json();
    const matches = data.matches || [];

    let created = 0;
    let skipped = 0;

    for (const m of matches) {
      const matchDate = new Date(m.utcDate);
      const isHome = m.homeTeam.id === BARCA_FD_ID;
      const opponent = isHome ? m.awayTeam.name : m.homeTeam.name;
      const opponentLogo = isHome ? (m.awayTeam.crest || "") : (m.homeTeam.crest || "");

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
          opponentLogo,
          competition: m.competition?.name || "La Liga",
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
