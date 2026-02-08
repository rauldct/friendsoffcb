import { NextResponse } from "next/server";
import { seedRetroactiveContent } from "@/lib/news-automation";

export const maxDuration = 300; // 5 min for long seed operation

export async function POST() {
  try {
    const result = await seedRetroactiveContent(10);
    return NextResponse.json({
      success: true,
      chronicles: result.chronicles,
      digests: result.digests,
      errors: result.errors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed content." },
      { status: 500 }
    );
  }
}
