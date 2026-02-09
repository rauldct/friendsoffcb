import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

// ============== CONFIG ==============

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://friendsofbarca.com";
const FROM_EMAIL = "Friends of Barça <newsletter@friendsofbarca.com>";
const SEND_DELAY_MS = 200; // 200ms between emails to respect rate limits

// Image pool for newsletters (absolute URLs for email clients)
const IMAGE_POOL = {
  hero: [
    `${SITE_URL}/images/packages/camp-nou-aerial.jpg`,
    `${SITE_URL}/images/packages/camp-nou-night.jpg`,
    `${SITE_URL}/images/packages/camp-nou-match.jpg`,
    `${SITE_URL}/images/packages/camp-nou-panoramic.jpg`,
  ],
  match: [
    `${SITE_URL}/images/news/match-home-1.jpg`,
    `${SITE_URL}/images/news/match-home-2.jpg`,
    `${SITE_URL}/images/news/match-aerial.jpg`,
    `${SITE_URL}/images/news/match-night.jpg`,
    `${SITE_URL}/images/news/match-champions.jpg`,
  ],
  barcelona: [
    `${SITE_URL}/images/blog/barcelona-rambla.jpg`,
    `${SITE_URL}/images/blog/barcelona-gothic.jpg`,
    `${SITE_URL}/images/blog/barcelona-view.jpg`,
    `${SITE_URL}/images/blog/barca-museum.jpg`,
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNewsletterImages(): { hero: string; match: string; city: string } {
  return {
    hero: pickRandom(IMAGE_POOL.hero),
    match: pickRandom(IMAGE_POOL.match),
    city: pickRandom(IMAGE_POOL.barcelona),
  };
}

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
  lang = "en",
}: {
  subject: string;
  htmlContent: string;
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
  lang?: string;
}): string {
  const subtitle = lang === "es"
    ? "Tu gu&iacute;a de viajes y experiencias del FC Barcelona"
    : "Your FC Barcelona Travel &amp; Experience Guide";
  const unsubLabel = lang === "es" ? "Darse de baja" : "Unsubscribe";
  const footerText = lang === "es"
    ? "La gu&iacute;a definitiva para fans del Bar&ccedil;a que visitan Barcelona"
    : "The ultimate guide for Bar&ccedil;a fans visiting Barcelona";

  return `<!DOCTYPE html>
<html lang="${lang}">
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
    .content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
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
      <p>${subtitle}</p>
    </div>
    <div class="divider"></div>
    <div class="content">
      ${htmlContent}
    </div>
    <div class="divider"></div>
    <div class="footer">
      <p><a href="${SITE_URL}">friendsofbarca.com</a></p>
      <p>${footerText}</p>
      ${unsubscribeUrl ? `<p style="margin-top: 12px;"><a href="${unsubscribeUrl}">${unsubLabel}</a></p>` : ""}
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

    // Pick content based on subscriber language
    const lang = sub.language || "en";
    const contentHtml = (lang === "es" && newsletter.htmlContentEs) ? newsletter.htmlContentEs : newsletter.htmlContent;
    const contentText = (lang === "es" && newsletter.textContentEs) ? newsletter.textContentEs : (newsletter.textContent || "");

    const html = renderEmailTemplate({
      subject: newsletter.subject,
      htmlContent: contentHtml,
      unsubscribeUrl,
      trackingPixelUrl,
      lang,
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject: newsletter.subject,
        html,
        text: contentText || undefined,
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

// ============== FOOTBALL-DATA.ORG HELPERS ==============

const FD_BASE = "https://api.football-data.org/v4";
const BARCA_FD_ID = 81;

async function getFootballDataApiKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "FOOTBALL_DATA_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

async function getAnthropicKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

interface RecentResult {
  opponent: string;
  score: string;
  result: "W" | "D" | "L";
  competition: string;
  date: string;
}

interface OpponentLastMatch {
  opponent: string;
  score: string;
  competition: string;
  date: string;
}

async function fetchBarcaRecentForm(): Promise<RecentResult[]> {
  const fdKey = await getFootballDataApiKey();
  if (!fdKey) return [];

  try {
    const res = await fetch(
      `${FD_BASE}/teams/${BARCA_FD_ID}/matches?status=FINISHED&limit=5`,
      { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const matches = data.matches || [];

    return matches.map((m: {
      homeTeam: { id: number; name: string };
      awayTeam: { id: string; name: string };
      score: { fullTime: { home: number | null; away: number | null } };
      competition: { name: string };
      utcDate: string;
    }) => {
      const isHome = m.homeTeam.id === BARCA_FD_ID;
      const opponent = isHome ? m.awayTeam.name : m.homeTeam.name;
      const bGoals = isHome ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0);
      const oGoals = isHome ? (m.score.fullTime.away ?? 0) : (m.score.fullTime.home ?? 0);
      const result: "W" | "D" | "L" = bGoals > oGoals ? "W" : bGoals < oGoals ? "L" : "D";
      return {
        opponent,
        score: `${bGoals}-${oGoals}`,
        result,
        competition: m.competition.name,
        date: new Date(m.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });
  } catch (err) {
    console.error("[Newsletter] fetchBarcaRecentForm error:", err);
    return [];
  }
}

async function fetchOpponentInfo(opponentName: string): Promise<{ lastMatch: OpponentLastMatch | null }> {
  const fdKey = await getFootballDataApiKey();
  if (!fdKey) return { lastMatch: null };

  try {
    // Search for team by name
    const searchRes = await fetch(
      `${FD_BASE}/teams?name=${encodeURIComponent(opponentName)}`,
      { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
    );
    if (!searchRes.ok) return { lastMatch: null };
    const searchData = await searchRes.json();
    const teams = searchData.teams || [];
    if (teams.length === 0) return { lastMatch: null };

    const teamId = teams[0].id;

    // Rate limit: 7s delay between football-data.org calls
    await sleep(7000);

    // Fetch last finished match
    const matchRes = await fetch(
      `${FD_BASE}/teams/${teamId}/matches?status=FINISHED&limit=1`,
      { headers: { "X-Auth-Token": fdKey }, cache: "no-store" }
    );
    if (!matchRes.ok) return { lastMatch: null };
    const matchData = await matchRes.json();
    const matches = matchData.matches || [];
    if (matches.length === 0) return { lastMatch: null };

    const m = matches[0];
    const isHome = m.homeTeam.id === teamId;
    const oppName = isHome ? m.awayTeam.name : m.homeTeam.name;
    const homeGoals = m.score.fullTime.home ?? 0;
    const awayGoals = m.score.fullTime.away ?? 0;

    return {
      lastMatch: {
        opponent: oppName,
        score: `${homeGoals}-${awayGoals}`,
        competition: m.competition.name,
        date: new Date(m.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      },
    };
  } catch (err) {
    console.error("[Newsletter] fetchOpponentInfo error:", err);
    return { lastMatch: null };
  }
}

// ============== WEEKLY NEWSLETTER (100% AUTO - BILINGUAL + PHOTOS) ==============

export async function generateAndSendWeeklyNewsletter(): Promise<{ success: boolean; message: string }> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // 1. Check if we already sent a weekly newsletter this week (dedup)
  const weeklySubjectPrefix = "Weekly Barça Roundup";
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

  // 2. Fetch chronicles from last 7 days (Match Recap section)
  const chronicles = await prisma.newsArticle.findMany({
    where: {
      category: "chronicle",
      status: "published",
      publishedAt: { gte: weekAgo },
    },
    orderBy: { publishedAt: "desc" },
  });

  // 3. Fetch next match (Next Match Preview + Opponent Watch)
  const nextMatch = await prisma.match.findFirst({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
  });

  // 4. Fetch Barça recent form + opponent info
  let barcaForm: RecentResult[] = [];
  let opponentInfo: { lastMatch: OpponentLastMatch | null } = { lastMatch: null };

  if (nextMatch) {
    // Rate limit: fetch form first, then opponent info (7s delay built into fetchOpponentInfo)
    barcaForm = await fetchBarcaRecentForm();
    opponentInfo = await fetchOpponentInfo(nextMatch.opponent);
  }

  // 5. Fetch digests from last 7 days (Week in Review)
  let digests = await prisma.newsArticle.findMany({
    where: {
      category: "digest",
      status: "published",
      publishedAt: { gte: weekAgo },
    },
    orderBy: { publishedAt: "desc" },
  });

  // If no digests, try to generate a fresh one
  if (digests.length === 0) {
    console.log("[Weekly Newsletter] No recent digests, generating fresh one...");
    try {
      const { generateNewsDigest } = await import("@/lib/news-automation");
      const articleId = await generateNewsDigest();
      if (articleId) {
        const freshArticle = await prisma.newsArticle.findUnique({ where: { id: articleId } });
        if (freshArticle) digests = [freshArticle];
      }
    } catch (err) {
      console.error("[Weekly Newsletter] Failed to generate digest:", err);
    }
  }

  // 6. Build context for Claude AI
  const chroniclesContext = chronicles.length > 0
    ? chronicles.map(c => `- ${c.title} (${c.matchResult || ""}) - ${c.excerpt}`).join("\n")
    : "No Barcelona matches played this week.";

  const nextMatchContext = nextMatch
    ? `- Opponent: ${nextMatch.opponent}\n- Competition: ${nextMatch.competition}\n- Date: ${new Date(nextMatch.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}\n- Time: ${nextMatch.time}\n- Venue: ${nextMatch.venue}`
    : "No upcoming match scheduled.";

  const formContext = barcaForm.length > 0
    ? barcaForm.map(f => `${f.result} ${f.score} vs ${f.opponent} (${f.competition}, ${f.date})`).join("\n")
    : "Form data unavailable.";

  const opponentContext = opponentInfo.lastMatch
    ? `Last result: ${opponentInfo.lastMatch.score} vs ${opponentInfo.lastMatch.opponent} (${opponentInfo.lastMatch.competition}, ${opponentInfo.lastMatch.date})`
    : "Opponent data unavailable.";

  const digestsContext = digests.length > 0
    ? digests.map(d => `- ${d.title}: ${d.excerpt}`).join("\n")
    : "No news digests available this week.";

  // 7. Pick images for this newsletter
  const images = getNewsletterImages();

  // 8. Generate newsletter HTML with Claude AI (bilingual + photos)
  const anthropicKey = await getAnthropicKey();

  let htmlContent: string;
  let textContent: string;
  let htmlContentEs: string | null = null;
  let textContentEs: string | null = null;

  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });

      const imageInstructions = `
IMAGES TO INCLUDE (use these exact URLs as <img> src):
- Hero image (place after intro paragraph): ${images.hero}
- Match/action image (place in Match Recap or Next Match section): ${images.match}
- Barcelona city image (place in Week in Review or as a visual break): ${images.city}

Use this format for images:
<img src="URL" alt="descriptive alt text" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" />`;

      const sharedContext = `
== SECTION 1: MATCH RECAP ==
Chronicles from this week:
${chroniclesContext}

== SECTION 2: NEXT MATCH PREVIEW ==
${nextMatchContext}

Barça recent form (last 5 matches):
${formContext}

== SECTION 3: OPPONENT WATCH ==
${nextMatch ? `Upcoming opponent: ${nextMatch.opponent}` : "No upcoming match."}
${opponentContext}

== SECTION 4: WEEK IN REVIEW ==
News highlights:
${digestsContext}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 6000,
        messages: [
          {
            role: "user",
            content: `You are a sports journalist writing the weekly newsletter for FriendsOfBarca.com, a fan site for FC Barcelona.

Generate the newsletter in BOTH English and Spanish. Return a JSON object with two keys: "en" (English HTML) and "es" (Spanish HTML).

Each version should have 4 sections (600-800 words per language). Be professional but passionate, like a quality football magazine. Only include sections for which data is available.

${sharedContext}

${imageInstructions}

FORMATTING RULES (apply to BOTH versions):
- Use <h2> for section titles (EN: "Match Recap", "Next Match Preview", "Opponent Watch", "Week in Review" / ES: "Resumen de Partidos", "Próximo Partido", "Análisis del Rival", "Resumen Semanal")
- Use <p> tags for paragraphs
- Use <strong> for emphasis
- Use <em> for secondary info
- You can use <ul><li> for lists
- Include a brief intro paragraph before the sections
- End with a short sign-off paragraph
- Link to ${SITE_URL}/news for "Read more" and ${SITE_URL}/calendar for match details
- Do NOT wrap in <html>, <body>, or <style> tags — only the inner content HTML
- Include ALL 3 images in both versions at appropriate places

Respond ONLY with the raw JSON object (no markdown code blocks):
{"en": "<h2>...</h2>...", "es": "<h2>...</h2>..."}`,
          },
        ],
      });

      let responseText = response.content[0].type === "text" ? response.content[0].text : "";
      // Strip markdown code blocks if Claude wraps them
      responseText = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

      let parsed: { en: string; es: string };
      try {
        parsed = JSON.parse(responseText);
      } catch {
        // If JSON parse fails, treat entire response as English only
        console.warn("[Weekly Newsletter] Failed to parse bilingual JSON, using as EN only");
        parsed = { en: responseText, es: "" };
      }

      const enHtml = (parsed.en || "").trim();
      const esHtml = (parsed.es || "").trim();

      htmlContent = `
        ${enHtml}
        <p style="text-align: center; margin-top: 24px;">
          <a href="${SITE_URL}/news" class="cta-button">Read All News</a>
        </p>
      `;

      if (esHtml) {
        htmlContentEs = `
          ${esHtml}
          <p style="text-align: center; margin-top: 24px;">
            <a href="${SITE_URL}/news" class="cta-button">Leer Todas las Noticias</a>
          </p>
        `;
      }

      // Generate plain text versions
      const stripHtmlToText = (html: string): string =>
        html
          .replace(/<h2[^>]*>/g, "\n\n## ")
          .replace(/<\/h2>/g, "\n")
          .replace(/<h3[^>]*>/g, "\n### ")
          .replace(/<\/h3>/g, "\n")
          .replace(/<li>/g, "- ")
          .replace(/<\/li>/g, "\n")
          .replace(/<img[^>]*>/g, "")
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/<\/p>/g, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&ccedil;/g, "ç")
          .replace(/&iacute;/g, "í")
          .replace(/&aacute;/g, "á")
          .replace(/&eacute;/g, "é")
          .replace(/&oacute;/g, "ó")
          .replace(/&uacute;/g, "ú")
          .replace(/&ntilde;/g, "ñ")
          .replace(/&mdash;/g, "—")
          .replace(/&rarr;/g, "→")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

      textContent = stripHtmlToText(enHtml);
      if (esHtml) {
        textContentEs = stripHtmlToText(esHtml);
      }

      console.log(`[Weekly Newsletter] AI-generated bilingual newsletter "${subject}"`);
    } catch (err) {
      console.error("[Weekly Newsletter] Claude AI failed, falling back to card format:", err);
      const result = buildFallbackNewsletter(chronicles, digests, dateRange, images);
      htmlContent = result.htmlContent;
      textContent = result.textContent;
      htmlContentEs = result.htmlContentEs;
      textContentEs = result.textContentEs;
    }
  } else {
    // No AI key — fallback to simple card format
    console.log("[Weekly Newsletter] No ANTHROPIC_API_KEY, using card format");
    const result = buildFallbackNewsletter(chronicles, digests, dateRange, images);
    htmlContent = result.htmlContent;
    textContent = result.textContent;
    htmlContentEs = result.htmlContentEs;
    textContentEs = result.textContentEs;
  }

  // 9. Check we have some content
  if (!htmlContent || htmlContent.trim().length < 50) {
    return { success: false, message: "No content available for weekly newsletter" };
  }

  // 10. Create newsletter and send
  const newsletter = await prisma.newsletter.create({
    data: {
      subject,
      htmlContent,
      textContent,
      htmlContentEs,
      textContentEs,
      status: "draft",
    },
  });

  console.log(`[Weekly Newsletter] Created newsletter "${subject}"`);

  return sendNewsletter(newsletter.id);
}

// Fallback: simple article cards (bilingual + photos)
function buildFallbackNewsletter(
  chronicles: { title: string; excerpt: string; slug: string; publishedAt: Date | null; category: string }[],
  digests: { title: string; excerpt: string; slug: string; publishedAt: Date | null; category: string }[],
  dateRange: string,
  images: { hero: string; match: string; city: string }
): { htmlContent: string; textContent: string; htmlContentEs: string | null; textContentEs: string | null } {
  const allArticles = [...chronicles, ...digests];

  if (allArticles.length === 0) {
    return {
      htmlContent: `<img src="${images.hero}" alt="Camp Nou" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" /><h2>This Week in Bar&ccedil;a</h2><p>Stay tuned for next week's roundup!</p>`,
      textContent: "This Week in Barça\nStay tuned for next week's roundup!",
      htmlContentEs: `<img src="${images.hero}" alt="Camp Nou" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" /><h2>Esta Semana en el Bar&ccedil;a</h2><p>&iexcl;Mantente atento al resumen de la pr&oacute;xima semana!</p>`,
      textContentEs: "Esta Semana en el Barça\nMantente atento al resumen de la próxima semana!",
    };
  }

  const buildCards = (lang: "en" | "es") => {
    return allArticles.map((article) => {
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "short", month: "short", day: "numeric" })
        : "";
      const categoryLabel = article.category === "chronicle"
        ? (lang === "es" ? "Cr&oacute;nica" : "Match Report")
        : (lang === "es" ? "Resumen" : "News Digest");
      const articleUrl = `${SITE_URL}/news/${article.slug}`;
      const readMore = lang === "es" ? "Leer art&iacute;culo completo" : "Read full article";

      return `<div class="article-card">
        <h3>${escapeHtml(article.title)}</h3>
        <p><em>${categoryLabel} &mdash; ${pubDate}</em></p>
        <p>${escapeHtml(article.excerpt)}</p>
        <p><a href="${articleUrl}">${readMore} &rarr;</a></p>
      </div>`;
    }).join("\n");
  };

  const enTitle = "This Week in Bar&ccedil;a";
  const esTitle = "Esta Semana en el Bar&ccedil;a";
  const enIntro = `Here's your weekly roundup of FC Barcelona news and match reports from ${dateRange}.`;
  const esIntro = `Aqu&iacute; tienes tu resumen semanal de noticias y cr&oacute;nicas del FC Barcelona del ${dateRange}.`;

  const htmlContent = `
    <img src="${images.hero}" alt="Camp Nou" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" />
    <h2>${enTitle}</h2>
    <p>${enIntro}</p>
    ${buildCards("en")}
    <img src="${images.city}" alt="Barcelona" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" />
    <p style="text-align: center; margin-top: 24px;">
      <a href="${SITE_URL}/news" class="cta-button">Read All News</a>
    </p>
  `;

  const htmlContentEs = `
    <img src="${images.hero}" alt="Camp Nou" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" />
    <h2>${esTitle}</h2>
    <p>${esIntro}</p>
    ${buildCards("es")}
    <img src="${images.city}" alt="Barcelona" style="width:100%;max-width:560px;height:auto;border-radius:8px;margin:12px 0;" />
    <p style="text-align: center; margin-top: 24px;">
      <a href="${SITE_URL}/news" class="cta-button">Leer Todas las Noticias</a>
    </p>
  `;

  const textContent = allArticles.map((a) => `${a.title}\n${a.excerpt}\n${SITE_URL}/news/${a.slug}`).join("\n\n");
  const textContentEs = textContent; // Same content, article titles are in English

  return { htmlContent, textContent, htmlContentEs, textContentEs };
}
