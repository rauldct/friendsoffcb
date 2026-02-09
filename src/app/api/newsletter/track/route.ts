import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 1x1 transparent GIF
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const newsletterId = searchParams.get("nid");
  const subscriberId = searchParams.get("sid");

  if (newsletterId) {
    try {
      // Increment aggregate openCount
      await prisma.newsletter.update({
        where: { id: newsletterId },
        data: { openCount: { increment: 1 } },
      });

      // Track per-subscriber open (only first open creates the record)
      if (subscriberId) {
        await prisma.newsletterOpen.upsert({
          where: {
            newsletterId_subscriberId: { newsletterId, subscriberId },
          },
          create: { newsletterId, subscriberId },
          update: {}, // no-op on subsequent opens
        });
      }
    } catch {
      // Silently ignore tracking errors
    }
  }

  return new NextResponse(PIXEL_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
