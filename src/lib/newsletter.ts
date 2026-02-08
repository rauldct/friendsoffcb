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
    .content a { color: #004D98; }
    .content img { max-width: 100%; height: auto; }
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

  // Create newsletter from article content
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: article.title,
      htmlContent: article.content,
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
