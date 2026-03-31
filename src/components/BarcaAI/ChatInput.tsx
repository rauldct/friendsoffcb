"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSend(text);
      setText("");
      // Reset textarea height
      if (inputRef.current) inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + "px";
    }
  };

  return (
    <div className="px-3 py-2 border-t border-gray-100 bg-white rounded-b-2xl">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => { setText(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder="Ask BarçaAI anything..."
          className="flex-1 resize-none border-0 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D98]/30 max-h-[100px]"
          rows={1}
          disabled={isLoading}
          maxLength={2000}
        />
        {isLoading ? (
          <button
            onClick={onStop}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
            title="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#A50044] to-[#004D98] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            title="Send"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1">
        Powered by AI. May make mistakes.
      </p>
    </div>
  );
}
