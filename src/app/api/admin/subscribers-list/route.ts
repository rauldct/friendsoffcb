import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  // Get open counts per subscriber
  const openStats = await prisma.newsletterOpen.groupBy({
    by: ["subscriberId"],
    _count: { id: true },
    _max: { openedAt: true },
  });

  const openMap = new Map(
    openStats.map(s => [s.subscriberId, { count: s._count.id, lastOpen: s._max.openedAt }])
  );

  const enriched = subscribers.map(sub => ({
    ...sub,
    subscribedAt: sub.subscribedAt.toISOString(),
    totalOpens: openMap.get(sub.id)?.count || 0,
    lastOpenAt: openMap.get(sub.id)?.lastOpen?.toISOString() || null,
  }));

  return NextResponse.json({ subscribers: enriched });
}
