import { NextRequest, NextResponse } from "next/server";
import { generateMatchPreview } from "@/lib/news-automation";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("x-cron-secret");

  if (cronSecret && authHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articleId = await generateMatchPreview();
    if (!articleId) {
      return NextResponse.json({ success: true, message: "No preview needed (no upcoming match or already exists)" });
    }
    return NextResponse.json({ success: true, articleId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Match Preview] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
