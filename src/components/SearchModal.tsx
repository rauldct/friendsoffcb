"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface SearchResult {
  type: "news" | "blog" | "guide" | "package";
  title: string;
  titleEs: string | null;
  excerpt: string | null;
  excerptEs: string | null;
  url: string;
}

const TYPE_ICONS: Record<string, string> = {
  news: "N",
  blog: "B",
  guide: "G",
  package: "P",
};

const TYPE_COLORS: Record<string, string> = {
  news: "bg-blue-100 text-blue-700",
  blog: "bg-purple-100 text-purple-700",
  guide: "bg-green-100 text-green-700",
  package: "bg-amber-100 text-amber-700",
};

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { locale } = useLanguage();
  const isEs = locale === "es";
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(
    (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results || []);
          setSelectedIdx(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    []
  );

  const handleChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 250);
  };

  const navigate = (url: string) => {
    onClose();
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      navigate(results[selectedIdx].url);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    };
    if (open) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open]);

  if (!open) return null;

  const typeLabel = (t: string) => {
    const labels: Record<string, [string, string]> = {
      news: ["News", "Noticias"],
      blog: ["Blog", "Blog"],
      guide: ["Guide", "Guía"],
      package: ["Match", "Partido"],
    };
    return isEs ? labels[t]?.[1] || t : labels[t]?.[0] || t;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <svg
            className="w-5 h-5 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEs ? "Buscar noticias, artículos, partidos..." : "Search news, articles, matches..."}
            className="flex-1 text-base outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-block text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {isEs ? "Buscando..." : "Searching..."}
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {isEs ? "Sin resultados" : "No results found"}
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((r, i) => (
                <li key={r.url}>
                  <button
                    onClick={() => navigate(r.url)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                      i === selectedIdx ? "bg-gray-50" : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        TYPE_COLORS[r.type]
                      }`}
                    >
                      {TYPE_ICONS[r.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {isEs ? r.titleEs || r.title : r.title}
                      </p>
                      {(r.excerpt || r.excerptEs) && (
                        <p className="text-xs text-gray-500 truncate">
                          {isEs ? r.excerptEs || r.excerpt : r.excerpt}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {typeLabel(r.type)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && query.length < 2 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {isEs ? "Escribe al menos 2 caracteres" : "Type at least 2 characters"}
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="border border-gray-200 rounded px-1 py-0.5">↑↓</kbd>
            {isEs ? "navegar" : "navigate"}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-gray-200 rounded px-1 py-0.5">↵</kbd>
            {isEs ? "abrir" : "open"}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-gray-200 rounded px-1 py-0.5">esc</kbd>
            {isEs ? "cerrar" : "close"}
          </span>
        </div>
      </div>
    </div>
  );
}
