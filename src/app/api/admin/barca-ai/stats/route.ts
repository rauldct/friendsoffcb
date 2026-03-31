import { NextResponse } from "next/server";
import { getKnowledgeStats } from "@/lib/knowledge-pipeline";
import { getRAGStats } from "@/lib/rag";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getLastScrapes(): Promise<Record<string, string | null>> {
  const keys = ["WIKIPEDIA_LAST_SCRAPE", "PLAYERS_LAST_SCRAPE", "FCB_NEWS_LAST_SCRAPE"];
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    const s = settings.find(s => s.key === key);
    result[key] = s?.value || null;
  }
  return result;
}

export async function GET() {
  try {
    const [knowledgeStats, ragStats, conversationCount, messageCount, lastScrapes] = await Promise.all([
      getKnowledgeStats(),
      getRAGStats(),
      prisma.chatConversation.count(),
      prisma.chatMessage.count(),
      getLastScrapes(),
    ]);

    return NextResponse.json({
      knowledge: knowledgeStats,
      rag: ragStats,
      chat: {
        conversations: conversationCount,
        messages: messageCount,
      },
      lastScrapes,
    });
  } catch (err) {
    console.error("[Admin BarçaAI Stats] Error:", err);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
