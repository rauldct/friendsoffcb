#!/usr/bin/env node
/**
 * Batch translate all news articles to Spanish using Claude AI.
 * Usage: node scripts/translate-news.js
 */
const { PrismaClient } = require("@prisma/client");
const Anthropic = require("@anthropic-ai/sdk").default;

const prisma = new PrismaClient();

async function getAnthropicKey() {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (s?.value) return s.value;
  } catch {}
  return process.env.ANTHROPIC_API_KEY || "";
}

function stripMarkdownBlocks(text) {
  return text.replace(/^```(?:json)?\s*\n?/gm, "").replace(/\n?```\s*$/gm, "").trim();
}

async function translateArticle(client, article) {
  const prompt = `You are a professional Spanish football journalist translator. Translate this FC Barcelona news article to natural Spanish.

IMPORTANT RULES:
- Use natural football Spanish terminology (portería, centrocampista, goleada, pitido inicial, etc.)
- Keep proper nouns as-is (player names, stadium names, team names like "Camp Nou", "Lewandowski", etc.)
- Preserve ALL markdown formatting (## headers, **bold**, etc.) exactly as-is
- The translation should feel like it was originally written in Spanish, not a literal translation
- Keep the same tone and energy as the original

Article to translate:
- Title: ${article.title}
- Excerpt: ${article.excerpt || ""}
- Content:
${article.content}

Respond with ONLY valid JSON (no markdown blocks):
{
  "titleEs": "translated title",
  "excerptEs": "translated excerpt",
  "contentEs": "translated full content preserving all markdown"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 5000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].text;
  const cleaned = stripMarkdownBlocks(raw);
  return JSON.parse(cleaned);
}

async function main() {
  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    console.error("ERROR: ANTHROPIC_API_KEY not configured");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  const articles = await prisma.newsArticle.findMany({
    where: { status: "published", contentEs: null },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, excerpt: true, content: true, slug: true, category: true },
  });

  console.log(`Found ${articles.length} articles to translate\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`[${i + 1}/${articles.length}] Translating: ${article.title.substring(0, 70)}...`);

    try {
      const translated = await translateArticle(client, article);

      await prisma.newsArticle.update({
        where: { id: article.id },
        data: {
          titleEs: translated.titleEs,
          excerptEs: translated.excerptEs,
          contentEs: translated.contentEs,
        },
      });

      console.log(`  ✓ Done (titleEs: ${translated.titleEs.substring(0, 50)}...)`);
      success++;

      // Rate limit: wait 1s between requests
      if (i < articles.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      errors++;
      // Wait a bit more on error
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\nDone! Success: ${success}, Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
