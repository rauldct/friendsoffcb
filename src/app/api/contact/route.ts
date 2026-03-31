import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSpam, getClientIp } from "@/lib/spam-detection";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, message, _hp, _ts } = body;

    if (!email || !message) {
      return NextResponse.json({ error: "Email and message are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim().slice(0, 255);
    const ip = getClientIp(request);

    // Spam check
    const spamResult = checkSpam({
      email: cleanEmail,
      ip,
      honeypot: _hp,
      formLoadedAt: _ts ? Number(_ts) : undefined,
      context: "contact",
      maxPerHour: 3,
    });

    if (spamResult.isSpam) {
      console.log(`[Contact] Blocked spam: ${cleanEmail} (${spamResult.reason})`);
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Dedup: silently skip if same email already sent contact form
    const existing = await prisma.lead.findFirst({
      where: { email: cleanEmail, source: "contact_form" },
    });
    if (existing) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    await prisma.lead.create({
      data: {
        email: cleanEmail,
        name: name ? String(name).slice(0, 100) : null,
        message: String(message).slice(0, 5000),
        source: "contact_form",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
