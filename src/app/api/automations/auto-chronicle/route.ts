import { NextRequest, NextResponse } from "next/server";
import { generateAutoChronicle } from "@/lib/news-automation";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    // ?today=true → check today's finished matches instead of yesterday's
    const today = request.nextUrl.searchParams.get("today") === "true";
    const targetDate = today ? new Date() : undefined;
    const articleId = await generateAutoChronicle(targetDate);
    if (articleId) {
      return NextResponse.json({ success: true, articleId, message: "Chronicle created successfully." });
    }
    const dayLabel = today ? "today" : "yesterday";
    return NextResponse.json({ success: true, message: `No Barcelona match ${dayLabel}.` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate auto chronicle." },
      { status: 500 }
    );
  }
}
