"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import WhereToWatchModal from "./WhereToWatchModal";

interface NextMatchData {
  hasMatch: boolean;
  opponent?: string;
  opponentLogo?: string;
  competition?: string;
  venue?: string;
  kickoffUtc?: string;
  hasChannels?: boolean;
  packageSlug?: string;
}

export default function MatchCountdown() {
  const [data, setData] = useState<NextMatchData | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  const fetchNextMatch = useCallback(async () => {
    try {
      const res = await fetch("/api/next-match");
      const json: NextMatchData = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  }, []);

  // Fetch on mount + every 5 minutes
  useEffect(() => {
    fetchNextMatch();
    const interval = setInterval(fetchNextMatch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNextMatch]);

  // Countdown tick every second
  useEffect(() => {
    if (!data?.hasMatch || !data.kickoffUtc) return;

    const tick = () => {
      const now = Date.now();
      const kickoff = new Date(data.kickoffUtc!).getTime();
      const diff = kickoff - now;

      // Hide if less than 2 hours (LiveScore takes over)
      if (diff < 2 * 60 * 60 * 1000) {
        setTimeLeft("");
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      const pad = (n: number) => String(n).padStart(2, "0");

      if (d > 0) {
        setTimeLeft(
          `${d}${t("countdown.d")} ${pad(h)}${t("countdown.h")} ${pad(m)}${t("countdown.m")} ${pad(s)}${t("countdown.s")}`
        );
      } else {
        setTimeLeft(
          `${pad(h)}${t("countdown.h")} ${pad(m)}${t("countdown.m")} ${pad(s)}${t("countdown.s")}`
        );
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data, t]);

  // Don't render if no match or countdown expired
  if (!data?.hasMatch || !timeLeft) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-[#A50044]/90 to-[#004D98]/90 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 text-sm">
          {/* Competition badge */}
          <span className="hidden sm:inline text-xs text-white/70">
            {data.competition}
          </span>
          <span className="hidden sm:inline text-white/30">|</span>

          {/* Match info */}
          <span className="font-semibold truncate">
            <span className="hidden sm:inline">FC Barcelona vs </span>
            <span className="sm:hidden">Barça vs </span>
            {data.opponent}
          </span>

          <span className="text-white/30">|</span>

          {/* Countdown */}
          <span className="font-mono font-bold tabular-nums text-[#EDBB00]">
            {timeLeft}
          </span>

          {/* Where to Watch button */}
          {data.hasChannels && (
            <>
              <span className="hidden sm:inline text-white/30">|</span>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded text-xs font-medium transition-colors"
              >
                <span>📺</span>
                <span className="hidden sm:inline">{t("countdown.whereToWatch")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Where to Watch Modal */}
      {showModal && data.competition && data.opponent && data.kickoffUtc && (
        <WhereToWatchModal
          onClose={() => setShowModal(false)}
          competition={data.competition}
          opponent={data.opponent}
          kickoffUtc={data.kickoffUtc}
        />
      )}
    </>
  );
}
