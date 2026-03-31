"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

interface LiveData {
  live: boolean;
  upcoming?: boolean;
  finished?: boolean;
  status?: string;
  minute?: number | null;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  homeCrest?: string;
  awayCrest?: string;
  competition?: string;
  kickoff?: string;
  isHome?: boolean;
  hasLivePage?: boolean;
}

export default function LiveScore() {
  const [data, setData] = useState<LiveData | null>(null);
  const { locale } = useLanguage();
  const isEs = locale === "es";

  const fetchScore = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-score?_t=${Date.now()}`, { cache: "no-store" });
      const json: LiveData = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchScore();
    const interval = setInterval(fetchScore, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchScore]);

  if (!data || (!data.live && !data.upcoming && !data.finished)) return null;

  const statusText = () => {
    if (data.live) {
      if (data.status === "HALFTIME") return isEs ? "Descanso" : "Half-Time";
      if (data.status === "PAUSED") return isEs ? "Pausa" : "Paused";
      return data.minute ? `${data.minute}'` : "LIVE";
    }
    if (data.upcoming && data.kickoff) {
      const kickoff = new Date(data.kickoff);
      const diff = Math.round((kickoff.getTime() - Date.now()) / 60000);
      if (diff <= 0) return isEs ? "Comienza pronto" : "Starting soon";
      return isEs ? `En ${diff} min` : `In ${diff} min`;
    }
    if (data.finished) return "FT";
    return "";
  };

  const bgClass = data.live
    ? "bg-gradient-to-r from-red-600 via-red-700 to-red-800"
    : data.upcoming
    ? "bg-gradient-to-r from-[#004D98] to-[#1A1A2E]"
    : "bg-gradient-to-r from-gray-700 to-gray-800";

  const Crest = ({ src, alt }: { src?: string; alt: string }) => {
    if (!src) return null;
    return (
      <Image
        src={src}
        alt={alt}
        width={20}
        height={20}
        className="w-5 h-5 object-contain"
        unoptimized={src.startsWith("http")}
      />
    );
  };

  const content = (
    <div className={`${bgClass} text-white py-2.5 px-4 transition-all`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 text-sm">
        {/* Live indicator */}
        {data.live && (
          <span className="flex items-center gap-1.5 mr-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="font-bold text-xs uppercase tracking-wider hidden sm:inline">LIVE</span>
          </span>
        )}

        {/* Competition badge */}
        <span className="text-[10px] sm:text-xs text-white/70 bg-white/10 px-1.5 py-0.5 rounded hidden sm:inline">
          {data.competition}
        </span>

        {/* Teams & Score */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Crest src={data.homeCrest} alt={data.homeTeam || ""} />
          <span className={`font-semibold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none ${data.isHome ? "text-[#EDBB00]" : ""}`}>
            {data.homeTeam}
          </span>

          {(data.live || data.finished) ? (
            <span className="font-bold text-base sm:text-lg px-1.5 sm:px-2.5 tabular-nums bg-black/20 rounded py-0.5">
              {data.homeScore} - {data.awayScore}
            </span>
          ) : (
            <span className="text-white/50 px-1.5">vs</span>
          )}

          <span className={`font-semibold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none ${!data.isHome ? "text-[#EDBB00]" : ""}`}>
            {data.awayTeam}
          </span>
          <Crest src={data.awayCrest} alt={data.awayTeam || ""} />
        </div>

        {/* Status badge */}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
          data.live ? "bg-white/25 animate-pulse" : "bg-white/15"
        }`}>
          {statusText()}
        </span>

        {/* Link to live page */}
        {data.hasLivePage && (
          <span className="text-[10px] sm:text-xs text-white/80 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors hidden sm:inline">
            {isEs ? "Crónica →" : "Live →"}
          </span>
        )}
      </div>
    </div>
  );

  // Wrap in link to /live page if available
  if (data.hasLivePage) {
    return <Link href="/live" className="block">{content}</Link>;
  }

  return content;
}
