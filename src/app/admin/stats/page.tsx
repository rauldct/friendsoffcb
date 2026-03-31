"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StatsData {
  traffic: { pageViews: number };
  subscribers: {
    total: number; active: number; inactive: number;
    last30Days: number; last7Days: number;
    byMonth: { month: string; count: number }[];
  };
  leads: {
    total: number; last30Days: number; last7Days: number;
    byMonth: { month: string; count: number }[];
  };
  newsletters: {
    total: number; sent: number; totalOpens: number; avgOpenRate: number;
    recent: { id: string; subject: string; sentAt: string | null; recipients: number; uniqueOpens: number; openRate: number }[];
  };
  content: {
    newsArticles: number; chronicles: number; digests: number;
    photos: number; photosApproved: number; photosPending: number;
  };
  community: { penyes: number; penyesEnriched: number };
}

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};

function MiniBar({ data, color }: { data: { month: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-24 mt-2">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{d.count}</span>
          <div
            className={`w-full rounded-t ${color}`}
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%`, minHeight: "2px" }}
          />
          <span className="text-[9px] text-gray-400">{monthLabel(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

function StatBlock({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
      </div>
      <div className="text-2xl font-heading font-bold text-[#1A1A2E]">{value}</div>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Statistics</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#004D98] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Statistics</h1>
        <p className="text-gray-500">Failed to load statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Statistics</h1>
        <span className="text-xs text-gray-400">Updated in real-time</span>
      </div>

      {/* Traffic */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Traffic</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBlock label="Total Page Views" value={data.traffic.pageViews.toLocaleString()} icon="📈" />
          <div className="bg-white rounded-xl shadow-sm p-5 sm:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📊</span>
              <span className="text-xs font-medium text-gray-500 uppercase">Google Analytics</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              GA Measurement ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">G-X3V9WEQCXC</code>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              For detailed traffic analytics, visit{" "}
              <a
                href="https://analytics.google.com/analytics/web/#/p/G-X3V9WEQCXC"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#004D98] hover:underline"
              >
                Google Analytics Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Audience */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Audience</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBlock label="Subscribers" value={data.subscribers.total} sub={`${data.subscribers.active} active · ${data.subscribers.inactive} inactive`} icon="📬" />
          <StatBlock label="New Subscribers (7d)" value={data.subscribers.last7Days} sub={`${data.subscribers.last30Days} in last 30 days`} icon="📥" />
          <StatBlock label="Total Leads" value={data.leads.total} sub={`${data.leads.last7Days} this week`} icon="📧" />
          <StatBlock label="New Leads (30d)" value={data.leads.last30Days} sub={`${data.leads.last7Days} in last 7 days`} icon="🎯" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {data.subscribers.byMonth.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <span className="text-xs font-medium text-gray-500 uppercase">Subscriber Growth (6 months)</span>
              <MiniBar data={data.subscribers.byMonth} color="bg-green-500" />
            </div>
          )}
          {data.leads.byMonth.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <span className="text-xs font-medium text-gray-500 uppercase">Lead Growth (6 months)</span>
              <MiniBar data={data.leads.byMonth} color="bg-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Newsletter Performance */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Newsletter Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBlock label="Newsletters Sent" value={data.newsletters.sent} sub={`${data.newsletters.total} total`} icon="📨" />
          <StatBlock label="Total Opens" value={data.newsletters.totalOpens.toLocaleString()} icon="👀" />
          <StatBlock label="Avg Open Rate" value={`${data.newsletters.avgOpenRate}%`} icon="📬" />
          <StatBlock label="Active Subscribers" value={data.subscribers.active} icon="✅" />
        </div>
        {data.newsletters.recent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm mt-4 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase">Recent Newsletters</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Subject</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500 font-medium">Sent</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500 font-medium">Recipients</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500 font-medium">Opens</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.newsletters.recent.map(n => (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-[#1A1A2E] font-medium truncate max-w-[250px]">{n.subject}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs whitespace-nowrap">
                        {n.sentAt ? new Date(n.sentAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{n.recipients}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{n.uniqueOpens}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          n.openRate >= 40 ? "bg-green-100 text-green-700" :
                          n.openRate >= 20 ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {n.openRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBlock label="News Articles" value={data.content.newsArticles} sub={`${data.content.chronicles} chronicles · ${data.content.digests} digests`} icon="📰" />
          <StatBlock label="Gallery Photos" value={data.content.photos} sub={`${data.content.photosApproved} approved · ${data.content.photosPending} pending`} icon="📸" />
          <StatBlock label="Peñas" value={data.community.penyes} sub={`${data.community.penyesEnriched} enriched`} icon="🏠" />
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-center">
            <Link href="/admin/newsletter" className="text-sm text-[#004D98] hover:underline font-medium">
              View Newsletter Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
