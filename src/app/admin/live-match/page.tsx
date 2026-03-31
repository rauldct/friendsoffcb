"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
}

interface MatchData {
  active: boolean;
  matchId?: string;
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

interface DbMatch {
  id: string;
  date: string;
  time: string;
  opponent: string;
  opponentLogo: string;
  competition: string;
  venue: string;
}

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽", penalty_scored: "⚽(P)", penalty_missed: "❌(P)",
  own_goal: "⚽(OG)", yellow: "🟨", red: "🟥", sub: "🔄", var: "📺",
};

const STATUSES = ["pre", "1H", "HT", "2H", "ET1", "ET2", "PEN", "FT"] as const;

export default function AdminLiveMatch() {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [dbMatches, setDbMatches] = useState<DbMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Event form state
  const [evtType, setEvtType] = useState("goal");
  const [evtTeam, setEvtTeam] = useState<"home" | "away">("home");
  const [evtPlayer, setEvtPlayer] = useState("");
  const [evtMinute, setEvtMinute] = useState(0);
  const [evtDetail, setEvtDetail] = useState("");

  // Commentary form state
  const [commText, setCommText] = useState("");
  const [commTextEs, setCommTextEs] = useState("");
  const [commMinute, setCommMinute] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [matchRes, matchesRes] = await Promise.all([
        fetch("/api/admin/live-match"),
        fetch("/api/admin/live-match?upcoming=1"),
      ]);
      const matchData = await matchRes.json();
      if (matchData.active !== undefined) setMatch(matchData.active ? matchData : null);

      try {
        const matchesData = await matchesRes.json();
        if (Array.isArray(matchesData)) setDbMatches(matchesData);
      } catch {}
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load upcoming matches from the Match table
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await fetch("/api/admin/live-match?upcoming=1");
        const data = await res.json();
        if (Array.isArray(data)) setDbMatches(data);
      } catch {}
    };
    loadMatches();
  }, []);

  const apiCall = async (method: string, body?: object) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/live-match", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.data) setMatch(data.data);
      else if (data.active === false && method === "DELETE") setMatch(null);
      return data;
    } finally {
      setSaving(false);
    }
  };

  const startMatch = async (dbMatch?: DbMatch) => {
    const isHome = dbMatch ? dbMatch.venue === "home" : true;
    const body = {
      matchId: dbMatch?.id,
      homeTeam: isHome ? "FC Barcelona" : (dbMatch?.opponent || "Opponent"),
      awayTeam: isHome ? (dbMatch?.opponent || "Opponent") : "FC Barcelona",
      homeCrest: isHome ? "/images/fcb-crest.png" : (dbMatch?.opponentLogo || ""),
      awayCrest: isHome ? (dbMatch?.opponentLogo || "") : "/images/fcb-crest.png",
      competition: dbMatch?.competition || "",
      venue: dbMatch?.venue || "home",
    };
    await apiCall("POST", body);
  };

  const updateStatus = async (status: string) => {
    await apiCall("PUT", { action: "update_status", status });
  };

  const updateMinute = async (minute: number) => {
    await apiCall("PUT", { action: "update_minute", minute });
  };

  const addEvent = async () => {
    await apiCall("PUT", {
      action: "add_event",
      eventType: evtType,
      team: evtTeam,
      player: evtPlayer,
      minute: evtMinute || match?.minute || 0,
      detail: evtDetail,
    });
    setEvtPlayer("");
    setEvtDetail("");
  };

  const removeEvent = async (eventId: string) => {
    await apiCall("PUT", { action: "remove_event", eventId });
  };

  const addCommentary = async () => {
    await apiCall("PUT", {
      action: "add_commentary",
      minute: commMinute || match?.minute || 0,
      text: commText,
      textEs: commTextEs,
    });
    setCommText("");
    setCommTextEs("");
  };

  const removeCommentary = async (commentaryId: string) => {
    await apiCall("PUT", { action: "remove_commentary", commentaryId });
  };

  const endMatch = async () => {
    if (!confirm("End the match?")) return;
    await apiCall("PUT", { action: "end_match" });
  };

  const deactivate = async () => {
    if (!confirm("Deactivate live match bar? (data preserved)")) return;
    await apiCall("PUT", { action: "deactivate" });
  };

  const deleteLiveMatch = async () => {
    if (!confirm("Delete all live match data?")) return;
    await apiCall("DELETE");
    setMatch(null);
  };

  // Keep minute and event forms in sync
  useEffect(() => {
    if (match) {
      setEvtMinute(match.minute);
      setCommMinute(match.minute);
    }
  }, [match?.minute]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Match Control</h1>
          <p className="text-sm text-gray-500">Manage live match score, events, and commentary</p>
        </div>
        <div className="flex gap-2">
          <Link href="/live" target="_blank" className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
            View Live Page ↗
          </Link>
          <Link href="/admin" className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Dashboard
          </Link>
        </div>
      </div>

      {!match ? (
        /* === START MATCH === */
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Start Live Match</h2>

          {dbMatches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Upcoming matches:</h3>
              <div className="space-y-2">
                {dbMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => startMatch(m)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-2xl">⚽</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {m.venue === "home" ? "FC Barcelona" : m.opponent}
                        <span className="text-gray-400 mx-2">vs</span>
                        {m.venue === "home" ? m.opponent : "FC Barcelona"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {m.competition} · {m.venue === "home" ? "Home" : "Away"} · {new Date(m.date).toLocaleDateString()} {m.time}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">Start</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => startMatch()}
            disabled={saving}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
          >
            Start Custom Match
          </button>
        </div>
      ) : (
        /* === MATCH CONTROLS === */
        <div className="space-y-6">
          {/* Score Header */}
          <div className="bg-gradient-to-r from-[#1A1A2E] to-[#004D98] rounded-xl p-6 text-white">
            <div className="text-xs text-white/50 text-center mb-2 uppercase tracking-wider">{match.competition}</div>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="font-bold text-lg">{match.homeTeam}</div>
              </div>
              <div className="text-5xl font-bold tabular-nums">
                {match.homeScore} - {match.awayScore}
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{match.awayTeam}</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm px-3 py-1 rounded-full ${
                match.active ? "bg-red-500/30 text-red-300" : "bg-gray-500/30 text-gray-300"
              }`}>
                {match.status} · {match.minute}&apos;
              </span>
              {match.active && <span className="text-xs text-green-400">● Active</span>}
              {!match.active && <span className="text-xs text-gray-400">● Inactive</span>}
            </div>
          </div>

          {/* Status + Minute Controls */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Match Status</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    match.status === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-2">Minute</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => updateMinute(Math.max(0, match.minute - 1))} disabled={saving} className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">-</button>
              <input
                type="number"
                value={match.minute}
                onChange={(e) => updateMinute(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 border rounded-lg text-center text-lg font-mono"
              />
              <button onClick={() => updateMinute(match.minute + 1)} disabled={saving} className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">+</button>
              <div className="flex gap-1 ml-2">
                {[45, 46, 90].map(m => (
                  <button key={m} onClick={() => updateMinute(m)} disabled={saving} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">{m}&apos;</button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Score */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Score Update</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-2">{match.homeTeam}</div>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => apiCall("PUT", { action: "update_score", homeScore: Math.max(0, match.homeScore - 1) })} disabled={saving} className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold hover:bg-red-200 disabled:opacity-50">-</button>
                  <span className="text-3xl font-bold w-12 text-center tabular-nums">{match.homeScore}</span>
                  <button onClick={() => apiCall("PUT", { action: "update_score", homeScore: match.homeScore + 1 })} disabled={saving} className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold hover:bg-green-200 disabled:opacity-50">+</button>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-2">{match.awayTeam}</div>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => apiCall("PUT", { action: "update_score", awayScore: Math.max(0, match.awayScore - 1) })} disabled={saving} className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold hover:bg-red-200 disabled:opacity-50">-</button>
                  <span className="text-3xl font-bold w-12 text-center tabular-nums">{match.awayScore}</span>
                  <button onClick={() => apiCall("PUT", { action: "update_score", awayScore: match.awayScore + 1 })} disabled={saving} className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold hover:bg-green-200 disabled:opacity-50">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Add Event */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Event</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <select value={evtType} onChange={(e) => setEvtType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="goal">⚽ Goal</option>
                <option value="penalty_scored">⚽ Penalty Scored</option>
                <option value="penalty_missed">❌ Penalty Missed</option>
                <option value="own_goal">⚽ Own Goal</option>
                <option value="yellow">🟨 Yellow Card</option>
                <option value="red">🟥 Red Card</option>
                <option value="sub">🔄 Substitution</option>
                <option value="var">📺 VAR</option>
              </select>
              <select value={evtTeam} onChange={(e) => setEvtTeam(e.target.value as "home" | "away")} className="px-3 py-2 border rounded-lg text-sm">
                <option value="home">{match.homeTeam}</option>
                <option value="away">{match.awayTeam}</option>
              </select>
              <input type="number" value={evtMinute} onChange={(e) => setEvtMinute(parseInt(e.target.value) || 0)} placeholder="Min" className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex gap-3 mb-3">
              <input value={evtPlayer} onChange={(e) => setEvtPlayer(e.target.value)} placeholder="Player name" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <input value={evtDetail} onChange={(e) => setEvtDetail(e.target.value)} placeholder="Detail (optional)" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={addEvent} disabled={saving || !evtPlayer} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Add Event
            </button>

            {/* Event list */}
            {match.events.length > 0 && (
              <div className="mt-4 space-y-1">
                {[...match.events].reverse().map((evt) => (
                  <div key={evt.id} className="flex items-center gap-2 text-sm py-1.5 px-2 bg-gray-50 rounded">
                    <span className="text-xs font-mono text-gray-500 w-8">{evt.minute}&apos;</span>
                    <span>{EVENT_ICONS[evt.type] || "•"}</span>
                    <span className="flex-1">{evt.player}{evt.detail ? ` (${evt.detail})` : ""}</span>
                    <span className="text-xs text-gray-400">{evt.team === "home" ? match.homeTeam : match.awayTeam}</span>
                    <button onClick={() => removeEvent(evt.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Commentary */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Commentary</h3>
            <div className="flex gap-3 mb-3">
              <input type="number" value={commMinute} onChange={(e) => setCommMinute(parseInt(e.target.value) || 0)} className="w-20 px-3 py-2 border rounded-lg text-sm" placeholder="Min" />
              <input value={commText} onChange={(e) => setCommText(e.target.value)} placeholder="Commentary (English)" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex gap-3 mb-3">
              <div className="w-20" />
              <input value={commTextEs} onChange={(e) => setCommTextEs(e.target.value)} placeholder="Comentario (Español) - opcional" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={addCommentary} disabled={saving || !commText} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Add Commentary
            </button>

            {/* Commentary list */}
            {match.commentary.length > 0 && (
              <div className="mt-4 space-y-1">
                {[...match.commentary].reverse().map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-sm py-1.5 px-2 bg-gray-50 rounded">
                    <span className="text-xs font-mono text-gray-500 w-8 shrink-0 pt-0.5">{c.minute}&apos;</span>
                    <span className="flex-1 text-gray-700">{c.text}</span>
                    <button onClick={() => removeCommentary(c.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap gap-3">
            <button onClick={endMatch} disabled={saving} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
              End Match (FT)
            </button>
            <button onClick={deactivate} disabled={saving} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 disabled:opacity-50">
              Deactivate Bar
            </button>
            <button onClick={deleteLiveMatch} disabled={saving} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50">
              Delete All
            </button>
            <button onClick={fetchData} disabled={saving} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 ml-auto">
              Refresh ↻
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
