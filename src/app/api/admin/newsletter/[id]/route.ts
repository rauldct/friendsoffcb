import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Single newsletter
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const newsletter = await prisma.newsletter.findUnique({ where: { id: params.id } });
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }
  return NextResponse.json(newsletter);
}

// PATCH - Update draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const newsletter = await prisma.newsletter.findUnique({ where: { id: params.id } });
    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    if (newsletter.status !== "draft") {
      return NextResponse.json({ error: "Only drafts can be edited" }, { status: 400 });
    }

    const body = await request.json();
    const { subject, htmlContent, textContent } = body;

    const updated = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(textContent !== undefined && { textContent }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update newsletter" }, { status: 500 });
  }
}
