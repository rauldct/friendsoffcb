import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validateUpload,
  extractExif,
  reverseGeocode,
  processImage,
  moderateWithClaude,
  deletePhotoFiles,
} from "@/lib/gallery";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploaderName = (formData.get("uploaderName") as string)?.trim();
    const uploaderEmail = (formData.get("uploaderEmail") as string)?.trim();

    if (!file || !uploaderName || !uploaderEmail) {
      return NextResponse.json(
        { error: "File, name, and email are required." },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uploaderEmail)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateUpload(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Rate limit: max 10 uploads/hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUploads = await prisma.photo.count({
      where: {
        uploaderEmail,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentUploads >= 10) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract EXIF
    const exif = await extractExif(buffer);

    // Reverse geocode if GPS available
    let location: string | null = null;
    if (exif.latitude !== null && exif.longitude !== null) {
      location = await reverseGeocode(exif.latitude, exif.longitude);
    }

    // Process image (resize + thumbnail)
    const processed = await processImage(buffer, file.type);

    // Moderate with Claude
    const moderation = await moderateWithClaude(buffer, file.type);

    const status = moderation.approved
      ? "approved"
      : moderation.reason === "pending_manual_review"
        ? "pending"
        : "rejected";

    // If rejected, delete files
    if (status === "rejected") {
      await deletePhotoFiles(processed.filename, processed.thumbnailName);
    }

    // Save to DB (only if not rejected)
    if (status !== "rejected") {
      await prisma.photo.create({
        data: {
          filename: processed.filename,
          thumbnailName: processed.thumbnailName,
          originalName: file.name,
          fileSize: processed.fileSize,
          mimeType: file.type,
          width: processed.width,
          height: processed.height,
          takenAt: exif.takenAt,
          location,
          latitude: exif.latitude,
          longitude: exif.longitude,
          uploaderName,
          uploaderEmail,
          status,
          rejectionReason: null,
          moderatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      status,
      rejectionReason: status === "rejected" ? moderation.reason : undefined,
    });
  } catch (error) {
    console.error("Gallery upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo." },
      { status: 500 }
    );
  }
}
