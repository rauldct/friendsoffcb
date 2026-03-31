import { NextRequest, NextResponse } from "next/server";
import { indexAllExistingContent, expireStaleChunks } from "@/lib/knowledge-pipeline";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Auth: cron secret or admin
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await expireStaleChunks();
    const result = await indexAllExistingContent();
    return NextResponse.json({
      success: true,
      expired,
      ...result,
    });
  } catch (err) {
    console.error("[Knowledge Refresh] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refresh failed" },
      { status: 500 }
    );
  }
}
