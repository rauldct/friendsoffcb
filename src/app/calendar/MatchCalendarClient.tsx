"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface Match {
  id: string;
  date: string;
  time: string;
  opponent: string;
  opponentLogo: string;
  competition: string;
  venue: string;
  packageSlug: string | null;
}

const competitionIcons: Record<string, string> = {
  "La Liga": "🏆",
  "Champions League": "⭐",
  "Copa del Rey": "🏅",
};

const competitionColors: Record<string, string> = {
  "La Liga": "border-[#004D98]",
  "Champions League": "border-[#EDBB00]",
  "Copa del Rey": "border-[#A50044]",
};

export default function MatchCalendarClient({ matches }: { matches: Match[] }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "home" | "away">("all");

  const now = new Date();

  const filtered = matches.filter(m => {
    if (filter === "home" && m.venue !== "home") return false;
    if (filter === "away" && m.venue !== "away") return false;
    return true;
  });

  const grouped: Record<string, Match[]> = {};
  filtered.forEach(m => {
    const monthKey = new Date(m.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(m);
  });

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4">{t("calendar.title")}</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">{t("calendar.desc")}</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center items-center gap-2 mb-10">
          {(["all", "home", "away"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? (t("calendar.home") + " & " + t("calendar.away")) : f === "home" ? t("calendar.home") : t("calendar.away")}
            </button>
          ))}
        </div>

        {/* Calendar Timeline */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">📅</span>
            <p className="text-gray-500">{t("calendar.noMatches")}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([month, monthMatches]) => (
              <div key={month}>
                <h2 className="font-heading font-bold text-xl text-[#1A1A2E] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#A50044] rounded-lg flex items-center justify-center text-white text-sm">📅</span>
                  {month}
                </h2>
                <div className="space-y-3">
                  {monthMatches.map(match => {
                    const matchDate = new Date(match.date);
                    const isPast = matchDate < now;
                    const isHome = match.venue === "home";
                    const borderColor = competitionColors[match.competition] || "border-gray-300";

                    return (
                      <div
                        key={match.id}
                        className={`bg-white rounded-xl border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 ${isPast ? "opacity-50" : ""}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Left: Date + Match info */}
                          <div className="flex items-center gap-4">
                            {/* Date block */}
                            <div className="text-center min-w-[60px]">
                              <div className="text-xs font-medium text-gray-500 uppercase">
                                {matchDate.toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                              <div className="text-2xl font-heading font-bold text-[#1A1A2E]">
                                {matchDate.getDate()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {matchDate.toLocaleDateString("en-US", { month: "short" })}
                              </div>
                            </div>

                            {/* Match info */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{competitionIcons[match.competition] || "⚽"}</span>
                                <span className="font-heading font-bold text-[#1A1A2E]">
                                  {isHome ? `FC Barcelona vs ${match.opponent}` : `${match.opponent} vs FC Barcelona`}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{match.competition}</span>
                                <span>·</span>
                                <span>{match.time}</span>
                                <span>·</span>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                                  isHome ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                }`}>
                                  {isHome ? t("calendar.home") : t("calendar.away")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: CTA */}
                          <div className="sm:text-right">
                            {isHome && match.packageSlug ? (
                              <Link
                                href={`/packages/${match.packageSlug}`}
                                className="inline-block btn-primary text-sm py-2 px-5"
                              >
                                {t("calendar.viewPackage")} →
                              </Link>
                            ) : isHome ? (
                              <span className="text-sm text-gray-400">{t("misc.comingSoon")}</span>
                            ) : (
                              <span className="text-sm text-gray-400">{t("calendar.awayMatch")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
