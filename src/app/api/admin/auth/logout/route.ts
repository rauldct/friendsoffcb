import { NextResponse } from "next/server";
import { getClearCookieHeader } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", getClearCookieHeader());
  return response;
}
