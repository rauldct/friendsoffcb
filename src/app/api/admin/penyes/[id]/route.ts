import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { indexPenya } from "@/lib/rag";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const penya = await prisma.penya.findUnique({ where: { id: params.id } });
  if (!penya) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...penya,
    createdAt: penya.createdAt.toISOString(),
    updatedAt: penya.updatedAt.toISOString(),
    detailsUpdatedAt: penya.detailsUpdatedAt?.toISOString() || null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const penya = await prisma.penya.findUnique({ where: { id: params.id } });
  if (!penya) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  // Only allow updating enrichment fields
  const allowedFields = [
    "address", "postalCode", "email", "phone", "website",
    "socialMedia", "president", "foundedYear", "memberCount",
    "description", "notes",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      if (field === "foundedYear" || field === "memberCount") {
        data[field] = body[field] ? Number(body[field]) : null;
      } else {
        data[field] = body[field] || null;
      }
    }
  }

  // Handle socialMedia separately
  if ("socialMedia" in body && typeof body.socialMedia === "object") {
    const sm: Record<string, string> = {};
    if (body.socialMedia?.facebook) sm.facebook = body.socialMedia.facebook;
    if (body.socialMedia?.twitter) sm.twitter = body.socialMedia.twitter;
    if (body.socialMedia?.instagram) sm.instagram = body.socialMedia.instagram;
    if (body.socialMedia?.tiktok) sm.tiktok = body.socialMedia.tiktok;
    data.socialMedia = Object.keys(sm).length > 0 ? sm : Prisma.DbNull;
  }

  data.enrichmentStatus = "manual";
  data.detailsUpdatedAt = new Date();

  const updated = await prisma.penya.update({
    where: { id: params.id },
    data,
  });

  // Auto-reindex in RAG after manual update
  try {
    await indexPenya(params.id);
  } catch (err) {
    console.error("[RAG] Auto-index after manual update failed:", err);
  }

  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    detailsUpdatedAt: updated.detailsUpdatedAt?.toISOString() || null,
  });
}
