import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiAlerts } from "@/lib/api-alerts";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[DailyReport] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return false;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    console.error("[DailyReport] Telegram error:", await res.text());
    return false;
  }
  return true;
}

export async function POST() {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Page views (24h, week, month)
    let pageViewsToday = 0;
    let pageViewsWeek = 0;
    let pageViewsMonth = 0;
    let pageViewsTotal = 0;
    try {
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const rows24h = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COALESCE(SUM(count), 0)::int as count FROM daily_pageviews WHERE date >= $1::date`,
        yesterdayStr
      );
      pageViewsToday = rows24h[0]?.count || 0;

      // Week: from last Monday
      const dayOfWeek = now.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
      const mondayStr = monday.toISOString().split("T")[0];
      const rowsWeek = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COALESCE(SUM(count), 0)::int as count FROM daily_pageviews WHERE date >= $1::date`,
        mondayStr
      );
      pageViewsWeek = rowsWeek[0]?.count || 0;

      // Month: from 1st of current month
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStr = firstOfMonth.toISOString().split("T")[0];
      const rowsMonth = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COALESCE(SUM(count), 0)::int as count FROM daily_pageviews WHERE date >= $1::date`,
        monthStr
      );
      pageViewsMonth = rowsMonth[0]?.count || 0;

      const totalSetting = await prisma.setting.findUnique({ where: { key: "PAGE_VIEWS" } });
      pageViewsTotal = totalSetting ? parseInt(totalSetting.value, 10) || 0 : 0;
    } catch {}

    // 2. Subscribers
    let newSubscribers = 0;
    let totalSubscribers = 0;
    try {
      newSubscribers = await prisma.subscriber.count({
        where: { subscribedAt: { gte: yesterday } },
      });
      totalSubscribers = await prisma.subscriber.count({
        where: { active: true },
      });
    } catch {}

    // 3. News articles published in last 24h
    let newArticles: { title: string; category: string }[] = [];
    try {
      const articles = await prisma.newsArticle.findMany({
        where: { status: "published", publishedAt: { gte: yesterday } },
        select: { title: true, category: true },
        orderBy: { publishedAt: "desc" },
      });
      newArticles = articles;
    } catch {}

    // 4. API Alerts (incidents)
    let apiAlerts: { service: string; message: string; context?: string; timestamp: string }[] = [];
    try {
      apiAlerts = await getApiAlerts();
    } catch {}

    // 5. SSL certificate
    let sslDaysLeft: number | null = null;
    try {
      const { stdout } = await execAsync(
        "echo | openssl s_client -connect friendsofbarca.com:443 -servername friendsofbarca.com 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null",
        { timeout: 10000 }
      );
      const match = stdout.match(/notAfter=(.+)/);
      if (match) {
        const expiryDate = new Date(match[1].trim());
        sslDaysLeft = Math.floor((expiryDate.getTime() - Date.now()) / 86400000);
      }
    } catch {}

    // 6. PM2 process status
    let pm2Status = "unknown";
    try {
      const { stdout } = await execAsync("pm2 jlist", { timeout: 5000 });
      const procs = JSON.parse(stdout);
      const fob = procs.find((p: any) => p.name === "friendsofbarca");
      if (fob) {
        pm2Status = fob.pm2_env?.status || "unknown";
        const uptime = fob.pm2_env?.pm_uptime;
        if (uptime) {
          const uptimeHours = Math.floor((Date.now() - uptime) / 3600000);
          pm2Status += ` (uptime: ${uptimeHours}h)`;
        }
      }
    } catch {}

    // 7. Disk usage
    let diskUsage = "";
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5 \" used (\" $3 \"/\" $2 \")\"}'", { timeout: 5000 });
      diskUsage = stdout.trim();
    } catch {}

    // 8. DB size
    let dbSize = "";
    try {
      const rows = await prisma.$queryRawUnsafe<{ size: string }[]>(
        `SELECT pg_size_pretty(pg_database_size('friendsofbarca')) as size`
      );
      dbSize = rows[0]?.size || "";
    } catch {}

    // Build message
    const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const lines: string[] = [];

    lines.push(`📊 <b>FriendsOfBarca - Informe Diario</b>`);
    lines.push(`📅 ${dateStr}`);
    lines.push("");

    // Traffic
    lines.push(`👁 <b>Tráfico:</b>`);
    lines.push(`  • 24h: ${pageViewsToday.toLocaleString("es")} visitas`);
    lines.push(`  • Semana: ${pageViewsWeek.toLocaleString("es")}`);
    lines.push(`  • Mes: ${pageViewsMonth.toLocaleString("es")}`);
    lines.push(`  • Total: ${pageViewsTotal.toLocaleString("es")}`);

    // Subscribers
    lines.push(`📬 <b>Suscriptores:</b> ${totalSubscribers} activos${newSubscribers > 0 ? ` (+${newSubscribers} nuevos)` : ""}`);
    lines.push("");

    // Content
    if (newArticles.length > 0) {
      lines.push(`📰 <b>Publicado (24h):</b>`);
      for (const a of newArticles.slice(0, 5)) {
        const icon = a.category === "chronicle" ? "⚽" : "📋";
        lines.push(`  ${icon} ${a.title}`);
      }
      if (newArticles.length > 5) lines.push(`  ... y ${newArticles.length - 5} más`);
    } else {
      lines.push(`📰 Sin publicaciones nuevas (24h)`);
    }
    lines.push("");

    // System
    lines.push(`🖥 <b>Sistema:</b>`);
    lines.push(`  • Proceso: ${pm2Status}`);
    if (diskUsage) lines.push(`  • Disco: ${diskUsage}`);
    if (dbSize) lines.push(`  • Base datos: ${dbSize}`);
    if (sslDaysLeft !== null) {
      const sslIcon = sslDaysLeft < 14 ? "⚠️" : "✅";
      lines.push(`  • SSL: ${sslIcon} ${sslDaysLeft} días restantes`);
    }

    // Incidents
    if (apiAlerts.length > 0) {
      lines.push("");
      lines.push(`🚨 <b>INCIDENCIAS ACTIVAS (${apiAlerts.length}):</b>`);
      for (const a of apiAlerts) {
        const ago = Math.floor((Date.now() - new Date(a.timestamp).getTime()) / 3600000);
        lines.push(`  ❌ <b>${a.service}</b>: ${a.message}${a.context ? ` (${a.context})` : ""} — hace ${ago}h`);
      }
    } else {
      lines.push("");
      lines.push(`✅ Sin incidencias activas`);
    }

    const message = lines.join("\n");

    // Send to Telegram
    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: sent,
      message: sent ? "Daily report sent to Telegram" : "Failed to send",
      preview: message,
    });
  } catch (err) {
    console.error("[DailyReport] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
