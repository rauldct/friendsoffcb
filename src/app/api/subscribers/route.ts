import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, source, language } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const lang = language === "es" ? "es" : "en";

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (!existing.active) {
        await prisma.subscriber.update({ where: { email }, data: { active: true, language: lang } });
      }
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    await prisma.subscriber.create({
      data: { email, name, language: lang, source: source || "website" },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Subscriber error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
