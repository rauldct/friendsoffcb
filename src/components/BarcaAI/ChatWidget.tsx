"use client";

import { usePathname, useRouter } from "next/navigation";

export default function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on admin pages or the dedicated chat page
  if (pathname.startsWith("/admin") || pathname === "/chat") return null;

  return (
    <button
      onClick={() => router.push("/chat")}
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#A50044] to-[#004D98] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
      title="BarçaAI"
    >
      <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  );
}
