import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const term = `%${q}%`;

  const [news, posts, packages] = await Promise.all([
    prisma.newsArticle.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { titleEs: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          { excerptEs: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, titleEs: true, excerpt: true, excerptEs: true, category: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.blogPost.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { titleEs: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          { excerptEs: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, titleEs: true, excerpt: true, excerptEs: true, category: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.matchPackage.findMany({
      where: {
        OR: [
          { matchTitle: { contains: q, mode: "insensitive" } },
          { matchTitleEs: { contains: q, mode: "insensitive" } },
          { opponent: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, matchTitle: true, matchTitleEs: true, opponent: true, matchDate: true },
      orderBy: { matchDate: "asc" },
      take: 5,
    }),
  ]);

  const results = [
    ...news.map((n) => ({
      type: "news" as const,
      title: n.title,
      titleEs: n.titleEs,
      excerpt: n.excerpt,
      excerptEs: n.excerptEs,
      url: `/news/${n.slug}`,
    })),
    ...posts.map((p) => ({
      type: (p.category === "guide" ? "guide" : "blog") as "guide" | "blog",
      title: p.title,
      titleEs: p.titleEs,
      excerpt: p.excerpt,
      excerptEs: p.excerptEs,
      url: p.category === "guide" ? `/guides/${p.slug}` : `/blog/${p.slug}`,
    })),
    ...packages.map((p) => ({
      type: "package" as const,
      title: p.matchTitle,
      titleEs: p.matchTitleEs,
      excerpt: p.opponent,
      excerptEs: null as string | null,
      url: `/packages/${p.slug}`,
    })),
  ];

  return NextResponse.json({ results });
}
