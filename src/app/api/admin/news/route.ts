import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - list all news articles with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        matchResult: true,
        author: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return NextResponse.json({
    articles: articles.map(a => ({
      ...a,
      publishedAt: a.publishedAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// POST - create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, excerpt, content, category, matchDate, matchResult, coverImage, status } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    // Ensure unique slug
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const article = await prisma.newsArticle.create({
      data: {
        slug: finalSlug,
        title,
        excerpt: excerpt || title,
        content,
        category: category || "chronicle",
        matchDate: matchDate ? new Date(matchDate) : null,
        matchResult: matchResult || null,
        coverImage: coverImage || "/images/packages/camp-nou-match.jpg",
        author: "Friends of Barça AI",
        metaTitle: title.slice(0, 70),
        metaDescription: (excerpt || title).slice(0, 160),
        status: status || "published",
      },
    });

    return NextResponse.json({ success: true, article: { ...article, publishedAt: article.publishedAt.toISOString(), updatedAt: article.updatedAt.toISOString() } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create article" }, { status: 500 });
  }
}

// DELETE - delete article by id
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.newsArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete" }, { status: 500 });
  }
}
