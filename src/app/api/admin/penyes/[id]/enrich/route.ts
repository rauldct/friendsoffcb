import { NextRequest, NextResponse } from "next/server";
import { enrichPenya } from "@/lib/penya-enrichment";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await enrichPenya(params.id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.error === "Penya not found" ? 404 : 500 }
    );
  }

  return NextResponse.json({ success: true });
}
