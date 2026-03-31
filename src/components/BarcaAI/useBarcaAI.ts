"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: BarcaAISource[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface BarcaAISource {
  name: string;
  type: string;
  url?: string;
  detail: string;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "barca_ai_session";
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, sid);
  }
  return sid;
}

export function useBarcaAI() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load suggestions
  const loadSuggestions = useCallback(async (currentPage?: string) => {
    try {
      const lang = document.documentElement.lang === "es" ? "es" : "en";
      const params = new URLSearchParams({ lang });
      if (currentPage) params.set("page", currentPage);
      const res = await fetch(`/api/chat/suggestions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (text: string, currentPage?: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessageData = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const assistantMsg: ChatMessageData = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sessionId, currentPage }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let sources: BarcaAISource[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              fullText += parsed.data;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsg.id
                    ? { ...m, content: fullText }
                    : m
                )
              );
            } else if (parsed.type === "sources") {
              sources = JSON.parse(parsed.data);
            } else if (parsed.type === "error") {
              const err = JSON.parse(parsed.data);
              fullText = err.message || "An error occurred.";
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsg.id
                    ? { ...m, content: fullText, isStreaming: false }
                    : m
                )
              );
            }
          } catch {
            // skip malformed SSE
          }
        }
      }

      // Finalize message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: fullText, sources, isStreaming: false }
            : m
        )
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: "Sorry, something went wrong. Please try again.", isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    messages,
    isLoading,
    suggestions,
    isOpen,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadSuggestions,
    toggleOpen,
    setIsOpen,
  };
}
