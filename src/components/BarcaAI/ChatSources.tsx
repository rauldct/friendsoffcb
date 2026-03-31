"use client";

import Link from "next/link";
import { type BarcaAISource } from "./useBarcaAI";

interface ChatSourcesProps {
  sources: BarcaAISource[];
}

const typeIcons: Record<string, string> = {
  news: "📰",
  blog: "📝",
  package: "✈️",
  competition: "🏆",
  penya: "🏠",
  faq: "❓",
  match: "⚽",
};

export default function ChatSources({ sources }: ChatSourcesProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-gray-200/50">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sources</p>
      <div className="flex flex-wrap gap-1">
        {sources.map((source, i) => {
          const icon = typeIcons[source.type] || "📄";
          const label = source.name.length > 30 ? source.name.slice(0, 30) + "..." : source.name;

          if (source.url) {
            return (
              <Link
                key={i}
                href={source.url}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded-full hover:bg-blue-100 transition-colors"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          }

          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 text-[11px] rounded-full"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
