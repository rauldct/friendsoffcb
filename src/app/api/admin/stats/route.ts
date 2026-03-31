import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    pageViewsSetting,
    totalSubscribers,
    activeSubscribers,
    subscribersLast30,
    subscribersLast7,
    totalLeads,
    leadsLast30,
    leadsLast7,
    totalNewsletters,
    sentNewsletters,
    totalOpens,
    totalNewsArticles,
    chronicles,
    digests,
    totalPhotos,
    approvedPhotos,
    pendingPhotos,
    totalPenyes,
    enrichedPenyes,
    // Time-series data for charts
    subscribersByMonth,
    leadsByMonth,
    newslettersSent,
  ] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "PAGE_VIEWS" } }),
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { active: true } }),
    prisma.subscriber.count({ where: { subscribedAt: { gte: thirtyDaysAgo } } }),
    prisma.subscriber.count({ where: { subscribedAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.newsletter.count(),
    prisma.newsletter.count({ where: { status: "sent" } }),
    prisma.newsletterOpen.count(),
    prisma.newsArticle.count({ where: { status: "published" } }),
    prisma.newsArticle.count({ where: { status: "published", category: "chronicle" } }),
    prisma.newsArticle.count({ where: { status: "published", category: "digest" } }),
    prisma.photo.count(),
    prisma.photo.count({ where: { status: "approved" } }),
    prisma.photo.count({ where: { status: "pending" } }),
    prisma.penya.count(),
    prisma.penya.count({ where: { enrichmentStatus: "enriched" } }),
    // Subscribers grouped by month (last 6 months)
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char("subscribedAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
      FROM "Subscriber"
      WHERE "subscribedAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      GROUP BY month ORDER BY month
    `,
    // Leads grouped by month (last 6 months)
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
      FROM "Lead"
      WHERE "createdAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      GROUP BY month ORDER BY month
    `,
    // Newsletters sent with open rates
    prisma.newsletter.findMany({
      where: { status: "sent" },
      orderBy: { sentAt: "desc" },
      take: 10,
      select: {
        id: true,
        subject: true,
        sentAt: true,
        recipientCount: true,
        openCount: true,
        _count: { select: { opens: true } },
      },
    }),
  ]);

  const pageViews = pageViewsSetting ? parseInt(pageViewsSetting.value, 10) || 0 : 0;

  // Calculate average open rate
  const sentWithRecipients = newslettersSent.filter(n => n.recipientCount > 0);
  const avgOpenRate = sentWithRecipients.length > 0
    ? sentWithRecipients.reduce((sum, n) => sum + (n._count.opens / n.recipientCount) * 100, 0) / sentWithRecipients.length
    : 0;

  return NextResponse.json({
    traffic: {
      pageViews,
    },
    subscribers: {
      total: totalSubscribers,
      active: activeSubscribers,
      inactive: totalSubscribers - activeSubscribers,
      last30Days: subscribersLast30,
      last7Days: subscribersLast7,
      byMonth: subscribersByMonth.map(r => ({ month: r.month, count: Number(r.count) })),
    },
    leads: {
      total: totalLeads,
      last30Days: leadsLast30,
      last7Days: leadsLast7,
      byMonth: leadsByMonth.map(r => ({ month: r.month, count: Number(r.count) })),
    },
    newsletters: {
      total: totalNewsletters,
      sent: sentNewsletters,
      totalOpens,
      avgOpenRate: Math.round(avgOpenRate * 10) / 10,
      recent: newslettersSent.map(n => ({
        id: n.id,
        subject: n.subject,
        sentAt: n.sentAt?.toISOString() || null,
        recipients: n.recipientCount,
        uniqueOpens: n._count.opens,
        openRate: n.recipientCount > 0 ? Math.round((n._count.opens / n.recipientCount) * 1000) / 10 : 0,
      })),
    },
    content: {
      newsArticles: totalNewsArticles,
      chronicles,
      digests,
      photos: totalPhotos,
      photosApproved: approvedPhotos,
      photosPending: pendingPhotos,
    },
    community: {
      penyes: totalPenyes,
      penyesEnriched: enrichedPenyes,
    },
  });
}
