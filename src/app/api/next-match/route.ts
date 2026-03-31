import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBroadcasts } from "@/lib/broadcast-data";

export const revalidate = 300; // 5 min ISR

export async function GET() {
  try {
    const now = new Date();
    // Start of today (UTC)
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);

    const match = await prisma.match.findFirst({
      where: { date: { gte: startOfToday } },
      orderBy: { date: "asc" },
    });

    if (!match) {
      return NextResponse.json({ hasMatch: false });
    }

    // Parse kickoff: match.date is the date, match.time is HH:MM string
    const kickoffDate = new Date(match.date);
    const [hours, minutes] = (match.time || "21:00").split(":").map(Number);
    kickoffDate.setUTCHours(hours, minutes, 0, 0);

    const msUntilKickoff = kickoffDate.getTime() - now.getTime();
    const hoursUntilKickoff = msUntilKickoff / (1000 * 60 * 60);

    // Only show countdown between 2h and 7 days before kickoff
    if (hoursUntilKickoff < 2 || hoursUntilKickoff > 168) {
      return NextResponse.json({ hasMatch: false });
    }

    const channels = getBroadcasts(match.competition);

    return NextResponse.json({
      hasMatch: true,
      opponent: match.opponent,
      opponentLogo: match.opponentLogo || "",
      competition: match.competition,
      venue: match.venue,
      kickoffUtc: kickoffDate.toISOString(),
      hasChannels: channels.length > 0,
      packageSlug: match.packageSlug || null,
    });
  } catch (e) {
    console.error("next-match API error:", e);
    return NextResponse.json({ hasMatch: false });
  }
}
