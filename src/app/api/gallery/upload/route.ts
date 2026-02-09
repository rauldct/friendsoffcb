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

// Normalize MIME type — iPhones can send empty or application/octet-stream for HEIC
function normalizeMimeType(file: File): string {
  const type = file.type?.toLowerCase();
  if (type && type !== "application/octet-stream") return type;
  // Fallback: infer from extension
  const ext = file.name?.split(".").pop()?.toLowerCase();
  const extMap: Record<string, string> = {
    heic: "image/heic",
    heif: "image/heif",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return extMap[ext || ""] || type || "application/octet-stream";
}

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

    // Normalize MIME type for mobile uploads
    const mimeType = normalizeMimeType(file);

    // Validate file
    const validation = validateUpload(mimeType, file.size);
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

    // Process image (resize + thumbnail + HEIC conversion + EXIF rotation)
    const processed = await processImage(buffer, mimeType);

    // Moderate with Claude
    const moderation = await moderateWithClaude(buffer, mimeType);

    // Confidence-based auto-approval:
    // approved + high → "approved" (auto-published)
    // approved + medium/low → "pending" (manual review)
    // rejected + high → "rejected" (delete files)
    // rejected + medium/low → "pending" (manual review)
    // error/fallback → "pending"
    let status: string;
    if (moderation.approved && moderation.confidence === "high") {
      status = "approved";
    } else if (!moderation.approved && moderation.confidence === "high") {
      status = "rejected";
    } else {
      status = "pending";
    }

    // If rejected, delete files
    if (status === "rejected") {
      await deletePhotoFiles(processed.filename, processed.thumbnailName);
    }

    // Save to DB (only if not rejected)
    if (status !== "rejected") {
      // Store image/jpeg as mimeType when HEIC was converted
      const storedMimeType = (mimeType === "image/heic" || mimeType === "image/heif")
        ? "image/jpeg"
        : mimeType;

      await prisma.photo.create({
        data: {
          filename: processed.filename,
          thumbnailName: processed.thumbnailName,
          originalName: file.name,
          fileSize: processed.fileSize,
          mimeType: storedMimeType,
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
