import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

async function getAnthropicKey(): Promise<string> {
  try {
    const dbSetting = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (dbSetting?.value) return dbSetting.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

interface EnrichmentResult {
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: { facebook?: string; twitter?: string; instagram?: string } | null;
  president: string | null;
  foundedYear: number | null;
  memberCount: number | null;
  description: string | null;
  confidence: string;
}

export async function enrichPenya(penyaId: string): Promise<{ success: boolean; error?: string }> {
  const penya = await prisma.penya.findUnique({ where: { id: penyaId } });
  if (!penya) return { success: false, error: "Penya not found" };

  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) return { success: false, error: "ANTHROPIC_API_KEY not configured" };

  const client = new Anthropic({ apiKey: anthropicKey });

  const prompt = `You are a research assistant. Find all available information about this FC Barcelona supporters club (peña barcelonista):

Name: ${penya.name}
City: ${penya.city}
${penya.province ? `Province: ${penya.province}` : ""}
Country: ${penya.country}
Region: ${penya.region === "cataluna" ? "Catalunya" : penya.region === "spain" ? "Spain" : "International"}

Search your knowledge for any information about this peña: physical address, contact details, social media, president/leader, founding year, approximate member count, and a brief description of the club.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "address": "Full street address or null if unknown",
  "postalCode": "Postal/ZIP code or null if unknown",
  "email": "Contact email or null if unknown",
  "phone": "Phone number or null if unknown",
  "website": "Website URL or null if unknown",
  "socialMedia": { "facebook": "URL or null", "twitter": "URL or null", "instagram": "URL or null" },
  "president": "Current president/leader name or null if unknown",
  "foundedYear": 1990,
  "memberCount": 150,
  "description": "Brief description of the peña (2-3 sentences) or null if unknown",
  "confidence": "high" | "medium" | "low"
}

Use null for any field you are not confident about. For foundedYear and memberCount, use null if unknown (not 0). Set confidence to "high" if you found specific data, "medium" if partially known, "low" if mostly guessing.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed: EnrichmentResult = JSON.parse(text);

    // Sanitize social media - remove null entries
    let socialMedia: { facebook?: string; twitter?: string; instagram?: string } | null = null;
    if (parsed.socialMedia) {
      const sm: Record<string, string> = {};
      if (parsed.socialMedia.facebook) sm.facebook = parsed.socialMedia.facebook;
      if (parsed.socialMedia.twitter) sm.twitter = parsed.socialMedia.twitter;
      if (parsed.socialMedia.instagram) sm.instagram = parsed.socialMedia.instagram;
      if (Object.keys(sm).length > 0) socialMedia = sm;
    }

    await prisma.penya.update({
      where: { id: penyaId },
      data: {
        address: parsed.address || null,
        postalCode: parsed.postalCode || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        website: parsed.website || null,
        socialMedia: socialMedia ?? Prisma.DbNull,
        president: parsed.president || null,
        foundedYear: typeof parsed.foundedYear === "number" ? parsed.foundedYear : null,
        memberCount: typeof parsed.memberCount === "number" ? parsed.memberCount : null,
        description: parsed.description || null,
        enrichmentStatus: "enriched",
        detailsUpdatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Penya enrichment error:", err);
    await prisma.penya.update({
      where: { id: penyaId },
      data: { enrichmentStatus: "failed", detailsUpdatedAt: new Date() },
    });
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
