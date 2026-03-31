import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scrapePenyes } from "@/lib/penyes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));

  const sortBy = searchParams.get("sortBy") || "";
  const sortDir = (searchParams.get("sortDir") === "desc" ? "desc" : "asc") as "asc" | "desc";

  const status = searchParams.get("status");
  const qualityMin = searchParams.get("qualityMin");
  const qualityMax = searchParams.get("qualityMax");
  const qualityFilter = searchParams.get("quality"); // "low" (0-30), "medium" (31-60), "high" (61-100)

  const where: Record<string, unknown> = {};
  if (region && region !== "all") where.region = region;
  if (status) where.enrichmentStatus = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

  // Quality filters
  if (qualityFilter === "low") {
    where.qualityScore = { gte: 0, lte: 30 };
  } else if (qualityFilter === "medium") {
    where.qualityScore = { gte: 31, lte: 60 };
  } else if (qualityFilter === "high") {
    where.qualityScore = { gte: 61 };
  } else if (qualityFilter === "none") {
    where.qualityScore = null;
  } else {
    if (qualityMin) {
      where.qualityScore = { ...((where.qualityScore as Record<string, number>) || {}), gte: parseInt(qualityMin) };
    }
    if (qualityMax) {
      where.qualityScore = { ...((where.qualityScore as Record<string, number>) || {}), lte: parseInt(qualityMax) };
    }
  }

  const [penyes, totalFiltered, counts, lastSyncSetting, enrichmentStats] = await Promise.all([
    prisma.penya.findMany({
      where,
      orderBy: sortBy && ["name", "city", "province", "country", "region", "qualityScore"].includes(sortBy)
        ? [{ [sortBy]: sortDir }, { name: "asc" }]
        : [{ region: "asc" }, { country: "asc" }, { city: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.penya.count({ where }),
    Promise.all([
      prisma.penya.count(),
      prisma.penya.count({ where: { region: "cataluna" } }),
      prisma.penya.count({ where: { region: "spain" } }),
      prisma.penya.count({ where: { region: "world" } }),
    ]),
    prisma.setting.findUnique({ where: { key: "PENYES_LAST_SYNC" } }),
    Promise.all([
      prisma.penya.count({ where: { enrichmentStatus: "enriched" } }),
      prisma.penya.count({ where: { enrichmentStatus: "pending" } }),
      prisma.penya.count({ where: { enrichmentStatus: "failed" } }),
      prisma.penya.count({ where: { enrichmentStatus: "manual" } }),
      prisma.penya.aggregate({ _avg: { qualityScore: true }, where: { qualityScore: { not: null } } }),
    ]),
  ]);

  const serializedPenyes = penyes.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    detailsUpdatedAt: p.detailsUpdatedAt?.toISOString() || null,
    lastEnrichedAt: p.lastEnrichedAt?.toISOString() || null,
  }));

  return NextResponse.json({
    penyes: serializedPenyes,
    counts: {
      total: counts[0],
      cataluna: counts[1],
      spain: counts[2],
      world: counts[3],
    },
    enrichmentStats: {
      enriched: enrichmentStats[0],
      pending: enrichmentStats[1],
      failed: enrichmentStats[2],
      manual: enrichmentStats[3],
      avgQuality: Math.round(enrichmentStats[4]._avg.qualityScore || 0),
    },
    pagination: {
      page,
      pageSize,
      totalFiltered,
      totalPages: Math.ceil(totalFiltered / pageSize),
    },
    lastSync: lastSyncSetting?.value || null,
  });
}

export async function POST() {
  try {
    const result = await scrapePenyes();

    // Save last sync timestamp
    await prisma.setting.upsert({
      where: { key: "PENYES_LAST_SYNC" },
      update: { value: new Date().toISOString() },
      create: { key: "PENYES_LAST_SYNC", value: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
