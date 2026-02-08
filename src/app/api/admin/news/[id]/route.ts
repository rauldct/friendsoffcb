import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single article
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.newsArticle.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...article,
    publishedAt: article.publishedAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    matchDate: article.matchDate?.toISOString() || null,
  });
}

// PATCH - update article
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.excerpt !== undefined) data.excerpt = body.excerpt;
    if (body.content !== undefined) data.content = body.content;
    if (body.category !== undefined) data.category = body.category;
    if (body.matchResult !== undefined) data.matchResult = body.matchResult;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage;
    if (body.status !== undefined) data.status = body.status;
    if (body.matchDate !== undefined) data.matchDate = body.matchDate ? new Date(body.matchDate) : null;
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription;

    const article = await prisma.newsArticle.update({ where: { id: params.id }, data });
    return NextResponse.json({
      success: true,
      article: { ...article, publishedAt: article.publishedAt.toISOString(), updatedAt: article.updatedAt.toISOString(), matchDate: article.matchDate?.toISOString() || null },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update" }, { status: 500 });
  }
}
