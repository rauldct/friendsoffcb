import { NextRequest, NextResponse } from "next/server";
import { syncPackages } from "@/lib/package-sync";

export async function POST(request: NextRequest) {
  try {
    // Auth: either admin cookie or cron secret
    const cronSecret = request.headers.get("X-Cron-Secret");
    const expectedSecret = process.env.CRON_SECRET || "";
    const isAdmin = request.cookies.get("admin_token")?.value;

    if (!isAdmin && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncPackages();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.packagesUpdated} packages (${result.stubhubMatched} StubHub, ${result.gygActivities} GYG)`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
