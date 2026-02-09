"use client";

import { useState, useEffect } from "react";
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

interface DashboardData {
  sslExpiry: string | null;
  sslDaysLeft: number | null;
  pageViews: number;
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

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  // Insert page views card between Blog Posts and Matches
  const allStats = [...stats];
  const matchesIdx = allStats.findIndex(s => s.label === "Matches");
  if (matchesIdx !== -1) {
    allStats.splice(matchesIdx, 0, {
      label: "Page Views",
      value: data ? data.pageViews.toLocaleString() : "...",
      icon: "\u{1F4C8}",
      color: "bg-cyan-50 text-cyan-700",
      href: "/admin/settings",
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

  return (
    <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
