import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { searchSimilar, searchKnowledge, type ChatSource } from "@/lib/rag";
import { searchBarcaKnowledge, type BarcaKnowledgeResult } from "@/lib/knowledge-pipeline";
import { buildContext, buildSystemPrompt, detectLanguage, classifyIntent } from "@/lib/ai-context";
import { rateLimit } from "@/lib/rate-limit";

// ============== CONFIG ==============

async function getAnthropicKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

// ============== RELIABILITY MAP ==============

const SOURCE_RELIABILITY: Record<string, number> = {
  official_news: 1.0,
  history: 0.9,
  legend: 0.9,
  stadium: 0.9,
  academy: 0.9,
  records: 0.9,
  coach: 0.9,
  news: 0.8,
  blog: 0.8,
  competition: 0.8,
  player: 0.8,
  faq: 0.85,
  package: 0.85,
  match: 0.85,
  penya: 0.7,
};

function getReliability(sourceType: string): number {
  return SOURCE_RELIABILITY[sourceType] ?? 0.75;
}

function sourceLabel(type: string): string {
  if (type === "official_news") return "official";
  if (["history", "legend", "stadium", "academy", "records", "coach"].includes(type)) return "wikipedia";
  if (["news", "blog"].includes(type)) return "media";
  if (type === "penya") return "fan_club";
  return type;
}

// ============== UNIFIED SEARCH ==============

interface UnifiedResult {
  text: string;
  source: string;
  sourceType: string;
  sourceId: string;
  similarity: number;
  language: string;
  freshnessDate: Date | null;
}

export async function unifiedSearch(
  query: string,
  limit: number = 15,
  languageHint?: string
): Promise<UnifiedResult[]> {
  // Search all 3 vector tables in parallel
  const [penyaResults, knowledgeResults, barcaResults] = await Promise.all([
    searchSimilar(query, 8).catch(() => []),
    searchKnowledge(query, 8).catch(() => []),
    searchBarcaKnowledge(query, 8, languageHint).catch(() => []),
  ]);

  const results: UnifiedResult[] = [];
  const seenTexts = new Set<string>();

  // Add penya results
  for (const r of penyaResults) {
    if (r.similarity < 0.15) continue;
    const hash = r.chunkText.slice(0, 150);
    if (seenTexts.has(hash)) continue;
    seenTexts.add(hash);
    results.push({
      text: r.chunkText,
      source: `Peña: ${r.metadata.penyaName || "?"} (${r.metadata.city || "?"}, ${r.metadata.country || "?"})`,
      sourceType: "penya",
      sourceId: r.penyaId,
      similarity: r.similarity,
      language: "es",
      freshnessDate: null,
    });
  }

  // Add knowledge (news) results
  for (const r of knowledgeResults) {
    if (r.similarity < 0.15) continue;
    const hash = r.chunkText.slice(0, 150);
    if (seenTexts.has(hash)) continue;
    seenTexts.add(hash);
    results.push({
      text: r.chunkText,
      source: `${r.metadata.category || "news"}: ${r.metadata.slug || r.sourceName}`,
      sourceType: "news",
      sourceId: r.articleId,
      similarity: r.similarity,
      language: r.metadata.lang || "en",
      freshnessDate: r.publishedAt,
    });
  }

  // Add barca knowledge results
  for (const r of barcaResults) {
    if (r.similarity < 0.15) continue;
    const hash = r.chunkText.slice(0, 150);
    if (seenTexts.has(hash)) continue;
    seenTexts.add(hash);
    results.push({
      text: r.chunkText,
      source: `${r.sourceType}: ${r.metadata.slug || r.metadata.opponent || r.sourceId}`,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      similarity: r.similarity,
      language: r.language,
      freshnessDate: r.freshnessDate,
    });
  }

  // Score: similarity × 0.55 + freshness × 0.15 + language_match × 0.10 + reliability × 0.20
  const now = Date.now();
  const scoredResults = results.map(r => {
    const freshness = r.freshnessDate
      ? Math.max(0, 1 - (now - r.freshnessDate.getTime()) / (365 * 24 * 60 * 60 * 1000))
      : 0.5;
    const langMatch = languageHint && r.language === languageHint ? 1 : 0.5;
    const reliability = getReliability(r.sourceType);
    const score = r.similarity * 0.55 + freshness * 0.15 + langMatch * 0.10 + reliability * 0.20;
    return { ...r, score };
  });

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, limit);
}

// ============== CHAT SOURCES ==============

export interface BarcaAISource {
  name: string;
  type: string;
  url?: string;
  detail: string;
}

function buildSources(results: UnifiedResult[]): BarcaAISource[] {
  const sourcesMap = new Map<string, BarcaAISource>();

  for (const r of results) {
    const key = `${r.sourceType}-${r.sourceId}`;
    if (sourcesMap.has(key)) continue;

    let url: string | undefined;
    if (r.sourceType === "news") {
      const slug = r.text.match(/slug['":\s]+([a-z0-9-]+)/)?.[1] || r.sourceId;
      url = `/news/${slug}`;
    } else if (r.sourceType === "blog") {
      url = `/blog/${r.sourceId}`;
    } else if (r.sourceType === "package") {
      const slug = r.text.match(/slug['":\s]+([a-z0-9-]+)/)?.[1];
      if (slug) url = `/packages/${slug}`;
    } else if (r.sourceType === "competition") {
      url = "/competitions";
    } else if (r.sourceType === "faq") {
      url = "/faq";
    } else if (r.sourceType === "match") {
      url = "/calendar";
    }

    sourcesMap.set(key, {
      name: r.source,
      type: r.sourceType,
      url,
      detail: r.sourceType,
    });
  }

  return Array.from(sourcesMap.values()).slice(0, 5);
}

// ============== CONVERSATION PERSISTENCE ==============

export async function getOrCreateConversation(sessionId: string): Promise<string> {
  const existing = await prisma.chatConversation.findUnique({ where: { sessionId } });
  if (existing) return existing.id;

  const conv = await prisma.chatConversation.create({
    data: { sessionId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  return conv.id;
}

export async function getRecentMessages(
  conversationId: string,
  limit: number = 6
): Promise<Array<{ role: string; content: string }>> {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true },
  });
  return messages.reverse();
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  intent?: string,
  sources?: BarcaAISource[]
): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      conversationId,
      role,
      content,
      intent: intent || null,
      sources: sources ? JSON.parse(JSON.stringify(sources)) : undefined,
    },
  });
}

// ============== MAIN CHAT FUNCTION (STREAMING) ==============

export async function* streamChat(
  message: string,
  sessionId: string,
  currentPage?: string,
  clientIp?: string
): AsyncGenerator<{ type: "text" | "sources" | "error"; data: string }> {
  // Rate limit check
  if (clientIp) {
    const limit = rateLimit(clientIp, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      yield {
        type: "error",
        data: JSON.stringify({
          error: "rate_limited",
          message: "Too many messages. Please wait before sending more.",
          resetAt: limit.resetAt,
        }),
      };
      return;
    }
  }

  // Get API key
  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    yield { type: "error", data: JSON.stringify({ error: "config", message: "AI not configured" }) };
    return;
  }

  // Build context
  const context = await buildContext(message, currentPage);
  const systemPrompt = buildSystemPrompt(context);

  // Get/create conversation
  const conversationId = await getOrCreateConversation(sessionId);

  // Get conversation history
  const history = await getRecentMessages(conversationId, 6);

  // Save user message
  await saveMessage(conversationId, "user", message, context.intent);

  // Unified search
  const searchResults = await unifiedSearch(message, 12, context.language);
  const sources = buildSources(searchResults);

  // Build context text from search results with source type labels
  const contextText = searchResults
    .map((r, i) => `[${i + 1}. ${r.source} — source: ${sourceLabel(r.sourceType)}]\n${r.text}`)
    .join("\n\n---\n\n");

  // Build messages
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Add conversation history
  for (const msg of history) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
    }
  }

  // Add current message with context
  const userMessage = contextText
    ? `KNOWLEDGE CONTEXT:\n${contextText}\n\n---\n\nUSER MESSAGE: ${message}`
    : message;
  messages.push({ role: "user", content: userMessage });

  // Stream response
  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });

    let fullResponse = "";

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        yield { type: "text", data: event.delta.text };
      }
    }

    // Save assistant response
    await saveMessage(conversationId, "assistant", fullResponse, context.intent, sources);

    // Send sources at the end
    if (sources.length > 0) {
      yield { type: "sources", data: JSON.stringify(sources) };
    }
  } catch (err) {
    console.error("[BarçaAI] Stream error:", err);
    yield {
      type: "error",
      data: JSON.stringify({ error: "ai_error", message: "Failed to generate response" }),
    };
  }
}

// ============== NON-STREAMING CHAT (for admin/testing) ==============

export async function chat(
  message: string,
  sessionId: string,
  currentPage?: string
): Promise<{ answer: string; sources: BarcaAISource[]; intent: string }> {
  const apiKey = await getAnthropicKey();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const context = await buildContext(message, currentPage);
  const systemPrompt = buildSystemPrompt(context);
  const conversationId = await getOrCreateConversation(sessionId);
  const history = await getRecentMessages(conversationId, 6);

  await saveMessage(conversationId, "user", message, context.intent);

  const searchResults = await unifiedSearch(message, 12, context.language);
  const sources = buildSources(searchResults);

  const contextText2 = searchResults
    .map((r, i) => `[${i + 1}. ${r.source} — source: ${sourceLabel(r.sourceType)}]\n${r.text}`)
    .join("\n\n---\n\n");

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const msg of history) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
    }
  }
  const userMessage = contextText2
    ? `KNOWLEDGE CONTEXT:\n${contextText2}\n\n---\n\nUSER MESSAGE: ${message}`
    : message;
  messages.push({ role: "user", content: userMessage });

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const answer = response.content[0].type === "text" ? response.content[0].text : "";
  await saveMessage(conversationId, "assistant", answer, context.intent, sources);

  return { answer, sources, intent: context.intent };
}

// ============== CLEANUP ==============

export async function expireOldConversations(): Promise<number> {
  const result = await prisma.chatConversation.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (result.count > 0) {
    console.log(`[BarçaAI] Expired ${result.count} old conversations`);
  }
  return result.count;
}
