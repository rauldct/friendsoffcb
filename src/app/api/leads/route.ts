import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSpam, getClientIp } from "@/lib/spam-detection";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, matchInterested, groupSize, country, message, source, _hp, _ts } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
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
      context: "lead",
      maxPerHour: 5,
    });

    if (spamResult.isSpam) {
      console.log(`[Lead] Blocked spam: ${cleanEmail} (${spamResult.reason})`);
      // Silent success — don't reveal to bots
      return NextResponse.json({ success: true, id: "ok" }, { status: 201 });
    }

    // Dedup: silently skip if email already exists as lead
    const existing = await prisma.lead.findFirst({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ success: true, id: existing.id }, { status: 201 });
    }

    const lead = await prisma.lead.create({
      data: {
        email: cleanEmail,
        name: name ? String(name).slice(0, 100) : null,
        matchInterested: matchInterested ? String(matchInterested).slice(0, 200) : null,
        groupSize: groupSize ? Math.min(Math.max(parseInt(groupSize) || 0, 0), 100) : null,
        country: country ? String(country).slice(0, 100) : null,
        message: message ? String(message).slice(0, 2000) : null,
        source: source ? String(source).slice(0, 100) : "website",
      },
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
