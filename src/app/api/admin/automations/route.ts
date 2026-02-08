import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  const runs = await prisma.automationRun.findMany({
    where: type ? { type } : undefined,
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  const sources = await prisma.rssSource.findMany({
    orderBy: { name: "asc" },
  });

  const newsCount = await prisma.newsArticle.count();
  const chronicleCount = await prisma.newsArticle.count({ where: { category: "chronicle" } });
  const digestCount = await prisma.newsArticle.count({ where: { category: "digest" } });

  return NextResponse.json({
    runs: runs.map((r) => ({
      ...r,
      startedAt: r.startedAt.toISOString(),
      endedAt: r.endedAt?.toISOString() || null,
    })),
    sources,
    stats: { total: newsCount, chronicles: chronicleCount, digests: digestCount },
  });
}
