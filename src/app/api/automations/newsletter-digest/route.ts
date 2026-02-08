import { NextResponse } from "next/server";
import { sendLatestDigestAsNewsletter } from "@/lib/newsletter";

export async function POST() {
  const result = await sendLatestDigestAsNewsletter();

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: result.message });
}
