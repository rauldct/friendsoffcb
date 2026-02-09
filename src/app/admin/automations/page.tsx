'use client';

import { useState, useEffect, useCallback } from 'react';

interface AutomationRun {
  id: string;
  type: string;
  status: string;
  message: string;
  details: Record<string, unknown>;
  startedAt: string;
  endedAt: string | null;
}

interface RssSource {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

interface Stats {
  total: number;
  chronicles: number;
  digests: number;
}

interface ScheduleInfo {
  icon: string;
  bg: string;
  fg: string;
  label: string;
  desc: string;
  hour: number;
  minute: number;
  days: number[] | null;
  monthDay?: number;
  info: string;
}

const SCHEDULE_ITEMS: ScheduleInfo[] = [
  {
    icon: '\u{1F4F0}', bg: 'bg-blue-100', fg: 'text-blue-600',
    label: 'News Digest', desc: 'Mon & Thu at 8:00 AM UTC',
    hour: 8, minute: 0, days: [1, 4],
    info: 'Fetches articles from 6 RSS sources (FCB Official, Marca, Sport, Mundo Deportivo, ESPN, BBC), summarizes them with Claude AI, and publishes a news digest article on the /news page.'
  },
  {
    icon: '\u{1F4EC}', bg: 'bg-pink-100', fg: 'text-pink-600',
    label: 'Weekly Newsletter', desc: 'Monday at 8:00 AM UTC',
    hour: 8, minute: 0, days: [1],
    info: 'Compiles the week\'s match chronicles, next match preview (with Barça form & opponent data from football-data.org), and news digests. Claude AI generates a bilingual (EN + ES) HTML newsletter with photos. Sent to all active subscribers via Resend, each receiving their preferred language version.'
  },
  {
    icon: '\u{1F4DD}', bg: 'bg-red-100', fg: 'text-red-600',
    label: 'Auto Chronicle (football-data.org)', desc: 'Daily at 10:00 UTC',
    hour: 10, minute: 0, days: null,
    info: 'Checks football-data.org for any Barcelona match played yesterday. If found, generates a detailed match chronicle using Claude AI with the match data (score, scorers, competition, venue) and publishes it on /news.'
  },
  {
    icon: '\u26BD', bg: 'bg-orange-100', fg: 'text-orange-600',
    label: 'Match Chronicle (legacy)', desc: 'Daily at 23:30 UTC',
    hour: 23, minute: 30, days: null,
    info: 'Legacy fallback that uses API-Football to check if Barça played today. If the primary auto-chronicle (football-data.org) already created a chronicle, this one skips. Kept as a safety net.'
  },
  {
    icon: '\u{1F504}', bg: 'bg-green-100', fg: 'text-green-600',
    label: 'Calendar Sync (La Liga + CL + Copa)', desc: 'Daily at 7:00 AM UTC',
    hour: 7, minute: 0, days: null,
    info: 'Fetches upcoming Barcelona matches from football-data.org (La Liga + Champions League) and API-Football (Copa del Rey). Downloads opponent crests as PNGs to /public/images/crests/. Updates the /calendar page with the latest schedule.'
  },
  {
    icon: '\u{1F3C6}', bg: 'bg-purple-100', fg: 'text-purple-600',
    label: 'Competition Data', desc: 'Daily at 6:00 AM UTC',
    hour: 6, minute: 0, days: null,
    info: 'Updates standings for La Liga, Champions League, and Copa del Rey from football-data.org (primary) and API-Football (fallback). Calculates Barça stats and generates AI predictions for each competition. Shown on /competitions.'
  },
  {
    icon: '\u{1F3AB}', bg: 'bg-yellow-100', fg: 'text-yellow-600',
    label: 'Package Sync (StubHub + GYG)', desc: 'Daily at 7:30 AM UTC',
    hour: 7, minute: 30, days: null,
    info: 'Syncs match package data from StubHub (ticket availability and prices) and GetYourGuide (activities). Creates or updates match packages on /packages with affiliate links for tickets, hotels, and activities.'
  },
  {
    icon: '\u{1F3E0}', bg: 'bg-teal-100', fg: 'text-teal-600',
    label: 'Penyes Sync (Scraping)', desc: 'Monday at 5:00 AM UTC',
    hour: 5, minute: 0, days: [1],
    info: 'Scrapes the official FCB supporter clubs directory from 3 URLs (Catalonia, Spain, World) using Cheerio. Updates the Penyes database with new clubs, cities, and regions. Currently tracking 1,217 penyes.'
  },
  {
    icon: '\u{1F4DA}', bg: 'bg-indigo-100', fg: 'text-indigo-600',
    label: 'Guide Generation', desc: 'Monthly, 1st at 9:00 AM UTC',
    hour: 9, minute: 0, days: null, monthDay: 1,
    info: 'Generates a new AI-written travel guide for Barcelona visitors using Claude. Topics include stadium guides, neighborhood guides, restaurant recommendations, and travel tips. Published on /guides.'
  },
];

function getNextRun(hour: number, minute: number, daysOfWeek: number[] | null, monthDay?: number): { dateStr: string; timeStr: string } {
  const now = new Date();
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0));

  if (monthDay) {
    if (candidate.getUTCDate() > monthDay || (candidate.getUTCDate() === monthDay && candidate <= now)) {
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
    }
    candidate.setUTCDate(monthDay);
  } else if (daysOfWeek) {
    let found = false;
    for (let offset = 0; offset < 8; offset++) {
      const test = new Date(candidate.getTime() + offset * 86400000);
      if (daysOfWeek.includes(test.getUTCDay()) && test > now) {
        candidate.setTime(test.getTime());
        found = true;
        break;
      }
    }
    if (!found) candidate.setTime(candidate.getTime() + 7 * 86400000);
  } else {
    if (candidate <= now) candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  const dateStr = candidate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const timeStr = candidate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';
  return { dateStr, timeStr };
}

export default function AdminAutomationsPage() {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [sources, setSources] = useState<RssSource[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, chronicles: 0, digests: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [infoModal, setInfoModal] = useState<ScheduleInfo | null>(null);
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/automations');
      const data = await res.json();
      setRuns(data.runs || []);
      setSources(data.sources || []);
      setStats(data.stats || { total: 0, chronicles: 0, digests: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const triggerAction = async (endpoint: string, label: string) => {
    setActionLoading(label);
    setActionMsg('');
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`${label}: Success! ${data.message || ''}`);
      } else {
        setActionMsg(`${label}: ${data.error || 'Failed'}`);
      }
      fetchData();
    } catch {
      setActionMsg(`${label}: Network error`);
    }
    setActionLoading(null);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
      running: 'bg-yellow-100 text-yellow-700',
    };
    return `text-xs font-medium px-2 py-0.5 rounded ${colors[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      news_digest: 'News Digest',
      match_chronicle: 'Match Chronicle',
      auto_chronicle: 'Auto Chronicle',
      match_sync: 'Match Sync',
      package_sync: 'Package Sync',
      guide_generation: 'Guide Generation',
      newsletter_send: 'Newsletter Send',
    };
    return labels[type] || type;
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Automations</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-heading font-bold text-[#1A1A2E]">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total News Articles</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-heading font-bold text-[#A50044]">{stats.chronicles}</div>
          <div className="text-xs text-gray-500 mt-1">Match Chronicles</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-heading font-bold text-[#004D98]">{stats.digests}</div>
          <div className="text-xs text-gray-500 mt-1">News Digests</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Manual Actions</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { endpoint: '/api/automations/auto-chronicle', label: 'Auto Chronicle', icon: '\u{1F4DD}', desc: "Generate yesterday's match chronicle (football-data.org)" },
            { endpoint: '/api/automations/news-digest', label: 'Generate Digest', icon: '\u{1F4F0}', desc: 'Create news digest from RSS feeds' },
            { endpoint: '/api/automations/match-chronicle', label: 'Check Match (legacy)', icon: '\u26BD', desc: 'Generate chronicle if Barça played today (API-Football)' },
            { endpoint: '/api/automations/sync-matches', label: 'Sync Calendar', icon: '\u{1F504}', desc: 'Sync all matches (La Liga + CL + Copa) + download crests' },
            { endpoint: '/api/competitions/refresh', label: 'Refresh Competitions', icon: '\u{1F3C6}', desc: 'Update standings + AI predictions' },
            { endpoint: '/api/automations/sync-packages', label: 'Sync Packages', icon: '\u{1F3AB}', desc: 'Sync StubHub events + GYG activities' },
            { endpoint: '/api/automations/generate-guide', label: 'Generate Guide', icon: '\u{1F4DA}', desc: 'Create a new travel guide with AI' },
            { endpoint: '/api/automations/seed', label: 'Seed 10 Weeks', icon: '\u{1F331}', desc: 'Generate retroactive content (slow)' },
          ].map((action) => (
            <button
              key={action.endpoint}
              onClick={() => triggerAction(action.endpoint, action.label)}
              disabled={actionLoading !== null}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-[#1A1A2E]">
                {actionLoading === action.label ? 'Running...' : action.label}
              </span>
              <span className="text-xs text-gray-500">{action.desc}</span>
            </button>
          ))}
        </div>
        {actionMsg && (
          <div className={`mx-5 mb-5 p-3 rounded-lg text-sm ${actionMsg.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {actionMsg}
          </div>
        )}
      </div>

      {/* RSS Sources */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">RSS Sources ({sources.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {sources.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-sm">
              No RSS sources configured. They will be seeded automatically.
            </div>
          ) : (
            sources.map((src) => (
              <div key={src.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[#1A1A2E]">{src.name}</span>
                  <p className="text-xs text-gray-400 font-mono truncate max-w-md">{src.url}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${src.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {src.active ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cron Schedule */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Automation Schedule <span className="text-xs font-normal text-gray-400 ml-1">({utcTime} UTC)</span></h2>
        </div>
        <div className="p-5 space-y-3 text-sm">
          {SCHEDULE_ITEMS.map((item) => {
            const nextRun = getNextRun(item.hour, item.minute, item.days, item.monthDay);
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.fg} shrink-0`}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1A1A2E] flex items-center gap-1.5">
                    {item.label}
                    <button
                      onClick={() => setInfoModal(item)}
                      className="w-4 h-4 rounded-full bg-[#004D98] text-white text-[10px] font-bold flex items-center justify-center hover:bg-[#003d7a] transition-colors shrink-0"
                      title="More info"
                    >
                      i
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-[#004D98]">{nextRun.dateStr}</div>
                  <div className="text-xs text-gray-400">{nextRun.timeStr}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Run History */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Run History (Last 50)</h2>
        </div>
        <div className="overflow-x-auto">
          {runs.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-sm">
              No automation runs yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Message</th>
                  <th className="text-left py-3 px-4">Started</th>
                  <th className="text-left py-3 px-4">Duration</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const duration =
                    run.endedAt
                      ? `${Math.round((new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
                      : '-';
                  return (
                    <tr key={run.id} className="border-b border-gray-50">
                      <td className="py-3 px-4 font-medium">{typeLabel(run.type)}</td>
                      <td className="py-3 px-4">
                        <span className={statusBadge(run.status)}>{run.status}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{run.message}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(run.startedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-400">{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setInfoModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg ${infoModal.bg} flex items-center justify-center ${infoModal.fg}`}>{infoModal.icon}</span>
                <h2 className="font-heading font-bold text-[#1A1A2E]">{infoModal.label}</h2>
              </div>
              <button onClick={() => setInfoModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase">Schedule: {infoModal.desc}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{infoModal.info}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
