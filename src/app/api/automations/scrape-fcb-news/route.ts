import { NextRequest, NextResponse } from "next/server";
import { scrapeFCBNews, shouldScrapeFCBNews } from "@/lib/scrapers/fcb-news";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Slow due to respectful delays

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";

  if (!force) {
    const should = await shouldScrapeFCBNews(6);
    if (!should) {
      return NextResponse.json({ skipped: true, reason: "Already scraped within the last 6 hours" });
    }
  }

  try {
    const result = await scrapeFCBNews();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Scrape FCB News] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
