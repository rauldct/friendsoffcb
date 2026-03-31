import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const faqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ faqs });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, questionEs, answer, answerEs, sortOrder, active } = body;

  if (!question || !answer) {
    return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
  }

  const faq = await prisma.faq.create({
    data: {
      question,
      questionEs: questionEs || null,
      answer,
      answerEs: answerEs || null,
      sortOrder: sortOrder ?? 0,
      active: active ?? true,
    },
  });

  return NextResponse.json({ faq }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const faq = await prisma.faq.update({ where: { id }, data });
  return NextResponse.json({ faq });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
