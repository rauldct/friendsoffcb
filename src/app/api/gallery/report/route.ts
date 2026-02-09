import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_REASONS = ["inappropriate", "spam", "copyright", "not_related", "other"];
const MAX_REPORTS_AUTO_DISABLE = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId, reason, description } = body;

    if (!photoId || !reason) {
      return NextResponse.json(
        { error: "photoId and reason are required." },
        { status: 400 }
      );
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason." },
        { status: 400 }
      );
    }

    // Validate photo exists and is approved
    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.status !== "approved") {
      return NextResponse.json(
        { error: "Photo not found." },
        { status: 404 }
      );
    }

    // Get reporter IP for rate limiting
    const reporterIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit: max 1 report per IP per photo
    const existingReport = await prisma.photoReport.findFirst({
      where: { photoId, reporterIp },
    });
    if (existingReport) {
      return NextResponse.json(
        { error: "already_reported" },
        { status: 409 }
      );
    }

    // Create report + increment counter
    await prisma.$transaction(async (tx) => {
      await tx.photoReport.create({
        data: {
          photoId,
          reason,
          description: description ? String(description).slice(0, 500) : null,
          reporterIp,
        },
      });

      const updated = await tx.photo.update({
        where: { id: photoId },
        data: { reportCount: { increment: 1 } },
      });

      // Auto-disable if reportCount reaches threshold
      if (updated.reportCount >= MAX_REPORTS_AUTO_DISABLE && updated.status === "approved") {
        await tx.photo.update({
          where: { id: photoId },
          data: { status: "pending" },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { error: "Failed to submit report." },
      { status: 500 }
    );
  }
}
