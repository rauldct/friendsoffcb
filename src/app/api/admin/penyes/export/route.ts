import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const quality = searchParams.get("quality");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const qualityMin = searchParams.get("qualityMin");

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
  if (quality === "low") where.qualityScore = { gte: 0, lte: 30 };
  else if (quality === "medium") where.qualityScore = { gte: 31, lte: 60 };
  else if (quality === "high") where.qualityScore = { gte: 61 };
  else if (quality === "none") where.qualityScore = null;
  else if (qualityMin) where.qualityScore = { gte: parseInt(qualityMin) };

  const penyes = await prisma.penya.findMany({
    where,
    orderBy: [{ region: "asc" }, { country: "asc" }, { city: "asc" }, { name: "asc" }],
  });

  const headers = [
    "Name", "City", "Province", "Country", "Region",
    "Address", "Postal Code", "Email", "Phone", "Website",
    "Facebook", "Twitter", "Instagram", "TikTok",
    "President", "Founded Year", "Member Count",
    "Description", "Status", "Quality Score",
    "Sources Used", "Last Enriched",
  ];

  const rows = penyes.map(p => {
    const sm = (p.socialMedia as { facebook?: string; twitter?: string; instagram?: string; tiktok?: string }) || {};
    const sources = Array.isArray(p.sourcesUsed) ? (p.sourcesUsed as string[]).join("; ") : "";
    return [
      p.name, p.city, p.province, p.country, p.region,
      p.address, p.postalCode, p.email, p.phone, p.website,
      sm.facebook || "", sm.twitter || "", sm.instagram || "", sm.tiktok || "",
      p.president, p.foundedYear?.toString() || "", p.memberCount?.toString() || "",
      p.description, p.enrichmentStatus, p.qualityScore?.toString() || "",
      sources, p.lastEnrichedAt?.toISOString() || "",
    ].map(v => escapeCsv(v as string));
  });

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  const date = new Date().toISOString().split("T")[0];
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="penyes-${date}.csv"`,
    },
  });
}
