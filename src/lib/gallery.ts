import sharp from "sharp";
import exifr from "exifr";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import fs from "fs/promises";
import prisma from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "gallery");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_WIDTH = 1920;
const THUMB_SIZE = 400;

export interface UploadValidation {
  valid: boolean;
  error?: string;
}

export interface ExifData {
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ProcessedImage {
  filename: string;
  thumbnailName: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface ModerationResult {
  approved: boolean;
  reason: string;
}

export function validateUpload(
  mimeType: string,
  size: number
): UploadValidation {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: "Only JPG, PNG, and WebP images are allowed.",
    };
  }
  if (size > MAX_SIZE) {
    return { valid: false, error: "Image must be under 10MB." };
  }
  return { valid: true };
}

export async function extractExif(buffer: Buffer): Promise<ExifData> {
  try {
    const data = await exifr.parse(buffer, {
      pick: ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"],
      gps: true,
    });
    return {
      takenAt: data?.DateTimeOriginal
        ? new Date(data.DateTimeOriginal)
        : null,
      latitude: data?.latitude ?? null,
      longitude: data?.longitude ?? null,
    };
  } catch {
    return { takenAt: null, latitude: null, longitude: null };
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FriendsOfBarca/1.0 (friendsofbarca.com)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    if (!addr) return data.display_name || null;
    const parts = [
      addr.city || addr.town || addr.village,
      addr.state,
      addr.country,
    ].filter(Boolean);
    return parts.join(", ") || data.display_name || null;
  } catch {
    return null;
  }
}

export async function processImage(
  buffer: Buffer,
  mimeType: string
): Promise<ProcessedImage> {
  const id = crypto.randomUUID();
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const filename = `${id}.${ext}`;
  const thumbnailName = `${id}_thumb.${ext}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const origWidth = metadata.width || MAX_WIDTH;
  const origHeight = metadata.height || MAX_WIDTH;

  // Resize main image if larger than MAX_WIDTH
  const mainImage =
    origWidth > MAX_WIDTH ? image.resize({ width: MAX_WIDTH, withoutEnlargement: true }) : image;

  const mainBuffer = await mainImage.toBuffer();
  await fs.writeFile(path.join(UPLOAD_DIR, filename), mainBuffer);

  // Thumbnail
  const thumbBuffer = await sharp(buffer)
    .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: "cover" })
    .toBuffer();
  await fs.writeFile(path.join(UPLOAD_DIR, thumbnailName), thumbBuffer);

  const finalMeta = await sharp(mainBuffer).metadata();

  return {
    filename,
    thumbnailName,
    width: finalMeta.width || origWidth,
    height: finalMeta.height || origHeight,
    fileSize: mainBuffer.length,
  };
}

export async function moderateWithClaude(
  buffer: Buffer,
  mimeType: string
): Promise<ModerationResult> {
  // Check DB setting first, then env var
  let apiKey = process.env.ANTHROPIC_API_KEY;
  try {
    const dbSetting = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (dbSetting?.value) apiKey = dbSetting.value;
  } catch {}
  if (!apiKey) {
    return { approved: false, reason: "pending_manual_review" };
  }

  try {
    const client = new Anthropic({ apiKey });
    const base64 = buffer.toString("base64");
    const mediaType = mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `You are a content moderator for FriendsOfBarca.com, a fan website for FC Barcelona football club.

Analyze this image and determine if it should be APPROVED or REJECTED.

APPROVE if the image:
- Shows FC Barcelona players, matches, stadium (Camp Nou), fans, or memorabilia
- Shows football/soccer-related content (any match, stadium, football gear)
- Shows Barcelona city landmarks that fans might visit
- Is a selfie or group photo at a football event or Barcelona location
- Shows football shirts, scarves, banners, or fan merchandise

REJECT if the image:
- Contains explicit/adult content, violence, or hate speech
- Has no relation to football, FC Barcelona, or Barcelona city
- Is spam, advertising, or promotional material
- Contains offensive or inappropriate content

Respond in this exact JSON format only:
{"approved": true/false, "reason": "brief explanation"}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        approved: !!result.approved,
        reason: result.reason || "Moderation complete",
      };
    }
    return { approved: false, reason: "pending_manual_review" };
  } catch {
    // API error → mark for manual review
    return { approved: false, reason: "pending_manual_review" };
  }
}

export async function deletePhotoFiles(
  filename: string,
  thumbnailName: string
): Promise<void> {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch {}
  try {
    await fs.unlink(path.join(UPLOAD_DIR, thumbnailName));
  } catch {}
}
