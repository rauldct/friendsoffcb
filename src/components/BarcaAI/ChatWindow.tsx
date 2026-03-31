"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatSuggestions from "./ChatSuggestions";
import ChatInput from "./ChatInput";
import { type ChatMessageData, type BarcaAISource } from "./useBarcaAI";

interface ChatWindowProps {
  messages: ChatMessageData[];
  isLoading: boolean;
  suggestions: string[];
  onSend: (text: string, page?: string) => void;
  onStop: () => void;
  onClose: () => void;
  onClear: () => void;
  loadSuggestions: (page?: string) => void;
  isExpanded?: boolean;
}

export default function ChatWindow({
  messages,
  isLoading,
  suggestions,
  onSend,
  onStop,
  onClose,
  onClear,
  loadSuggestions,
  isExpanded,
}: ChatWindowProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions(pathname);
  }, [pathname, loadSuggestions]);

  // Auto-scroll within chat container only (not the whole page)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text: string) => {
    onSend(text, pathname);
  };

  return (
    <div
      className={`flex flex-col bg-white ${
        isExpanded
          ? "h-full rounded-2xl shadow-xl"
          : "w-[380px] h-[520px] rounded-2xl shadow-2xl"
      }`}
    >
      <ChatHeader onClose={onClose} onClear={onClear} isExpanded={isExpanded} />

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-1">
        {messages.length === 0 ? (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#A50044] to-[#004D98] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">AI</span>
              </div>
              <h4 className="font-semibold text-gray-800 text-sm">Welcome to BarçaAI!</h4>
              <p className="text-xs text-gray-500 mt-1">
                Ask me anything about FC Barcelona — matches, travel, history, fan clubs & more.
              </p>
            </div>
            <ChatSuggestions suggestions={suggestions} onSelect={handleSend} />
          </>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading} onStop={onStop} />
    </div>
  );
}
