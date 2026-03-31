import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/newsletter";
import { checkSpam, getClientIp } from "@/lib/spam-detection";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source, language, _hp, _ts } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const ip = getClientIp(request);

    // Spam check
    const spamResult = checkSpam({
      email: email.toLowerCase().trim(),
      ip,
      honeypot: _hp,
      formLoadedAt: _ts ? Number(_ts) : undefined,
      context: "subscribe",
      maxPerHour: 3,
    });

    if (spamResult.isSpam) {
      console.log(`[Subscriber] Blocked spam: ${email} (${spamResult.reason}, score: ${spamResult.score})`);
      // Return 200 to not reveal to bots that they were blocked
      return NextResponse.json({ success: true, message: "Subscribed" });
    }

    const lang = language === "es" ? "es" : "en";
    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.subscriber.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      if (!existing.active) {
        await prisma.subscriber.update({ where: { email: cleanEmail }, data: { active: true, language: lang } });
      }
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    const subscriber = await prisma.subscriber.create({
      data: { email: cleanEmail, name, language: lang, source: source || "website" },
    });

    // Send welcome email asynchronously (don't block the response)
    sendWelcomeEmail(subscriber.id).catch((err) =>
      console.error("[Welcome] Error:", err)
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Subscriber error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
