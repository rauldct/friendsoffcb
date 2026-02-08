import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/newsletter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subscriberId = searchParams.get("id");
  const token = searchParams.get("token");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://friendsofbarca.com";

  if (!subscriberId || !token) {
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=error&msg=invalid-link`);
  }

  // Verify token
  if (!verifyUnsubscribeToken(subscriberId, token)) {
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=error&msg=invalid-token`);
  }

  // Deactivate subscriber
  try {
    await prisma.subscriber.update({
      where: { id: subscriberId },
      data: { active: false },
    });
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=success`);
  } catch {
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=error&msg=not-found`);
  }
}
