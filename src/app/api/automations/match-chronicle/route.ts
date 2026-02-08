import { NextResponse } from "next/server";
import { generateMatchChronicle } from "@/lib/news-automation";

export const maxDuration = 60;

export async function POST() {
  try {
    const articleId = await generateMatchChronicle();
    if (articleId) {
      return NextResponse.json({ success: true, articleId });
    }
    return NextResponse.json({ success: true, message: "No Barcelona match today." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate chronicle." },
      { status: 500 }
    );
  }
}
