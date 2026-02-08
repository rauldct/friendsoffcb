import { NextRequest, NextResponse } from "next/server";
import { sendNewsletter } from "@/lib/newsletter";

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await sendNewsletter(params.id);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: result.message });
}
