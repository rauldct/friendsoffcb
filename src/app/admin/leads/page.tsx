"use client";

import { useState, useEffect, useCallback } from "react";

interface Lead {
  id: string;
  email: string;
  name: string | null;
  matchInterested: string | null;
  groupSize: number | null;
  country: string | null;
  message: string | null;
  source: string;
  createdAt: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/leads-list");
    const data = await res.json();
    setLeads(data.leads);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Leads ({leads.length})</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Match</th>
                <th className="px-4 py-3 font-medium text-gray-500">Group</th>
                <th className="px-4 py-3 font-medium text-gray-500">Country</th>
                <th className="px-4 py-3 font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500">Message</th>
                <th className="px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No leads yet. They will appear here when users submit forms.</td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.name || "-"}</td>
                    <td className="px-4 py-3">
                      {lead.matchInterested ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{lead.matchInterested}</span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.groupSize || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.country || "-"}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{lead.source}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(lead.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{lead.message || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        disabled={deleting === lead.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deleting === lead.id ? "..." : "Delete"}
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
