import { NextResponse } from "next/server";
import { generateNewsDigest } from "@/lib/news-automation";

export const maxDuration = 60;

export async function POST() {
  try {
    const articleId = await generateNewsDigest();
    return NextResponse.json({ success: true, articleId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate digest." },
      { status: 500 }
    );
  }
}
