import { NextRequest, NextResponse } from "next/server";
import { expireOldConversations } from "@/lib/barca-ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await expireOldConversations();
    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error("[Expire Conversations] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
