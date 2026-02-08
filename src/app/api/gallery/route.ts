import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "24")));
  const skip = (page - 1) * limit;

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.photo.count({ where: { status: "approved" } }),
  ]);

  return NextResponse.json({
    photos: photos.map((p) => ({
      ...p,
      takenAt: p.takenAt?.toISOString() ?? null,
      moderatedAt: p.moderatedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
