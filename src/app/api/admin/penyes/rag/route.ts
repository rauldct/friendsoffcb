import { NextRequest, NextResponse } from "next/server";
import { reindexAllPenyes, getRAGStats, indexPenya } from "@/lib/rag";

export const dynamic = "force-dynamic";

// GET - RAG stats
export async function GET() {
  try {
    const stats = await getRAGStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[RAG Stats] Error:", err);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}

// POST - Reindex all or a single penya
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.penyaId) {
      // Index a single penya
      const result = await indexPenya(body.penyaId);
      return NextResponse.json({ success: true, ...result });
    }

    // Reindex all
    const result = await reindexAllPenyes();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[RAG Reindex] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
