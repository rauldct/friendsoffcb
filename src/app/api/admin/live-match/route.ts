import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const SETTING_KEY = "LIVE_MATCH";

export interface LiveMatchEvent {
  id: string;
  type: "goal" | "yellow" | "red" | "sub" | "var" | "penalty_scored" | "penalty_missed" | "own_goal";
  team: "home" | "away";
  player: string;
  minute: number;
  detail?: string;
}

export interface LiveMatchCommentary {
  id: string;
  minute: number;
  text: string;
  textEs?: string;
  timestamp: string;
}

export interface LiveMatchData {
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
}

// GET - Return current live match data (or upcoming matches with ?upcoming=1)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Return upcoming matches for the "start match" UI
  if (searchParams.get("upcoming") === "1") {
    try {
      const now = new Date();
      const matches = await prisma.match.findMany({
        where: { date: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) } },
        orderBy: { date: "asc" },
        take: 5,
      });
      return NextResponse.json(matches);
    } catch {
      return NextResponse.json([]);
    }
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting?.value) {
      return NextResponse.json({ active: false });
    }
    const data: LiveMatchData = JSON.parse(setting.value);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ active: false });
  }
}

// POST - Start or fully replace live match
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, homeTeam, awayTeam, homeCrest, awayCrest, competition, venue } = body;

    const data: LiveMatchData = {
      active: true,
      matchId: matchId || undefined,
      homeTeam: homeTeam || "Home",
      awayTeam: awayTeam || "Away",
      homeScore: 0,
      awayScore: 0,
      homeCrest: homeCrest || "",
      awayCrest: awayCrest || "",
      competition: competition || "",
      venue: venue || "home",
      status: "pre",
      minute: 0,
      startedAt: new Date().toISOString(),
      events: [],
      commentary: [],
    };

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(data) },
      create: { key: SETTING_KEY, value: JSON.stringify(data) },
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT - Update live match (score, minute, status, add event/commentary)
export async function PUT(req: NextRequest) {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting?.value) {
      return NextResponse.json({ error: "No active live match" }, { status: 404 });
    }

    const data: LiveMatchData = JSON.parse(setting.value);
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "update_score":
        data.homeScore = body.homeScore ?? data.homeScore;
        data.awayScore = body.awayScore ?? data.awayScore;
        break;

      case "update_minute":
        data.minute = body.minute ?? data.minute;
        break;

      case "update_status":
        data.status = body.status ?? data.status;
        if (body.status === "1H" && data.minute === 0) data.minute = 1;
        if (body.status === "HT") data.minute = 45;
        if (body.status === "2H" && data.minute < 46) data.minute = 46;
        if (body.status === "FT") data.minute = 90;
        break;

      case "add_event": {
        const evt: LiveMatchEvent = {
          id: crypto.randomUUID(),
          type: body.eventType || "goal",
          team: body.team || "home",
          player: body.player || "",
          minute: body.minute ?? data.minute,
          detail: body.detail || "",
        };
        data.events.push(evt);
        // Auto-update score for goals
        if (evt.type === "goal" || evt.type === "penalty_scored") {
          if (evt.team === "home") data.homeScore++;
          else data.awayScore++;
        }
        if (evt.type === "own_goal") {
          // Own goal counts for the other team
          if (evt.team === "home") data.awayScore++;
          else data.homeScore++;
        }
        break;
      }

      case "remove_event": {
        const evtIdx = data.events.findIndex((e) => e.id === body.eventId);
        if (evtIdx >= 0) {
          const removed = data.events[evtIdx];
          // Revert score if it was a goal
          if (removed.type === "goal" || removed.type === "penalty_scored") {
            if (removed.team === "home") data.homeScore = Math.max(0, data.homeScore - 1);
            else data.awayScore = Math.max(0, data.awayScore - 1);
          }
          if (removed.type === "own_goal") {
            if (removed.team === "home") data.awayScore = Math.max(0, data.awayScore - 1);
            else data.homeScore = Math.max(0, data.homeScore - 1);
          }
          data.events.splice(evtIdx, 1);
        }
        break;
      }

      case "add_commentary": {
        const comm: LiveMatchCommentary = {
          id: crypto.randomUUID(),
          minute: body.minute ?? data.minute,
          text: body.text || "",
          textEs: body.textEs || "",
          timestamp: new Date().toISOString(),
        };
        data.commentary.push(comm);
        break;
      }

      case "remove_commentary": {
        const commIdx = data.commentary.findIndex((c) => c.id === body.commentaryId);
        if (commIdx >= 0) data.commentary.splice(commIdx, 1);
        break;
      }

      case "end_match":
        data.active = false;
        data.status = "FT";
        break;

      case "deactivate":
        data.active = false;
        break;

      default:
        // General field updates
        if (body.homeScore !== undefined) data.homeScore = body.homeScore;
        if (body.awayScore !== undefined) data.awayScore = body.awayScore;
        if (body.minute !== undefined) data.minute = body.minute;
        if (body.status !== undefined) data.status = body.status;
        break;
    }

    await prisma.setting.update({
      where: { key: SETTING_KEY },
      data: { value: JSON.stringify(data) },
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE - Remove live match completely
export async function DELETE() {
  try {
    await prisma.setting.deleteMany({ where: { key: SETTING_KEY } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
