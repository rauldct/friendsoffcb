import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enrichPenya } from "@/lib/penya-enrichment";
import { indexPenya } from "@/lib/rag";

export const maxDuration = 300;

const BATCH_SIZE = 10;
const DELAY_BETWEEN_MS = 2000;

export async function POST() {
  const results: { id: string; name: string; city: string; success: boolean; error?: string }[] = [];

  try {
    // Select peñas to enrich, prioritized:
    // 1. Never enriched (pending)
    // 2. Failed with cooldown of 7 days
    // 3. Enriched with low quality (< 30) and last enriched > 90 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const pending = await prisma.penya.findMany({
      where: { enrichmentStatus: "pending" },
      orderBy: { name: "asc" },
      take: BATCH_SIZE,
      select: { id: true, name: true, city: true },
    });

    const remaining = BATCH_SIZE - pending.length;
    let failed: { id: string; name: string; city: string }[] = [];
    if (remaining > 0) {
      failed = await prisma.penya.findMany({
        where: {
          enrichmentStatus: "failed",
          OR: [
            { lastEnrichedAt: null },
            { lastEnrichedAt: { lt: sevenDaysAgo } },
          ],
        },
        orderBy: { name: "asc" },
        take: remaining,
        select: { id: true, name: true, city: true },
      });
    }

    const remaining2 = BATCH_SIZE - pending.length - failed.length;
    let lowQuality: { id: string; name: string; city: string }[] = [];
    if (remaining2 > 0) {
      lowQuality = await prisma.penya.findMany({
        where: {
          enrichmentStatus: "enriched",
          qualityScore: { lt: 30 },
          OR: [
            { lastEnrichedAt: null },
            { lastEnrichedAt: { lt: ninetyDaysAgo } },
          ],
        },
        orderBy: [{ qualityScore: "asc" }, { name: "asc" }],
        take: remaining2,
        select: { id: true, name: true, city: true },
      });
    }

    const toProcess = [...pending, ...failed, ...lowQuality];

    if (toProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No peñas to enrich at this time.",
        enriched: 0,
        total: 0,
        errors: 0,
        results: [],
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
      const p = toProcess[i];
      console.log(`[Auto-Enrich] Processing ${i + 1}/${toProcess.length}: ${p.name} (${p.city})`);

      try {
        const enrichResult = await enrichPenya(p.id);

        if (enrichResult.success) {
          // Index for RAG
          try {
            await indexPenya(p.id);
          } catch (ragErr) {
            console.error(`[Auto-Enrich] RAG index failed for ${p.name}:`, ragErr);
          }
          successCount++;
          results.push({ id: p.id, name: p.name, city: p.city, success: true });
        } else {
          errorCount++;
          results.push({ id: p.id, name: p.name, city: p.city, success: false, error: enrichResult.error });
        }
      } catch (err) {
        errorCount++;
        results.push({
          id: p.id, name: p.name, city: p.city, success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }

      // Delay between enrichments
      if (i < toProcess.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_MS));
      }
    }

    const message = `Enriched ${successCount}/${toProcess.length} peñas (${errorCount} errors)`;
    console.log(`[Auto-Enrich] ${message}`);

    // Log to AutomationRun
    await prisma.automationRun.create({
      data: {
        type: "penya_enrichment",
        status: errorCount === toProcess.length ? "error" : "success",
        message,
        details: { enriched: successCount, errors: errorCount, total: toProcess.length },
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
      enriched: successCount,
      total: toProcess.length,
      errors: errorCount,
      results,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Auto-Enrich] Fatal error:", err);

    await prisma.automationRun.create({
      data: {
        type: "penya_enrichment",
        status: "error",
        message: `Fatal: ${errorMsg}`,
        endedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: false, error: errorMsg, results },
      { status: 500 }
    );
  }
}
