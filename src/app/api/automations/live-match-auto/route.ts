import { NextResponse } from "next/server";
import { runLiveMatchAuto } from "@/lib/live-match-auto";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runLiveMatchAuto();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Live match auto failed" },
      { status: 500 }
    );
  }
}
