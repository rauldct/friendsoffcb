"use client";

import { type ChatMessageData } from "./useBarcaAI";
import ChatSources from "./ChatSources";

interface ChatMessageProps {
  message: ChatMessageData;
}

// Simple markdown-like rendering for chat messages
function renderContent(content: string) {
  if (!content) return null;

  return content.split("\n").map((line, i) => {
    // Bold
    let rendered = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Links
    rendered = rendered.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>'
    );
    // Inline code
    rendered = rendered.replace(/`([^`]+)`/g, '<code class="bg-gray-700/50 px-1 rounded text-sm">$1</code>');

    if (!rendered.trim()) return <br key={i} />;
    return (
      <p
        key={i}
        className="mb-1 last:mb-0"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#004D98] text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {message.isStreaming && !message.content ? (
          <div className="flex gap-1 py-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <>
            <div className="prose-sm">{renderContent(message.content)}</div>
            {message.sources && message.sources.length > 0 && (
              <ChatSources sources={message.sources} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
