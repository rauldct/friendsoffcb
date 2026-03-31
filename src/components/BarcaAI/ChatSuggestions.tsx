"use client";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function ChatSuggestions({ suggestions, onSelect }: ChatSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 mb-2">Try asking:</p>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="text-left text-sm px-3 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#004D98] rounded-xl transition-colors border border-gray-100 hover:border-blue-200"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
