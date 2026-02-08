import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderEmailTemplate } from "@/lib/newsletter";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const newsletter = await prisma.newsletter.findUnique({ where: { id: params.id } });
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  const html = renderEmailTemplate({
    subject: newsletter.subject,
    htmlContent: newsletter.htmlContent,
    unsubscribeUrl: "#unsubscribe-preview",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
