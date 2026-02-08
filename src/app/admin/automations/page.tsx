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

export default function AdminAutomationsPage() {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [sources, setSources] = useState<RssSource[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, chronicles: 0, digests: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');

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
            { endpoint: '/api/automations/auto-chronicle', label: 'Auto Chronicle', icon: '{"📝"}', desc: "Generate yesterday's match chronicle (football-data.org)" },
            { endpoint: '/api/automations/news-digest', label: 'Generate Digest', icon: '{"📰"}', desc: 'Create news digest from RSS feeds' },
            { endpoint: '/api/automations/match-chronicle', label: 'Check Match (legacy)', icon: '{"⚽"}', desc: 'Generate chronicle if Barça played today (API-Football)' },
            { endpoint: '/api/automations/sync-matches', label: 'Sync Calendar', icon: '{"🔄"}', desc: 'Sync matches from football API' },
            { endpoint: '/api/automations/sync-packages', label: 'Sync Packages', icon: '{"🎟️"}', desc: 'Sync StubHub events + GYG activities' },
            { endpoint: '/api/automations/generate-guide', label: 'Generate Guide', icon: '{"📚"}', desc: 'Create a new travel guide with AI' },
            { endpoint: '/api/automations/seed', label: 'Seed 10 Weeks', icon: '{"🌱"}', desc: 'Generate retroactive content (slow)' },
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
          <h2 className="font-heading font-bold text-[#1A1A2E]">Automation Schedule</h2>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">{"📰"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">News Digest</div>
              <div className="text-xs text-gray-500">Every 3 days at 8:00 AM UTC</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">{"📝"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">Auto Chronicle (football-data.org)</div>
              <div className="text-xs text-gray-500">Daily at 10:00 UTC (checks yesterday&apos;s matches)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">{"⚽"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">Match Chronicle (legacy)</div>
              <div className="text-xs text-gray-500">Daily at 23:30 UTC (API-Football, fallback)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">{"🔄"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">Calendar Sync</div>
              <div className="text-xs text-gray-500">Weekly on Mondays at 7:00 AM UTC</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">{"🏆"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">Competition Data</div>
              <div className="text-xs text-gray-500">Daily at 6:00 AM UTC</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">{"🎟️"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">Package Sync (StubHub + GYG)</div>
              <div className="text-xs text-gray-500">Daily at 7:30 AM UTC</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">{"📚"}</span>
            <div>
              <div className="font-medium text-[#1A1A2E]">Guide Generation</div>
              <div className="text-xs text-gray-500">Monthly on the 1st at 9:00 AM UTC</div>
            </div>
          </div>
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
    </div>
  );
}
