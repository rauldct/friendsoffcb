import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, message } = body;

    if (!email || !message) {
      return NextResponse.json({ error: "Email and message are required" }, { status: 400 });
    }

    await prisma.lead.create({
      data: { email, name, message, source: "contact_form" },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
