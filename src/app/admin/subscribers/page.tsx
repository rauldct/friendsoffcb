"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  language: string;
  source: string;
  active: boolean;
  subscribedAt: string;
  totalOpens: number;
  lastOpenAt: string | null;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/subscribers-list");
    const data = await res.json();
    setSubscribers(data.subscribers);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSubscribers(prev => prev.filter(s => s.id !== id));
    }
    setDeleting(null);
  };

  const active = subscribers.filter(s => s.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">
          Subscribers ({active} active / {subscribers.length} total)
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Lang</th>
                <th className="px-4 py-3 font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Opens</th>
                <th className="px-4 py-3 font-medium text-gray-500">Last Open</th>
                <th className="px-4 py-3 font-medium text-gray-500">Subscribed</th>
                <th className="px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No subscribers yet.</td></tr>
              ) : (
                subscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{sub.email}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 uppercase text-xs font-medium">{sub.language}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{sub.source}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${sub.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {sub.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sub.totalOpens > 0 ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{sub.totalOpens}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {sub.lastOpenAt ? new Date(sub.lastOpenAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.subscribedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        disabled={deleting === sub.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deleting === sub.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
