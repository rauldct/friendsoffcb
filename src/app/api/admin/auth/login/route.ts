import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createToken, getAuthCookieHeader } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, username: user.username });
    const response = NextResponse.json({ success: true, username: user.username });
    response.headers.set("Set-Cookie", getAuthCookieHeader(token));
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
