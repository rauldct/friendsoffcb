import { NextResponse } from "next/server";
import { generateAutoChronicle } from "@/lib/news-automation";

export const maxDuration = 120;

export async function POST() {
  try {
    const articleId = await generateAutoChronicle();
    if (articleId) {
      return NextResponse.json({ success: true, articleId, message: "Chronicle created successfully." });
    }
    return NextResponse.json({ success: true, message: "No Barcelona match yesterday." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate auto chronicle." },
      { status: 500 }
    );
  }
}
