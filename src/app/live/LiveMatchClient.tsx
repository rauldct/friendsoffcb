"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

interface LiveEvent {
  id: string;
  type: string;
  team: "home" | "away";
  player: string;
  minute: number;
  detail?: string;
}

interface Commentary {
  id: string;
  minute: number;
  text: string;
  textEs?: string;
  timestamp: string;
}

interface MatchData {
  active: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeCrest: string;
  awayCrest: string;
  competition: string;
  venue: string;
  status: string;
  minute: number;
  events: LiveEvent[];
  commentary: Commentary[];
}

const EVENT_ICONS: Record<string, string> = {
  goal: "\u26BD",
  penalty_scored: "\u26BD(P)",
  penalty_missed: "\u274C(P)",
  own_goal: "\u26BD(OG)",
  yellow: "\uD83D\uDFE8",
  red: "\uD83D\uDFE5",
  sub: "\uD83D\uDD04",
  var: "\uD83D\uDCFA",
};

function StatusBadge({ status, minute, isEs }: { status: string; minute: number; isEs: boolean }) {
  const labels: Record<string, [string, string]> = {
    pre: ["Pre-Match", "Previo"],
    "1H": ["1st Half", "1\u00AA Parte"],
    HT: ["Half-Time", "Descanso"],
    "2H": ["2nd Half", "2\u00AA Parte"],
    ET1: ["Extra Time 1st", "Pr\u00F3rroga 1\u00AA"],
    ET2: ["Extra Time 2nd", "Pr\u00F3rroga 2\u00AA"],
    PEN: ["Penalties", "Penaltis"],
    FT: ["Full Time", "Final"],
  };

  const [en, es] = labels[status] || ["Live", "En directo"];
  const isLive = ["1H", "2H", "ET1", "ET2", "PEN"].includes(status);
  const isHT = status === "HT";

  return (
    <div className="flex flex-col items-center gap-1">
      {isLive && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{minute}&apos;</span>
        </div>
      )}
      <span className={`text-xs sm:text-sm font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
        isLive ? "bg-red-500/30 text-red-300" :
        isHT ? "bg-yellow-500/30 text-yellow-300" :
        status === "FT" ? "bg-gray-500/30 text-gray-300" :
        "bg-blue-500/30 text-blue-300"
      }`}>
        {isEs ? es : en}
      </span>
    </div>
  );
}

export default function LiveMatchClient() {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const { locale } = useLanguage();
  const isEs = locale === "es";

  const fetchMatch = useCallback(async () => {
    try {
      setRefreshing(true);
      // Cache-buster + no-store to prevent browser caching
      const res = await fetch(`/api/live-match?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.active || data.status === "FT") {
        // Detect new items for animation
        const currentIds = new Set<string>();
        (data.events || []).forEach((e: LiveEvent) => currentIds.add(e.id));
        (data.commentary || []).forEach((c: Commentary) => currentIds.add(c.id));

        const fresh = new Set<string>();
        currentIds.forEach((id) => {
          if (!prevIdsRef.current.has(id)) fresh.add(id);
        });
        if (fresh.size > 0) setNewIds(fresh);
        prevIdsRef.current = currentIds;

        // Clear "new" highlight after 5s
        if (fresh.size > 0) {
          setTimeout(() => setNewIds(new Set()), 5000);
        }

        setMatch(data);
        setLastUpdate(new Date());
      } else {
        setMatch(null);
      }
    } catch {
      // Keep previous data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchMatch]);

  // Countdown to next refresh
  const [countdown, setCountdown] = useState(15);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  // Reset countdown on fetch
  useEffect(() => {
    if (lastUpdate) setCountdown(15);
  }, [lastUpdate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#0a0a1a] flex items-center justify-center">
        <div className="animate-pulse text-white/50 text-lg">
          {isEs ? "Cargando partido..." : "Loading match..."}
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#0a0a1a] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-6">{"\u26BD"}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {isEs ? "No hay partido en directo" : "No Live Match"}
        </h1>
        <p className="text-white/60 mb-8 max-w-md">
          {isEs
            ? "Vuelve cuando el Bar\u00E7a est\u00E9 jugando para seguir la cr\u00F3nica en directo."
            : "Come back when Bar\u00E7a is playing to follow the live match chronicle."}
        </p>
        <div className="flex gap-3">
          <Link href="/calendar" className="px-5 py-2.5 bg-[#004D98] text-white rounded-lg text-sm font-medium hover:bg-[#003d7a] transition-colors">
            {isEs ? "Ver calendario" : "View Calendar"}
          </Link>
          <Link href="/competitions" className="px-5 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
            {isEs ? "Competiciones" : "Competitions"}
          </Link>
        </div>
      </div>
    );
  }

  const sortedEvents = [...match.events].sort((a, b) => b.minute - a.minute);
  const sortedCommentary = [...match.commentary].sort((a, b) => {
    // Sort by minute desc, then by timestamp desc for same minute
    if (b.minute !== a.minute) return b.minute - a.minute;
    return (b.timestamp || "").localeCompare(a.timestamp || "");
  });
  const isLive = ["1H", "2H", "ET1", "ET2", "PEN"].includes(match.status);
  const isHT = match.status === "HT";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#0a0a1a]">
      {/* Match Header */}
      <div className={`${isLive ? "bg-gradient-to-r from-red-900/40 via-[#1A1A2E] to-red-900/40" : ""} py-8 sm:py-12 px-4`}>
        <div className="max-w-3xl mx-auto">
          {/* Competition */}
          <div className="text-center mb-6">
            <span className="text-xs sm:text-sm text-white/50 uppercase tracking-widest">
              {match.competition}
            </span>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
            {/* Home team */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[120px]">
              {match.homeCrest && (
                <Image
                  src={match.homeCrest}
                  alt={match.homeTeam}
                  width={60}
                  height={60}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  unoptimized={match.homeCrest.startsWith("http")}
                />
              )}
              <span className={`font-bold text-xs sm:text-sm text-center ${match.venue === "home" ? "text-[#EDBB00]" : "text-white"}`}>
                {match.homeTeam}
              </span>
            </div>

            {/* Score + Status */}
            <div className="flex flex-col items-center gap-3">
              {match.status !== "pre" ? (
                <div className="text-5xl sm:text-7xl font-bold text-white tabular-nums tracking-wider transition-all">
                  {match.homeScore}
                  <span className="text-white/30 mx-2">-</span>
                  {match.awayScore}
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl text-white/40 font-medium">vs</div>
              )}
              <StatusBadge status={match.status} minute={match.minute} isEs={isEs} />
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[120px]">
              {match.awayCrest && (
                <Image
                  src={match.awayCrest}
                  alt={match.awayTeam}
                  width={60}
                  height={60}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  unoptimized={match.awayCrest.startsWith("http")}
                />
              )}
              <span className={`font-bold text-xs sm:text-sm text-center ${match.venue === "away" ? "text-[#EDBB00]" : "text-white"}`}>
                {match.awayTeam}
              </span>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          {(isLive || isHT) && (
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${refreshing ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                <span className="text-[10px] text-white/30 uppercase tracking-wider tabular-nums">
                  {isEs ? `Actualiza en ${countdown}s` : `Refreshes in ${countdown}s`}
                </span>
              </div>
              {lastUpdate && (
                <span className="text-[10px] text-white/20">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content: Events + Commentary */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        {/* Goal Scorers Summary */}
        {match.events.filter(e => e.type === "goal" || e.type === "penalty_scored" || e.type === "own_goal").length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Home scorers */}
              <div className="flex-1 text-left">
                {match.events
                  .filter(e => (e.type === "goal" || e.type === "penalty_scored") && e.team === "home")
                  .map(e => (
                    <div key={e.id} className="text-sm text-white/80">
                      {"\u26BD"} {e.player} {e.minute}&apos;{e.detail ? ` (${e.detail})` : ""}
                    </div>
                  ))}
                {match.events
                  .filter(e => e.type === "own_goal" && e.team === "away")
                  .map(e => (
                    <div key={e.id} className="text-sm text-white/80">
                      {"\u26BD"} {e.player} {e.minute}&apos; (OG)
                    </div>
                  ))}
              </div>
              {/* Away scorers */}
              <div className="flex-1 text-right">
                {match.events
                  .filter(e => (e.type === "goal" || e.type === "penalty_scored") && e.team === "away")
                  .map(e => (
                    <div key={e.id} className="text-sm text-white/80">
                      {e.player} {e.minute}&apos;{e.detail ? ` (${e.detail})` : ""} {"\u26BD"}
                    </div>
                  ))}
                {match.events
                  .filter(e => e.type === "own_goal" && e.team === "home")
                  .map(e => (
                    <div key={e.id} className="text-sm text-white/80">
                      {e.player} {e.minute}&apos; (OG) {"\u26BD"}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Two columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events Timeline */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">{"\uD83D\uDCCB"}</span>
              {isEs ? "Eventos" : "Match Events"}
            </h2>
            {sortedEvents.length === 0 ? (
              <div className="text-white/30 text-sm text-center py-8 bg-white/5 rounded-xl">
                {match.status === "pre"
                  ? (isEs ? "El partido a\u00FAn no ha comenzado" : "Match hasn&apos;t started yet")
                  : (isEs ? "Sin eventos a\u00FAn" : "No events yet")}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 transition-all duration-500 ${
                      newIds.has(evt.id) ? "ring-1 ring-[#EDBB00] bg-[#EDBB00]/10" : ""
                    } ${
                      evt.type === "goal" || evt.type === "penalty_scored" || evt.type === "own_goal"
                        ? "border-l-2 border-[#EDBB00]"
                        : evt.type === "red"
                        ? "border-l-2 border-red-500"
                        : ""
                    }`}
                  >
                    <span className="text-xs font-mono text-white/50 w-8 text-right shrink-0">{evt.minute}&apos;</span>
                    <span className="text-base shrink-0">{EVENT_ICONS[evt.type] || "\u2022"}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white font-medium">{evt.player}</span>
                      {evt.detail && <span className="text-xs text-white/50 ml-1.5">({evt.detail})</span>}
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      {evt.team === "home" ? match.homeTeam.split(" ").pop() : match.awayTeam.split(" ").pop()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commentary Feed */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">{"\uD83D\uDCAC"}</span>
              {isEs ? "Cr\u00F3nica en directo" : "Live Commentary"}
            </h2>
            {sortedCommentary.length === 0 ? (
              <div className="text-white/30 text-sm text-center py-8 bg-white/5 rounded-xl">
                {match.status === "pre"
                  ? (isEs ? "La cr\u00F3nica comenzar\u00E1 con el partido" : "Commentary starts with the match")
                  : (isEs ? "Sin comentarios a\u00FAn" : "No commentary yet")}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedCommentary.map((c) => (
                  <div
                    key={c.id}
                    className={`bg-white/5 rounded-lg px-3 py-2.5 transition-all duration-500 ${
                      newIds.has(c.id) ? "ring-1 ring-green-400/50 bg-green-500/10" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-white/50 w-8 text-right shrink-0 pt-0.5">
                        {c.minute}&apos;
                      </span>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {isEs && c.textEs ? c.textEs : c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap gap-3 justify-center">
          <Link href="/competitions" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
            {isEs ? "Competiciones" : "Competitions"}
          </Link>
          <Link href="/calendar" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
            {isEs ? "Calendario" : "Calendar"}
          </Link>
          <Link href="/news" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
            {isEs ? "Noticias" : "News"}
          </Link>
        </div>
      </div>
    </div>
  );
}
