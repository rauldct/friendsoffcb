import { NextRequest, NextResponse } from "next/server";
import { getContextualSuggestions, detectLanguage } from "@/lib/ai-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentPage = searchParams.get("page") || undefined;
    const lang = searchParams.get("lang");

    const language = lang === "es" ? "es" : "en";
    const suggestions = await getContextualSuggestions(language, currentPage);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[Suggestions API] Error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
