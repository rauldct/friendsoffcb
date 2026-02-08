import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

// ============== CONFIG ==============

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://friendsofbarca.com";
const FROM_EMAIL = "Friends of Barça <newsletter@friendsofbarca.com>";
const SEND_DELAY_MS = 200; // 200ms between emails to respect rate limits

async function getResendApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "RESEND_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.RESEND_API_KEY || "";
}

function getHmacSecret(): string {
  return process.env.CRON_SECRET || process.env.JWT_SECRET || "fallback-secret";
}

// ============== TOKENS ==============

export function generateUnsubscribeToken(subscriberId: string): string {
  const hmac = crypto.createHmac("sha256", getHmacSecret());
  hmac.update(subscriberId);
  return hmac.digest("hex");
}

export function verifyUnsubscribeToken(subscriberId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(subscriberId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

// ============== MARKDOWN → HTML ==============

export function markdownToHtml(content: string): string {
  let html = content;

  // Escape HTML entities in the raw text (but preserve existing HTML tags if any)
  // Only escape if content looks like plain text (has ## headers)
  if (html.includes("##") && !html.includes("<h2")) {
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ## Headers → <h2>
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");

  // **bold** → <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // *italic* → <em>
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // [text](url) → <a href="url">text</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Double newlines → paragraph breaks
  html = html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      // Don't wrap headers in <p>
      if (block.startsWith("<h2") || block.startsWith("<h3")) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

// ============== EMAIL TEMPLATE ==============

export function renderEmailTemplate({
  subject,
  htmlContent,
  unsubscribeUrl,
  trackingPixelUrl,
}: {
  subject: string;
  htmlContent: string;
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1A1A2E 0%, #004D98 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #EDBB00; font-size: 24px; margin: 0; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0; }
    .content { padding: 32px 24px; color: #1A1A2E; font-size: 16px; line-height: 1.6; }
    .content h2 { color: #004D98; margin-top: 24px; }
    .content h3 { color: #A50044; margin-top: 20px; }
    .content a { color: #004D98; }
    .content img { max-width: 100%; height: auto; }
    .article-card { border-left: 3px solid #004D98; padding: 12px 16px; margin: 16px 0; background-color: #f8f9fa; }
    .article-card h3 { margin: 0 0 8px; color: #1A1A2E; font-size: 16px; }
    .article-card p { margin: 0; font-size: 14px; color: #4a5568; }
    .article-card a { color: #004D98; font-size: 13px; font-weight: 600; }
    .footer { background-color: #1A1A2E; padding: 24px; text-align: center; }
    .footer p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0; }
    .footer a { color: #EDBB00; text-decoration: none; }
    .divider { height: 3px; background: linear-gradient(90deg, #A50044, #004D98, #EDBB00); }
    .cta-button { display: inline-block; background-color: #A50044; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Friends of Bar&ccedil;a</h1>
      <p>Your FC Barcelona Travel &amp; Experience Guide</p>
    </div>
    <div class="divider"></div>
    <div class="content">
      ${htmlContent}
    </div>
    <div class="divider"></div>
    <div class="footer">
      <p><a href="${SITE_URL}">friendsofbarca.com</a></p>
      <p>The ultimate guide for Barça fans visiting Barcelona</p>
      ${unsubscribeUrl ? `<p style="margin-top: 12px;"><a href="${unsubscribeUrl}">Unsubscribe</a> from this newsletter</p>` : ""}
    </div>
    ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />` : ""}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============== SEND ==============

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendNewsletter(newsletterId: string): Promise<{ success: boolean; message: string }> {
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    return { success: false, message: "RESEND_API_KEY not configured" };
  }

  const newsletter = await prisma.newsletter.findUnique({ where: { id: newsletterId } });
  if (!newsletter) {
    return { success: false, message: "Newsletter not found" };
  }
  if (newsletter.status !== "draft") {
    return { success: false, message: `Newsletter is ${newsletter.status}, only drafts can be sent` };
  }

  const subscribers = await prisma.subscriber.findMany({ where: { active: true } });
  if (subscribers.length === 0) {
    return { success: false, message: "No active subscribers" };
  }

  // Mark as sending
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { status: "sending", recipientCount: subscribers.length },
  });

  // Log automation run
  const run = await prisma.automationRun.create({
    data: {
      type: "newsletter_send",
      status: "running",
      message: `Sending newsletter "${newsletter.subject}" to ${subscribers.length} subscribers`,
      details: { newsletterId, subject: newsletter.subject },
    },
  });

  const resend = new Resend(apiKey);
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    const token = generateUnsubscribeToken(sub.id);
    const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe?id=${sub.id}&token=${token}`;
    const trackingPixelUrl = `${SITE_URL}/api/newsletter/track?nid=${newsletterId}&sid=${sub.id}`;

    const html = renderEmailTemplate({
      subject: newsletter.subject,
      htmlContent: newsletter.htmlContent,
      unsubscribeUrl,
      trackingPixelUrl,
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject: newsletter.subject,
        html,
        text: newsletter.textContent || undefined,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
      });
      sentCount++;
    } catch (err) {
      failedCount++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${sub.email}: ${msg}`);
    }

    if (sentCount + failedCount < subscribers.length) {
      await sleep(SEND_DELAY_MS);
    }
  }

  const finalStatus = failedCount === subscribers.length ? "failed" : "sent";

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      sentCount,
      failedCount,
      errorMessage: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  await prisma.automationRun.update({
    where: { id: run.id },
    data: {
      status: failedCount === subscribers.length ? "error" : "success",
      message: `Sent: ${sentCount}, Failed: ${failedCount}`,
      endedAt: new Date(),
    },
  });

  return {
    success: finalStatus === "sent",
    message: `Sent: ${sentCount}, Failed: ${failedCount} of ${subscribers.length} subscribers`,
  };
}

// ============== DIGEST → NEWSLETTER ==============

export async function sendDigestAsNewsletter(articleId: string): Promise<{ success: boolean; message: string }> {
  const article = await prisma.newsArticle.findUnique({ where: { id: articleId } });
  if (!article) {
    return { success: false, message: "Article not found" };
  }

  // Convert markdown content to HTML
  const htmlContent = markdownToHtml(article.content);

  // Create newsletter from article content
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: article.title,
      htmlContent,
      textContent: article.excerpt,
      status: "draft",
    },
  });

  return sendNewsletter(newsletter.id);
}

// Create and send newsletter from the latest digest article
export async function sendLatestDigestAsNewsletter(): Promise<{ success: boolean; message: string }> {
  const latestDigest = await prisma.newsArticle.findFirst({
    where: { category: "digest", status: "published" },
    orderBy: { publishedAt: "desc" },
  });

  if (!latestDigest) {
    return { success: false, message: "No published digest found" };
  }

  // Check if already sent recently (within last 3 days)
  const recentNewsletter = await prisma.newsletter.findFirst({
    where: {
      subject: latestDigest.title,
      status: { in: ["sent", "sending"] },
    },
  });

  if (recentNewsletter) {
    return { success: false, message: `Digest "${latestDigest.title}" was already sent as newsletter` };
  }

  return sendDigestAsNewsletter(latestDigest.id);
}

// ============== WEEKLY NEWSLETTER (100% AUTO) ==============

export async function generateAndSendWeeklyNewsletter(): Promise<{ success: boolean; message: string }> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // 1. Find all published articles from the last 7 days (digests + chronicles)
  let articles = await prisma.newsArticle.findMany({
    where: {
      status: "published",
      publishedAt: { gte: weekAgo },
    },
    orderBy: { publishedAt: "desc" },
  });

  // 2. If no recent articles, try to generate a fresh digest
  if (articles.length === 0) {
    console.log("[Weekly Newsletter] No recent articles, generating fresh digest...");
    try {
      const { generateNewsDigest } = await import("@/lib/news-automation");
      const articleId = await generateNewsDigest();
      if (articleId) {
        const freshArticle = await prisma.newsArticle.findUnique({ where: { id: articleId } });
        if (freshArticle) articles = [freshArticle];
      }
    } catch (err) {
      console.error("[Weekly Newsletter] Failed to generate digest:", err);
    }
  }

  if (articles.length === 0) {
    return { success: false, message: "No articles available for weekly newsletter" };
  }

  // 3. Check if we already sent a weekly newsletter this week
  const weeklySubjectPrefix = `Weekly Barça Roundup`;
  const dateRange = `${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const subject = `${weeklySubjectPrefix}: ${dateRange}`;

  const existingNewsletter = await prisma.newsletter.findFirst({
    where: {
      subject,
      status: { in: ["sent", "sending"] },
    },
  });

  if (existingNewsletter) {
    return { success: false, message: `Weekly newsletter "${subject}" already sent` };
  }

  // 4. Compose HTML from all articles
  const articleCards = articles.map((article) => {
    const pubDate = article.publishedAt
      ? new Date(article.publishedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "";
    const categoryLabel = article.category === "chronicle" ? "Match Report" : "News Digest";
    const articleUrl = `${SITE_URL}/news/${article.slug}`;

    return `<div class="article-card">
      <h3>${escapeHtml(article.title)}</h3>
      <p><em>${categoryLabel} &mdash; ${pubDate}</em></p>
      <p>${escapeHtml(article.excerpt)}</p>
      <p><a href="${articleUrl}">Read full article &rarr;</a></p>
    </div>`;
  }).join("\n");

  // If we only have 1 article, also include its full content converted to HTML
  let fullContent = "";
  if (articles.length === 1) {
    fullContent = markdownToHtml(articles[0].content);
  }

  const htmlContent = `
    <h2>This Week in Bar&ccedil;a</h2>
    <p>Here's your weekly roundup of FC Barcelona news and match reports from ${dateRange}.</p>
    ${articles.length === 1 ? fullContent : articleCards}
    <p style="text-align: center; margin-top: 24px;">
      <a href="${SITE_URL}/news" class="cta-button">Read All News</a>
    </p>
  `;

  // Build plain text version
  const textContent = articles.map((a) => `${a.title}\n${a.excerpt}\n${SITE_URL}/news/${a.slug}`).join("\n\n");

  // 5. Create newsletter and send
  const newsletter = await prisma.newsletter.create({
    data: {
      subject,
      htmlContent,
      textContent,
      status: "draft",
    },
  });

  console.log(`[Weekly Newsletter] Created newsletter "${subject}" with ${articles.length} articles`);

  return sendNewsletter(newsletter.id);
}
