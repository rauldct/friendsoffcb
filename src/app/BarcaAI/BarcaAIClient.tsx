"use client";

import { useState } from "react";
import ChatWindow from "@/components/BarcaAI/ChatWindow";
import { useBarcaAI } from "@/components/BarcaAI/useBarcaAI";

const ACCESS_KEY = "CuleAI";

export default function BarcaAIClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  const {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadSuggestions,
  } = useBarcaAI();

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#A50044] to-[#004D98] flex items-center justify-center">
            <span className="text-2xl font-bold text-white">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">BarçaAI</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (keyInput === ACCESS_KEY) {
                setAuthenticated(true);
                setError("");
              } else {
                setError("Clave incorrecta");
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Introduce la clave de acceso"
              className="block w-64 mx-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D98] text-center"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[#A50044] to-[#004D98] text-white rounded-lg hover:opacity-90 transition"
            >
              Acceder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 min-h-screen">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A50044] to-[#004D98] flex items-center justify-center">
            <span className="text-lg font-bold text-white">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BarçaAI</h1>
        </div>
        <p className="text-gray-600 text-sm">
          Your intelligent FC Barcelona assistant. Ask about matches, travel, history, fan clubs & more.
        </p>
      </div>

      <div className="h-[calc(100vh-200px)] min-h-[400px]">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          suggestions={suggestions}
          onSend={sendMessage}
          onStop={stopStreaming}
          onClose={() => {}}
          onClear={clearMessages}
          loadSuggestions={loadSuggestions}
          isExpanded
        />
      </div>
    </div>
  );
}
