"use client";
import Link from "next/link";
import { useRef } from "react";
import { MatchData } from "@/types";

export default function NextMatchesCarousel({ matches }: { matches: MatchData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-heading font-extrabold text-[#1A1A2E]">Upcoming Matches</h2>
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50" aria-label="Scroll left">←</button>
            <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50" aria-label="Scroll right">→</button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{scrollbarWidth:"none"}}>
          {matches.map(m => (
            <div key={m.id} className="min-w-[260px] snap-start card p-5 flex-shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center text-lg">⚽</div>
                <div>
                  <p className="font-heading font-bold text-sm text-[#1A1A2E]">{m.opponent}</p>
                  <p className="text-xs text-gray-500">{m.competition}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {new Date(m.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} · {m.time}
              </p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-3 ${m.venue==="home"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-600"}`}>
                {m.venue === "home" ? "Home" : "Away"}
              </span>
              {m.venue === "home" && m.packageSlug ? (
                <Link href={`/packages/${m.packageSlug}`} className="block w-full text-center btn-primary text-sm py-2">View Package</Link>
              ) : (
                <span className="block w-full text-center text-sm py-2 text-gray-400">
                  {m.venue === "away" ? "Away Match" : "Coming Soon"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
