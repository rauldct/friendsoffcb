import { NextResponse } from "next/server";
import { indexAllExistingContent, expireStaleChunks } from "@/lib/knowledge-pipeline";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const expired = await expireStaleChunks();
    const result = await indexAllExistingContent();
    return NextResponse.json({ success: true, expired, ...result });
  } catch (err) {
    console.error("[Admin BarçaAI Reindex] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reindex failed" },
      { status: 500 }
    );
  }
}
