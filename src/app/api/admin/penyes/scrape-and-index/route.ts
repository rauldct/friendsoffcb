import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scrapePage } from "@/lib/penya-enrichment";
import { indexPenya } from "@/lib/rag";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  try {
    // Get all enriched/manual peñas
    const penyes = await prisma.penya.findMany({
      where: { enrichmentStatus: { in: ["enriched", "manual"] } },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        website: true,
        scrapedContent: true,
      },
    });

    const results = {
      total: penyes.length,
      scraped: 0,
      indexed: 0,
      errors: [] as string[],
    };

    for (const penya of penyes) {
      try {
        // Re-scrape if has valid website
        if (penya.website) {
          console.log(`[Scrape&Index] Scraping ${penya.name}: ${penya.website}`);
          const page = await scrapePage(penya.website);

          if (page) {
            const scrapedContent = {
              url: page.url,
              title: page.title,
              metaDescription: page.description,
              bodyText: page.bodyText,
              emails: page.emails,
              phones: page.phones,
              socialLinks: page.socialLinks,
              scrapedAt: new Date().toISOString(),
            };

            await prisma.penya.update({
              where: { id: penya.id },
              data: {
                scrapedContent: scrapedContent as unknown as Prisma.InputJsonValue,
                lastScrapedAt: new Date(),
              },
            });
            results.scraped++;
            console.log(`[Scrape&Index] ${penya.name}: scraped OK (${page.bodyText.length} chars)`);
          } else {
            console.log(`[Scrape&Index] ${penya.name}: scrape returned null`);
          }

          // Delay between scrapes
          await new Promise(r => setTimeout(r, 2000));
        }

        // Re-index in RAG (all peñas, not just those with website)
        const indexResult = await indexPenya(penya.id);
        results.indexed++;
        console.log(`[Scrape&Index] ${penya.name}: indexed ${indexResult.chunksCreated} chunks`);
      } catch (err) {
        const msg = `${penya.name}: ${err instanceof Error ? err.message : "unknown error"}`;
        console.error(`[Scrape&Index] Error: ${msg}`);
        results.errors.push(msg);
      }
    }

    console.log(`[Scrape&Index] Complete: ${results.scraped} scraped, ${results.indexed} indexed, ${results.errors.length} errors`);
    return NextResponse.json(results);
  } catch (err) {
    console.error("[Scrape&Index] Fatal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
