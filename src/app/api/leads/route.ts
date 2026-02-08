import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, matchInterested, groupSize, country, message, source } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: { email, name, matchInterested, groupSize, country, message, source: source || "website" },
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
