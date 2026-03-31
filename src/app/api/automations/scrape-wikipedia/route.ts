import { NextRequest, NextResponse } from "next/server";
import { scrapeWikipedia, shouldScrapeWikipedia } from "@/lib/scrapers/wikipedia-barca";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Wikipedia scraping can take a while

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";

  if (!force) {
    const should = await shouldScrapeWikipedia(7);
    if (!should) {
      return NextResponse.json({ skipped: true, reason: "Already scraped within the last 7 days" });
    }
  }

  try {
    const result = await scrapeWikipedia();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Scrape Wikipedia] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
