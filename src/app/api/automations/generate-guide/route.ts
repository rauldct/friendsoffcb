import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

async function getSettingKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

const GUIDE_TOPICS = [
  "Complete guide to matchday food and restaurants near Camp Nou Barcelona",
  "Barcelona airport to Camp Nou: all transport options explained",
  "Best hotels near Spotify Camp Nou for match weekends",
  "Camp Nou museum and stadium tour: what to expect and tips",
  "Barcelona matchday traditions and fan culture guide",
  "Family guide to watching FC Barcelona with kids at Camp Nou",
  "Guide to Barcelona nightlife after a Barça match",
  "Camp Nou accessibility guide for disabled supporters",
  "Complete guide to buying FC Barcelona merchandise and souvenirs",
  "Day trips from Barcelona for football fans between matches",
  "Barcelona public transport guide for Camp Nou visitors",
  "Best viewpoints and photo spots at Spotify Camp Nou",
];

export async function POST(request: NextRequest) {
  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "guide_generation", status: "running" },
  });

  try {
    const cronSecret = request.headers.get("X-Cron-Secret");
    const expectedSecret = process.env.CRON_SECRET || "";
    const isAdmin = request.cookies.get("admin_token")?.value;
    if (!isAdmin && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anthropicKey = await getSettingKey("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Pick a topic that hasn't been used yet
    const existingGuides = await prisma.blogPost.findMany({
      where: { category: "guide" },
      select: { title: true, slug: true },
    });
    const existingSlugs = new Set(existingGuides.map(g => g.slug));

    let topic = null;
    for (const t of GUIDE_TOPICS) {
      const testSlug = slugify(t);
      if (!existingSlugs.has(testSlug)) {
        topic = t;
        break;
      }
    }

    if (!topic) {
      // All predefined topics used, generate a random one
      topic = `Insider tips for FC Barcelona fans visiting Barcelona in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `You are a travel writer for FriendsOfBarca.com, writing guides for international FC Barcelona fans visiting Barcelona.

Write a comprehensive guide about: "${topic}"

The guide should be practical, detailed, and helpful for first-time visitors. Include specific recommendations, addresses when relevant, and insider tips.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Engaging title (max 80 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "2-3 sentence summary (max 200 chars)",
  "content": "Full guide with ## section headers. 800-1200 words. Practical, specific, helpful.",
  "coverImage": "",
  "tags": ["tag1", "tag2", "tag3"],
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 160 chars"
}`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    const slug = slugify(parsed.slug || parsed.title || topic);
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: `Guide already exists: ${slug}`, endedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "Guide already exists", slug });
    }

    const guide = await prisma.blogPost.create({
      data: {
        slug,
        title: parsed.title || topic,
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
        coverImage: parsed.coverImage || "/images/blog/barcelona-rambla.jpg",
        category: "guide",
        tags: parsed.tags || [],
        author: "Friends of Barça",
        metaTitle: parsed.metaTitle || "",
        metaDescription: parsed.metaDescription || "",
      },
    });

    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message: `Guide created: "${parsed.title}"`,
        details: { guideId: guide.id, slug },
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: `Guide created: ${parsed.title}`, slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
