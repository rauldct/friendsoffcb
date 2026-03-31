"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  href: string;
}

interface Lead {
  id: string;
  email: string;
  name: string | null;
  matchInterested: string | null;
  source: string;
  createdAt: string;
}

interface Sub {
  id: string;
  email: string;
  active: boolean;
  source: string;
}

interface ChartPoint {
  date: string;
  count: number;
}

interface ApiAlert {
  service: string;
  message: string;
  code?: number;
  context?: string;
  timestamp: string;
}

interface DashboardData {
  sslExpiry: string | null;
  sslDaysLeft: number | null;
  pageViews: number;
  pageViewsChart: ChartPoint[];
  subscribersChart: ChartPoint[];
  apiAlerts: ApiAlert[];
}

type TimeRange = "week" | "month" | "year";

function MiniChart({ data, color, label }: { data: ChartPoint[]; color: string; label: string }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data yet</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex gap-[2px] h-40 mb-5 relative">
        {data.map((point, i) => {
          const height = Math.max((point.count / maxCount) * 100, 2);
          const shortLabel = point.date.length > 7
            ? point.date.slice(5) // MM-DD
            : point.date.slice(2); // YY-MM
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className={`w-full rounded-t ${color} transition-all group-hover:opacity-80`}
                style={{ height: `${height}%`, minHeight: "2px" }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {point.count} - {point.date}
              </div>
              {/* X-axis label - positioned outside bar area */}
              {(data.length <= 8 || i % Math.ceil(data.length / 7) === 0) && (
                <span className="absolute top-full mt-1 text-[9px] text-gray-400">{shortLabel}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center mt-2 text-lg font-bold text-[#1A1A2E]">
        {total.toLocaleString()} <span className="text-xs font-normal text-gray-500">{label}</span>
      </div>
    </div>
  );
}

export default function DashboardClient({
  stats,
  recentLeads,
  recentSubscribers,
}: {
  stats: StatCard[];
  recentLeads: Lead[];
  recentSubscribers: Sub[];
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [range, setRange] = useState<TimeRange>("week");
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  const fetchData = useCallback((r: TimeRange) => {
    fetch(`/api/admin/dashboard?range=${r}`)
      .then(res => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleRangeChange = (r: TimeRange) => {
    setRange(r);
  };

  // Insert page views card between Blog Posts and Matches
  const allStats = [...stats];
  const matchesIdx = allStats.findIndex(s => s.label === "Matches");
  if (matchesIdx !== -1) {
    allStats.splice(matchesIdx, 0, {
      label: "Page Views",
      value: data ? data.pageViews.toLocaleString() : "...",
      icon: "\u{1F4C8}",
      color: "bg-cyan-50 text-cyan-700",
      href: "/admin/stats",
    });
  }

  // SSL status
  const sslColor = data?.sslDaysLeft != null
    ? data.sslDaysLeft > 30 ? "text-green-600" : data.sslDaysLeft > 7 ? "text-yellow-600" : "text-red-600"
    : "text-green-600";
  const sslDot = data?.sslDaysLeft != null
    ? data.sslDaysLeft > 30 ? "bg-green-500" : data.sslDaysLeft > 7 ? "bg-yellow-500" : "bg-red-500"
    : "bg-green-500";

  const formatDaysLeft = (days: number | null) => {
    if (days == null) return "";
    if (days > 60) return `${Math.floor(days / 30)}mo left`;
    return `${days}d left`;
  };

  const rangeButtons: { value: TimeRange; label: string }[] = [
    { value: "week", label: "7d" },
    { value: "month", label: "30d" },
    { value: "year", label: "1y" },
  ];

  const SERVICE_LABELS: Record<string, string> = {
    anthropic: "Claude AI (Anthropic)",
    "brave-search": "Brave Search",
    "football-data": "football-data.org",
    resend: "Resend Email",
    perplexity: "Perplexity Sonar",
    grok: "Grok (xAI)",
  };

  const alerts = data?.apiAlerts || [];
  const showAlertModal = alerts.length > 0 && !alertsDismissed;

  return (
    <div className="space-y-6">
      {/* API Alerts Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-lg font-bold text-white">API Alerts ({alerts.length})</h2>
            </div>
            <div className="px-6 py-4 max-h-80 overflow-y-auto divide-y divide-gray-100">
              {alerts.map((alert, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-sm text-[#1A1A2E]">
                      {SERVICE_LABELS[alert.service] || alert.service}
                    </span>
                    {alert.code && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                        {alert.code}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 ml-4">{alert.message}</p>
                  <div className="flex gap-3 ml-4 mt-1 text-xs text-gray-400">
                    {alert.context && <span>{alert.context}</span>}
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">Alerts auto-clear when APIs recover</p>
              <button
                onClick={() => setAlertsDismissed(true)}
                className="px-4 py-2 bg-[#1A1A2E] text-white text-sm font-medium rounded-lg hover:bg-[#2a2a4e] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {allStats.map(stat => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${stat.color}`}>{stat.icon}</span>
              <span className="text-xs font-medium text-gray-500 uppercase">{stat.label}</span>
            </div>
            <div className="text-2xl font-heading font-bold text-[#1A1A2E]">{stat.value}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Views Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-[#1A1A2E]">Page Views</h2>
            <div className="flex gap-1">
              {rangeButtons.map(btn => (
                <button
                  key={btn.value}
                  onClick={() => handleRangeChange(btn.value)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    range === btn.value
                      ? "bg-[#004D98] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <MiniChart
            data={data?.pageViewsChart || []}
            color="bg-cyan-500"
            label="views"
          />
        </div>

        {/* Subscribers Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-[#1A1A2E]">New Subscribers</h2>
            <div className="flex gap-1">
              {rangeButtons.map(btn => (
                <button
                  key={btn.value}
                  onClick={() => handleRangeChange(btn.value)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    range === btn.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <MiniChart
            data={data?.subscribersChart || []}
            color="bg-green-500"
            label="subscribers"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-[#1A1A2E]">Recent Leads</h2>
            <Link href="/admin/leads" className="text-sm text-[#004D98] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLeads.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No leads yet</p>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-[#1A1A2E]">{lead.name || lead.email}</span>
                      {lead.matchInterested && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{lead.matchInterested}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{lead.email} &middot; {lead.source}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-[#1A1A2E]">Recent Subscribers</h2>
            <Link href="/admin/subscribers" className="text-sm text-[#004D98] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSubscribers.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No subscribers yet</p>
            ) : (
              recentSubscribers.map(sub => (
                <div key={sub.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-[#1A1A2E]">{sub.email}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${sub.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {sub.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{sub.source}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-heading font-bold text-[#1A1A2E] mb-3">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Next.js Server: <strong className="text-green-600">Running</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Database: <strong className="text-green-600">Connected</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${sslDot} rounded-full`}></span>
            <span className="text-gray-600">
              SSL: <strong className={sslColor}>Active</strong>
              {data?.sslDaysLeft != null && (
                <span className={`text-xs ml-1 ${sslColor}`}>({formatDaysLeft(data.sslDaysLeft)})</span>
              )}
            </span>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <button
                onClick={() => setAlertsDismissed(false)}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                APIs: <strong className="text-red-600">{alerts.length} alert{alerts.length > 1 ? "s" : ""}</strong>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
