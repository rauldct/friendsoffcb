"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    penyaName: string;
    city: string;
    country: string;
    chunkType: string;
    similarity: number;
  }>;
}

interface RAGStats {
  totalChunks: number;
  indexedPenyes: number;
  totalPenyes: number;
  enrichedPenyes: number;
  chunksByType: Record<string, number>;
}

const CHUNK_TYPE_LABELS: Record<string, string> = {
  basic_info: "Info general",
  contact: "Contacto",
  description: "Descripcion",
  scraped_content: "Web scraping",
  website_validation: "Validacion web",
  notes: "Notas",
};

export default function PenyaChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/penyes/rag");
      const data = await res.json();
      setStats(data);
    } catch {
      // ignore
    }
    setLoadingStats(false);
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/penyes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexion con el servidor." }]);
    }
    setLoading(false);
  };

  const handleReindex = async () => {
    setReindexing(true);
    setReindexResult("");
    try {
      const res = await fetch("/api/admin/penyes/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setReindexResult(`Indexed ${data.indexed}/${data.total} penyes, ${data.chunks} chunks created${data.errors > 0 ? `, ${data.errors} errors` : ""}`);
        fetchStats();
      } else {
        setReindexResult(`Error: ${data.error}`);
      }
    } catch {
      setReindexResult("Error connecting to server");
    }
    setReindexing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/penyes" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">
              Chat RAG - Penyes
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            Pregunta sobre penyes del FC Barcelona usando la base de datos vectorial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Chat con tus Penyes</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Pregunta cualquier cosa sobre las penyes del FC Barcelona. El sistema busca en la base de datos vectorial y responde con informacion real.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Que penyes hay en Madrid?",
                    "Cual es la penya mas antigua?",
                    "Penyes con pagina web en Catalunya?",
                    "Donde puedo contactar una penya en Londres?",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : ""}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#004D98] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.sources.map((s, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs"
                          title={`${s.chunkType} - similarity: ${(s.similarity * 100).toFixed(0)}%`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {s.penyaName} ({s.city})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-gray-500">Buscando en la base de datos vectorial...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre penyes..."
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#004D98]/30 focus:border-[#004D98]"
                style={{ maxHeight: "120px" }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-[#004D98] text-white rounded-xl hover:bg-[#003d7a] disabled:opacity-40 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - RAG Info */}
        <div className="space-y-4">
          {/* Stats card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              RAG Database
            </h3>

            {loadingStats ? (
              <div className="text-xs text-gray-400">Cargando stats...</div>
            ) : stats ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total penyes</span>
                  <span className="font-medium text-[#1A1A2E]">{stats.totalPenyes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Enriched</span>
                  <span className="font-medium text-green-600">{stats.enrichedPenyes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Indexed (RAG)</span>
                  <span className="font-medium text-indigo-600">{stats.indexedPenyes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total chunks</span>
                  <span className="font-medium text-[#1A1A2E]">{stats.totalChunks}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Indexed</span>
                    <span>{stats.totalPenyes > 0 ? Math.round((stats.indexedPenyes / stats.totalPenyes) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 rounded-full h-1.5 transition-all"
                      style={{ width: `${stats.totalPenyes > 0 ? (stats.indexedPenyes / stats.totalPenyes) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Chunks by type */}
                {Object.keys(stats.chunksByType).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-gray-500 mb-2">Chunks por tipo</div>
                    {Object.entries(stats.chunksByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-xs py-0.5">
                        <span className="text-gray-400">{CHUNK_TYPE_LABELS[type] || type}</span>
                        <span className="text-gray-600">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-red-500">Error loading stats</div>
            )}
          </div>

          {/* Reindex button */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#1A1A2E] mb-2">Reindexar</h3>
            <p className="text-xs text-gray-500 mb-3">
              Regenera todos los embeddings de las penyes enriquecidas en la base de datos vectorial.
            </p>
            <button
              onClick={handleReindex}
              disabled={reindexing}
              className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all text-xs font-medium flex items-center justify-center gap-2"
            >
              {reindexing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Reindexing...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reindexar todo
                </>
              )}
            </button>
            {reindexResult && (
              <div className={`mt-2 text-xs p-2 rounded ${reindexResult.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {reindexResult}
              </div>
            )}
          </div>

          {/* How RAG works */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#1A1A2E] mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como funciona
            </h3>
            <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
              <p><strong className="text-gray-700">1. Enrichment:</strong> Al enriquecer una penya con IA, se buscan datos en Perplexity, Grok y se scrapea su web.</p>
              <p><strong className="text-gray-700">2. Chunking:</strong> La informacion se divide en fragmentos: info basica, contacto, descripcion, contenido web, notas.</p>
              <p><strong className="text-gray-700">3. Embeddings:</strong> Cada fragmento se convierte en un vector numerico (384 dim) usando Ollama + all-minilm.</p>
              <p><strong className="text-gray-700">4. pgvector:</strong> Los vectores se almacenan en PostgreSQL con la extension pgvector para busqueda por similitud.</p>
              <p><strong className="text-gray-700">5. Chat:</strong> Tu pregunta se convierte en vector, se buscan los fragmentos mas similares, y Claude genera la respuesta.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
