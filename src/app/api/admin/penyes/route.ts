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

  const status = searchParams.get("status");

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

  const [penyes, totalFiltered, counts, lastSyncSetting] = await Promise.all([
    prisma.penya.findMany({
      where,
      orderBy: [{ region: "asc" }, { country: "asc" }, { city: "asc" }, { name: "asc" }],
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
  ]);

  const serializedPenyes = penyes.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    detailsUpdatedAt: p.detailsUpdatedAt?.toISOString() || null,
  }));

  return NextResponse.json({
    penyes: serializedPenyes,
    counts: {
      total: counts[0],
      cataluna: counts[1],
      spain: counts[2],
      world: counts[3],
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
