import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSpam, getClientIp } from "@/lib/spam-detection";

const VALID_TYPES = new Set(["general", "travel", "promotion", "bug", "suggestion", "partnership"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, type, message, _hp, _ts } = body;

    if (!email || !message || !type) {
      return NextResponse.json({ error: "Email, type and message are required." }, { status: 400 });
    }

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim().slice(0, 255);
    const ip = getClientIp(request);

    // Spam check
    const spamResult = checkSpam({
      email: cleanEmail,
      ip,
      honeypot: _hp,
      formLoadedAt: _ts ? Number(_ts) : undefined,
      context: "feedback",
      maxPerHour: 3,
    });

    if (spamResult.isSpam) {
      console.log(`[Feedback] Blocked spam: ${cleanEmail} (${spamResult.reason})`);
      return NextResponse.json({ success: true });
    }

    // Dedup: silently skip if same email + type already exists
    const existing = await prisma.feedback.findFirst({
      where: { email: cleanEmail, type: String(type) },
    });
    if (existing) {
      return NextResponse.json({ success: true });
    }

    await prisma.feedback.create({
      data: {
        email: cleanEmail,
        name: name ? String(name).slice(0, 100) : "",
        type: String(type).slice(0, 50),
        message: String(message).slice(0, 5000),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}
