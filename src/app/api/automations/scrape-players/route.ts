import { NextRequest, NextResponse } from "next/server";
import { scrapePlayerProfiles, shouldScrapePlayers } from "@/lib/scrapers/player-profiles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";

  if (!force) {
    const should = await shouldScrapePlayers(3);
    if (!should) {
      return NextResponse.json({ skipped: true, reason: "Already scraped within the last 3 days" });
    }
  }

  try {
    const result = await scrapePlayerProfiles();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Scrape Players] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
