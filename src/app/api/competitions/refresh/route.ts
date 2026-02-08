import { NextResponse } from "next/server";
import { refreshAllCompetitions } from "@/lib/competitions";

export const maxDuration = 60;

export async function POST() {
  try {
    const result = await refreshAllCompetitions();

    if (result.success) {
      return NextResponse.json({ success: true, message: "All competitions refreshed." });
    } else {
      return NextResponse.json({
        success: false,
        message: "Some competitions failed to refresh.",
        errors: result.errors,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to refresh." },
      { status: 500 }
    );
  }
}
