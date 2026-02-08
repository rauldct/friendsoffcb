import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, type, message } = body;

    if (!email || !message || !type) {
      return NextResponse.json({ error: "Email, type and message are required." }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    await prisma.feedback.create({
      data: {
        email: String(email).slice(0, 255),
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
