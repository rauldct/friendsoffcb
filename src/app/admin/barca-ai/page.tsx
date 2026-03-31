"use client";

import { useState, useEffect } from "react";
import ChatWindow from "@/components/BarcaAI/ChatWindow";
import { useBarcaAI } from "@/components/BarcaAI/useBarcaAI";

interface KnowledgeStats {
  knowledge: {
    totalChunks: number;
    bySourceType: Record<string, number>;
    byLanguage: Record<string, number>;
  };
  rag: {
    totalChunks: number;
    indexedPenyes: number;
    totalPenyes: number;
    enrichedPenyes: number;
    chunksByType: Record<string, number>;
    knowledgeChunks: number;
    indexedArticles: number;
    totalArticles: number;
    knowledgeByType: Record<string, number>;
  };
  chat: {
    conversations: number;
    messages: number;
  };
  lastScrapes: Record<string, string | null>;
}

interface ScraperStatus {
  running: string | null; // which scraper is running
  result: string | null;
  isError: boolean;
}

export default function BarcaAIAdminPage() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState<string | null>(null);
  const [showReindexModal, setShowReindexModal] = useState(false);
  const [scraper, setScraper] = useState<ScraperStatus>({ running: null, result: null, isError: false });

  const chatHook = useBarcaAI();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/barca-ai/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleReindex = async () => {
    setShowReindexModal(false);
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await fetch("/api/admin/barca-ai/reindex", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const expiredMsg = data.expired > 0 ? `${data.expired} expired chunks cleaned. ` : "";
        setReindexResult(`${expiredMsg}Reindex complete: ${data.totalChunks} chunks created (${data.blogs.indexed} blogs, ${data.packages.indexed} packages, ${data.competitions.indexed} competitions, ${data.faqs.indexed} FAQs, ${data.matches.indexed} matches)`);
        fetchStats();
      } else {
        setReindexResult(`Error: ${data.error}`);
      }
    } catch {
      setReindexResult("Network error");
    }
    setReindexing(false);
  };

  const runScraper = async (name: string, endpoint: string) => {
    setScraper({ running: name, result: null, isError: false });
    try {
      const res = await fetch(endpoint + "?force=1", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.skipped) {
          setScraper({ running: null, result: `${name}: Skipped - ${data.reason}`, isError: false });
        } else if (name === "Wikipedia") {
          setScraper({ running: null, result: `Wikipedia: ${data.pagesScraped} pages scraped, ${data.chunksCreated} chunks created`, isError: false });
        } else if (name === "Players") {
          setScraper({ running: null, result: `Players: ${data.playersIndexed} players indexed, ${data.chunksCreated} chunks created`, isError: false });
        } else if (name === "FCB News") {
          setScraper({ running: null, result: `FCB News: ${data.articlesScraped} articles scraped, ${data.chunksCreated} chunks created${data.skipped ? `, ${data.skipped} skipped` : ""}`, isError: false });
        } else {
          setScraper({ running: null, result: `${name}: Done`, isError: false });
        }
        fetchStats();
      } else {
        setScraper({ running: null, result: `${name}: Error - ${data.error}`, isError: true });
      }
    } catch {
      setScraper({ running: null, result: `${name}: Network error`, isError: true });
    }
  };

  const totalVectorChunks = stats
    ? (stats.knowledge.totalChunks + stats.rag.totalChunks + stats.rag.knowledgeChunks)
    : 0;

  function formatLastScrape(key: string): string {
    const val = stats?.lastScrapes?.[key];
    if (!val) return "Never";
    const d = new Date(val);
    const now = Date.now();
    const hoursAgo = Math.floor((now - d.getTime()) / (1000 * 60 * 60));
    if (hoursAgo < 1) return "< 1 hour ago";
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A50044] to-[#004D98] flex items-center justify-center text-white font-bold text-sm">AI</span>
            BarçaAI
          </h1>
          <p className="text-sm text-gray-500 mt-1">FC Barcelona AI Assistant - Knowledge Base & Chat</p>
        </div>
        <button
          onClick={() => setShowReindexModal(true)}
          disabled={reindexing}
          className="px-4 py-2 bg-[#004D98] text-white text-sm font-medium rounded-lg hover:bg-[#003d7a] disabled:opacity-50 transition-colors"
        >
          {reindexing ? "Reindexing..." : "Reindex Site Content"}
        </button>
      </div>

      {/* Reindex Confirmation Modal */}
      {showReindexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReindexModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Reindex Site Content</h3>
            <p className="text-sm text-gray-600 mb-4">This will perform two operations:</p>
            <ol className="text-sm text-gray-600 space-y-2 mb-5 list-decimal list-inside">
              <li>
                <strong className="text-gray-800">Clean expired chunks</strong>
                <span className="text-gray-500"> — Removes stale data from the vector database. Chunks with a TTL (like competition standings with <code className="bg-gray-100 px-1 rounded text-xs">ttl_hours: 24</code>) are deleted when they expire, so the AI always uses fresh data.</span>
              </li>
              <li>
                <strong className="text-gray-800">Reindex site content</strong>
                <span className="text-gray-500"> — Deletes and recreates all vector embeddings for: blog posts, match packages, competition standings, FAQs, and calendar matches. This ensures the AI knowledge base reflects the latest content in the database.</span>
              </li>
            </ol>
            <p className="text-xs text-gray-400 mb-5">This does NOT affect Wikipedia, Players, FCB News or Peñas data. Use the individual scraper buttons for those.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReindexModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReindex}
                className="px-4 py-2 text-sm font-medium text-white bg-[#004D98] rounded-lg hover:bg-[#003d7a] transition-colors"
              >
                Confirm Reindex
              </button>
            </div>
          </div>
        </div>
      )}

      {reindexResult && (
        <div className={`p-3 rounded-lg text-sm ${reindexResult.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {reindexResult}
        </div>
      )}

      {scraper.result && (
        <div className={`p-3 rounded-lg text-sm ${scraper.isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {scraper.result}
        </div>
      )}

      {/* Stats Overview */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading stats...</div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Vector Chunks" value={totalVectorChunks} icon="🧬" color="bg-purple-50 text-purple-700" />
          <StatCard label="Conversations" value={stats.chat.conversations} icon="💬" color="bg-blue-50 text-blue-700" />
          <StatCard label="Messages" value={stats.chat.messages} icon="📨" color="bg-green-50 text-green-700" />
          <StatCard label="Indexed Articles" value={stats.rag.indexedArticles} icon="📰" color="bg-orange-50 text-orange-700" />
        </div>
      ) : null}

      {/* Data Sources / Scrapers */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Data Sources & Scrapers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wikipedia */}
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📚</span>
              <h4 className="font-medium text-gray-800">Wikipedia</h4>
            </div>
            <p className="text-xs text-gray-500 mb-1">FC Barcelona, Camp Nou, La Masia, El Clásico, records (EN + ES)</p>
            <p className="text-xs text-gray-400 mb-3">Last: {formatLastScrape("WIKIPEDIA_LAST_SCRAPE")} | Auto: monthly</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runScraper("Wikipedia", "/api/automations/scrape-wikipedia")}
                disabled={scraper.running !== null}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {scraper.running === "Wikipedia" ? "Scraping..." : "Run Now"}
              </button>
              <span className="text-xs text-gray-400">~30s</span>
            </div>
          </div>

          {/* Players */}
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚽</span>
              <h4 className="font-medium text-gray-800">Player Profiles</h4>
            </div>
            <p className="text-xs text-gray-500 mb-1">Current squad, coach, positions, nationalities (football-data.org)</p>
            <p className="text-xs text-gray-400 mb-3">Last: {formatLastScrape("PLAYERS_LAST_SCRAPE")} | Auto: weekly</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runScraper("Players", "/api/automations/scrape-players")}
                disabled={scraper.running !== null}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {scraper.running === "Players" ? "Fetching..." : "Run Now"}
              </button>
              <span className="text-xs text-gray-400">~5s</span>
            </div>
          </div>

          {/* FCB News */}
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📰</span>
              <h4 className="font-medium text-gray-800">FCBarcelona.com</h4>
            </div>
            <p className="text-xs text-gray-500 mb-1">Official news, max 3 articles/run, 15s delay between requests</p>
            <p className="text-xs text-gray-400 mb-3">Last: {formatLastScrape("FCB_NEWS_LAST_SCRAPE")} | Auto: every 6h</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runScraper("FCB News", "/api/automations/scrape-fcb-news")}
                disabled={scraper.running !== null}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {scraper.running === "FCB News" ? "Scraping..." : "Run Now"}
              </button>
              <span className="text-xs text-gray-400">~2min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Detail */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Barca Knowledge */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🧠</span> Barca Knowledge
            </h3>
            <p className="text-2xl font-bold text-[#004D98]">{stats.knowledge.totalChunks} <span className="text-sm font-normal text-gray-500">chunks</span></p>
            <div className="mt-3 space-y-1">
              {Object.entries(stats.knowledge.bySourceType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{type.replace(/_/g, " ")}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Languages</p>
              <div className="flex gap-3 mt-1">
                {Object.entries(stats.knowledge.byLanguage).map(([lang, count]) => (
                  <span key={lang} className="text-sm">
                    <span className="uppercase font-medium">{lang}</span>: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Peñas RAG */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🏠</span> Peñas RAG
            </h3>
            <p className="text-2xl font-bold text-[#A50044]">{stats.rag.totalChunks} <span className="text-sm font-normal text-gray-500">chunks</span></p>
            <p className="text-sm text-gray-500 mt-1">{stats.rag.indexedPenyes} / {stats.rag.totalPenyes} indexed ({stats.rag.enrichedPenyes} enriched)</p>
            <div className="mt-3 space-y-1">
              {Object.entries(stats.rag.chunksByType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600">{type.replace(/_/g, " ")}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* News Knowledge */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📰</span> News Knowledge
            </h3>
            <p className="text-2xl font-bold text-[#EDBB00]">{stats.rag.knowledgeChunks} <span className="text-sm font-normal text-gray-500">chunks</span></p>
            <p className="text-sm text-gray-500 mt-1">{stats.rag.indexedArticles} / {stats.rag.totalArticles} articles indexed</p>
            <div className="mt-3 space-y-1">
              {Object.entries(stats.rag.knowledgeByType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600">{type.replace(/_/g, " ")}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Architecture Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Vector Tables</h4>
            <ul className="space-y-1 text-gray-600">
              <li><code className="bg-gray-100 px-1 rounded">barca_knowledge_chunks</code> - Site content + Wikipedia + Players + FCB News</li>
              <li><code className="bg-gray-100 px-1 rounded">penya_chunks</code> - Fan clubs (contact, description, scraping)</li>
              <li><code className="bg-gray-100 px-1 rounded">knowledge_chunks</code> - News articles and chronicles</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">AI Pipeline</h4>
            <ul className="space-y-1 text-gray-600">
              <li><strong>Embeddings:</strong> Ollama all-minilm (384 dims)</li>
              <li><strong>LLM:</strong> Claude Sonnet 4.5</li>
              <li><strong>Search:</strong> Unified across 3 tables, scored by similarity + freshness + language</li>
              <li><strong>Streaming:</strong> SSE via POST /api/chat</li>
              <li><strong>Rate limit:</strong> 20 msgs/hour per IP</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conversation</h4>
            <ul className="space-y-1 text-gray-600">
              <li><strong>Persistence:</strong> PostgreSQL (ChatConversation + ChatMessage)</li>
              <li><strong>Context:</strong> Last 6 messages included in prompt</li>
              <li><strong>Session:</strong> localStorage cookie, 7-day TTL</li>
              <li><strong>Intents:</strong> 11 types (match, player, travel, penya, history...)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Cron Jobs</h4>
            <ul className="space-y-1 text-gray-600">
              <li><strong>04:00 UTC:</strong> Knowledge refresh + expire stale chunks</li>
              <li><strong>03:30 UTC:</strong> Expire old conversations (&gt;7 days)</li>
              <li><strong>02:00 UTC 1st:</strong> Wikipedia scrape (monthly)</li>
              <li><strong>06:00 UTC Mon:</strong> Player profiles refresh</li>
              <li><strong>Every 6h:</strong> FCBarcelona.com news scrape</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat Test */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Test Chat</h3>
        <div className="h-[500px]">
          <ChatWindow
            messages={chatHook.messages}
            isLoading={chatHook.isLoading}
            suggestions={chatHook.suggestions}
            onSend={chatHook.sendMessage}
            onStop={chatHook.stopStreaming}
            onClose={() => {}}
            onClear={chatHook.clearMessages}
            loadSuggestions={chatHook.loadSuggestions}
            isExpanded
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
