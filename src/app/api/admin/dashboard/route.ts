import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import prisma from "@/lib/prisma";
import { getApiAlerts } from "@/lib/api-alerts";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "week"; // week | month | year

  // SSL certificate expiry
  let sslExpiry: string | null = null;
  let sslDaysLeft: number | null = null;
  try {
    const { stdout } = await execAsync(
      "echo | openssl s_client -connect friendsofbarca.com:443 -servername friendsofbarca.com 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null",
      { timeout: 10000 }
    );
    const match = stdout.match(/notAfter=(.+)/);
    if (match) {
      const expiryDate = new Date(match[1].trim());
      sslExpiry = expiryDate.toISOString();
      sslDaysLeft = Math.floor((expiryDate.getTime() - Date.now()) / 86400000);
    }
  } catch { /* ignore */ }

  // Page views counter
  let pageViews = 0;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "PAGE_VIEWS" } });
    pageViews = setting ? parseInt(setting.value, 10) || 0 : 0;
  } catch { /* ignore */ }

  // Time-series data based on range
  const now = new Date();
  let sinceDate: Date;
  if (range === "year") {
    sinceDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else if (range === "month") {
    sinceDate = new Date(now.getTime() - 30 * 86400000);
  } else {
    sinceDate = new Date(now.getTime() - 7 * 86400000);
  }

  // Page views chart data
  let pageViewsChart: { date: string; count: number }[] = [];
  try {
    if (range === "year") {
      // Group by month for year view
      const rows = await prisma.$queryRawUnsafe<{ month: string; total: bigint }[]>(`
        SELECT to_char(date, 'YYYY-MM') as month, SUM(count)::bigint as total
        FROM daily_pageviews WHERE date >= $1
        GROUP BY month ORDER BY month
      `, sinceDate);
      pageViewsChart = rows.map(r => ({ date: r.month, count: Number(r.total) }));
    } else {
      // Daily for week/month
      const rows = await prisma.$queryRawUnsafe<{ date: Date; count: number }[]>(`
        SELECT date, count FROM daily_pageviews WHERE date >= $1 ORDER BY date
      `, sinceDate);
      pageViewsChart = rows.map(r => ({
        date: new Date(r.date).toISOString().split("T")[0],
        count: Number(r.count),
      }));
    }
  } catch { /* ignore */ }

  // Subscribers chart data
  let subscribersChart: { date: string; count: number }[] = [];
  try {
    if (range === "year") {
      const rows = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char("subscribedAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM "Subscriber" WHERE "subscribedAt" >= ${sinceDate}
        GROUP BY month ORDER BY month
      `;
      subscribersChart = rows.map(r => ({ date: r.month, count: Number(r.count) }));
    } else {
      const rows = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT to_char("subscribedAt", 'YYYY-MM-DD') as day, COUNT(*)::bigint as count
        FROM "Subscriber" WHERE "subscribedAt" >= ${sinceDate}
        GROUP BY day ORDER BY day
      `;
      subscribersChart = rows.map(r => ({ date: r.day, count: Number(r.count) }));
    }
  } catch { /* ignore */ }

  // API Alerts
  let apiAlerts: { service: string; message: string; code?: number; context?: string; timestamp: string }[] = [];
  try {
    apiAlerts = await getApiAlerts();
  } catch { /* ignore */ }

  return NextResponse.json({
    sslExpiry,
    sslDaysLeft,
    pageViews,
    pageViewsChart,
    subscribersChart,
    apiAlerts,
  });
}
