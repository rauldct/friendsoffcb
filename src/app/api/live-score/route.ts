import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FD_BASE = "https://api.football-data.org/v4";
const BARCA_FD_ID = 81;

async function getFootballDataApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FOOTBALL_DATA_API_KEY" } });
    if (s?.value) return s.value;
  } catch {}
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

interface MatchData {
  homeTeam: { id: number; name: string; crest: string };
  awayTeam: { id: number; name: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  status: string;
  minute: number | null;
  competition: { name: string };
  utcDate: string;
}

const STATUS_MAP: Record<string, string> = {
  "1H": "IN_PLAY",
  "2H": "IN_PLAY",
  "HT": "HALFTIME",
  "ET1": "IN_PLAY",
  "ET2": "IN_PLAY",
  "PEN": "IN_PLAY",
  "FT": "FINISHED",
  "pre": "TIMED",
};

export async function GET() {
  // 1. Check admin manual live match first (covers Copa del Rey + override)
  try {
    const lmSetting = await prisma.setting.findUnique({ where: { key: "LIVE_MATCH" } });
    if (lmSetting?.value) {
      const lm = JSON.parse(lmSetting.value);
      if (lm.active) {
        // Stale match protection: if match started >3.5h ago and isn't FT,
        // treat as finished to avoid showing zombie live banners
        const startedAt = lm.startedAt ? new Date(lm.startedAt).getTime() : 0;
        const elapsedMs = startedAt ? Date.now() - startedAt : 0;
        const isStale = elapsedMs > 3.5 * 60 * 60 * 1000 && lm.status !== "FT";

        if (isStale) {
          return NextResponse.json({
            live: false,
            finished: true,
            homeTeam: lm.homeTeam,
            awayTeam: lm.awayTeam,
            homeScore: lm.homeScore ?? 0,
            awayScore: lm.awayScore ?? 0,
            homeCrest: lm.homeCrest || "",
            awayCrest: lm.awayCrest || "",
            competition: lm.competition || "",
            isHome: lm.venue === "home",
            hasLivePage: true,
          });
        }

        const isLive = ["1H", "2H", "ET1", "ET2", "PEN"].includes(lm.status);
        const isHT = lm.status === "HT";
        const isPre = lm.status === "pre";
        const isFT = lm.status === "FT";

        if (isLive || isHT) {
          return NextResponse.json({
            live: true,
            status: STATUS_MAP[lm.status] || "IN_PLAY",
            minute: lm.minute || null,
            homeTeam: lm.homeTeam,
            awayTeam: lm.awayTeam,
            homeScore: lm.homeScore ?? 0,
            awayScore: lm.awayScore ?? 0,
            homeCrest: lm.homeCrest || "",
            awayCrest: lm.awayCrest || "",
            competition: lm.competition || "",
            isHome: lm.venue === "home",
            hasLivePage: true,
          });
        }

        if (isPre) {
          return NextResponse.json({
            live: false,
            upcoming: true,
            homeTeam: lm.homeTeam,
            awayTeam: lm.awayTeam,
            homeCrest: lm.homeCrest || "",
            awayCrest: lm.awayCrest || "",
            competition: lm.competition || "",
            kickoff: lm.startedAt || new Date().toISOString(),
            isHome: lm.venue === "home",
            hasLivePage: true,
          });
        }

        if (isFT) {
          return NextResponse.json({
            live: false,
            finished: true,
            homeTeam: lm.homeTeam,
            awayTeam: lm.awayTeam,
            homeScore: lm.homeScore ?? 0,
            awayScore: lm.awayScore ?? 0,
            homeCrest: lm.homeCrest || "",
            awayCrest: lm.awayCrest || "",
            competition: lm.competition || "",
            isHome: lm.venue === "home",
            hasLivePage: true,
          });
        }
      }
    }
  } catch {}

  // 2. Fallback to football-data.org API (La Liga + Champions League)
  const fdKey = await getFootballDataApiKey();
  if (!fdKey) {
    return NextResponse.json({ live: false });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?dateFrom=${today}&dateTo=${today}`,
      {
        headers: { "X-Auth-Token": fdKey },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ live: false });
    }

    const data = await res.json();
    const matches: MatchData[] = data.matches || [];

    // Find a live match
    const liveStatuses = ["IN_PLAY", "PAUSED", "HALFTIME"];
    const liveMatch = matches.find((m) => liveStatuses.includes(m.status));

    if (liveMatch) {
      const isHome = liveMatch.homeTeam.id === BARCA_FD_ID;
      return NextResponse.json({
        live: true,
        status: liveMatch.status,
        minute: liveMatch.minute,
        homeTeam: liveMatch.homeTeam.name,
        awayTeam: liveMatch.awayTeam.name,
        homeScore: liveMatch.score.fullTime.home ?? 0,
        awayScore: liveMatch.score.fullTime.away ?? 0,
        homeCrest: liveMatch.homeTeam.crest,
        awayCrest: liveMatch.awayTeam.crest,
        competition: liveMatch.competition.name,
        isHome,
      });
    }

    // Check for upcoming match (within 2 hours)
    const scheduled = matches.find((m) => m.status === "TIMED" || m.status === "SCHEDULED");
    if (scheduled) {
      const kickoff = new Date(scheduled.utcDate);
      const diff = kickoff.getTime() - Date.now();
      if (diff > 0 && diff < 2 * 60 * 60 * 1000) {
        const isHome = scheduled.homeTeam.id === BARCA_FD_ID;
        return NextResponse.json({
          live: false,
          upcoming: true,
          homeTeam: scheduled.homeTeam.name,
          awayTeam: scheduled.awayTeam.name,
          homeCrest: scheduled.homeTeam.crest,
          awayCrest: scheduled.awayTeam.crest,
          competition: scheduled.competition.name,
          kickoff: scheduled.utcDate,
          isHome,
        });
      }
    }

    // Check for recently finished match (within 5 hours of kickoff)
    const finished = matches.find((m) => m.status === "FINISHED");
    if (finished) {
      const finishedTime = new Date(finished.utcDate);
      const elapsed = Date.now() - finishedTime.getTime();
      if (elapsed < 5 * 60 * 60 * 1000) {
        const isHome = finished.homeTeam.id === BARCA_FD_ID;
        return NextResponse.json({
          live: false,
          finished: true,
          homeTeam: finished.homeTeam.name,
          awayTeam: finished.awayTeam.name,
          homeScore: finished.score.fullTime.home ?? 0,
          awayScore: finished.score.fullTime.away ?? 0,
          homeCrest: finished.homeTeam.crest,
          awayCrest: finished.awayTeam.crest,
          competition: finished.competition.name,
          isHome,
        });
      }
    }

    return NextResponse.json({ live: false });
  } catch {
    return NextResponse.json({ live: false });
  }
}
