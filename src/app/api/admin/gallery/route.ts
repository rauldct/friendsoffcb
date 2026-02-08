import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deletePhotoFiles } from "@/lib/gallery";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 24;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.photo.count({ where }),
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, rejectionReason } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid id or status." },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    // If rejecting, delete files
    if (status === "rejected") {
      await deletePhotoFiles(photo.filename, photo.thumbnailName);
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "rejected" ? (rejectionReason || "Rejected by admin") : null,
        moderatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...updated,
      takenAt: updated.takenAt?.toISOString() ?? null,
      moderatedAt: updated.moderatedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required." }, { status: 400 });
    }

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    await deletePhotoFiles(photo.filename, photo.thumbnailName);
    await prisma.photo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
