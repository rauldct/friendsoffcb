import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - List newsletters with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const skip = (page - 1) * pageSize;

  const [newsletters, total] = await Promise.all([
    prisma.newsletter.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.newsletter.count(),
  ]);

  return NextResponse.json({ newsletters, total, page, pageSize });
}

// POST - Create draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, htmlContent, textContent } = body;

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: "Subject and HTML content are required" }, { status: 400 });
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        subject,
        htmlContent,
        textContent: textContent || "",
        status: "draft",
      },
    });

    return NextResponse.json(newsletter, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create newsletter" }, { status: 500 });
  }
}

// DELETE - Delete a draft newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const newsletter = await prisma.newsletter.findUnique({ where: { id } });
    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    if (newsletter.status !== "draft") {
      return NextResponse.json({ error: "Only drafts can be deleted" }, { status: 400 });
    }

    await prisma.newsletter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete newsletter" }, { status: 500 });
  }
}
