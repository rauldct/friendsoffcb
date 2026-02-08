import { NextRequest, NextResponse } from "next/server";
import { chatWithRAG } from "@/lib/rag";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return NextResponse.json(
        { error: "Question is required (min 2 chars)" },
        { status: 400 }
      );
    }

    const result = await chatWithRAG(question.trim());

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Chat RAG] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
