"use client";

interface ChatHeaderProps {
  onClose: () => void;
  onClear: () => void;
  isExpanded?: boolean;
}

export default function ChatHeader({ onClose, onClear, isExpanded }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1A1A2E] to-[#004D98] text-white rounded-t-2xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A50044] to-[#EDBB00] flex items-center justify-center text-sm font-bold">
          AI
        </div>
        <div>
          <h3 className="font-semibold text-sm leading-tight">BarçaAI</h3>
          <p className="text-[10px] text-blue-200 opacity-80">Your FC Barcelona assistant</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Clear chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        {!isExpanded && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
