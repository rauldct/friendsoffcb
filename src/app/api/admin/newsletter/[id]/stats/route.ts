import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
    select: { id: true, sentCount: true, openCount: true },
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  // Get per-subscriber opens with subscriber info
  const opens = await prisma.newsletterOpen.findMany({
    where: { newsletterId: id },
    orderBy: { openedAt: "desc" },
    select: {
      subscriberId: true,
      openedAt: true,
    },
  });

  // Fetch subscriber emails for the opens
  const subscriberIds = opens.map(o => o.subscriberId);
  const subscribers = await prisma.subscriber.findMany({
    where: { id: { in: subscriberIds } },
    select: { id: true, email: true, name: true },
  });

  const subMap = new Map(subscribers.map(s => [s.id, s]));

  const opensList = opens.map(o => {
    const sub = subMap.get(o.subscriberId);
    return {
      email: sub?.email || "Unknown",
      name: sub?.name || null,
      openedAt: o.openedAt.toISOString(),
    };
  });

  const uniqueOpens = opens.length;
  const openRate = newsletter.sentCount > 0
    ? ((uniqueOpens / newsletter.sentCount) * 100).toFixed(1)
    : "0";

  return NextResponse.json({
    uniqueOpens,
    totalOpens: newsletter.openCount,
    openRate,
    sentCount: newsletter.sentCount,
    opens: opensList,
  });
}
