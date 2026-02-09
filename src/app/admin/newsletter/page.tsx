"use client";

import { useState, useEffect, useCallback } from "react";

interface Newsletter {
  id: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  status: string;
  sentAt: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  errorMessage: string | null;
  createdAt: string;
}

interface OpenEntry {
  email: string;
  name: string | null;
  openedAt: string;
}

interface StatsData {
  uniqueOpens: number;
  totalOpens: number;
  openRate: string;
  sentCount: number;
  opens: OpenEntry[];
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function AdminNewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Stats modal
  const [statsModal, setStatsModal] = useState<{ newsletter: Newsletter; data: StatsData } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter");
      const data = await res.json();
      setNewsletters(data.newsletters || []);
    } catch {
      setError("Failed to load newsletters");
    }
    setLoading(false);
  }, []);

  const fetchSubscriberCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subscribers-list");
      const data = await res.json();
      const active = (data.subscribers || []).filter((s: { active: boolean }) => s.active).length;
      setSubscriberCount(active);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNewsletters();
    fetchSubscriberCount();
  }, [fetchNewsletters, fetchSubscriberCount]);

  const resetEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setSubject("");
    setHtmlContent("");
    setTextContent("");
    setError("");
  };

  const openNew = () => {
    resetEditor();
    setShowEditor(true);
  };

  const openEdit = (nl: Newsletter) => {
    setEditingId(nl.id);
    setSubject(nl.subject);
    setHtmlContent(nl.htmlContent);
    setTextContent(nl.textContent);
    setShowEditor(true);
    setError("");
  };

  const handleSave = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      setError("Subject and HTML content are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = { subject, htmlContent, textContent };
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/newsletter/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSuccess(editingId ? "Newsletter updated" : "Draft created");
      resetEditor();
      fetchNewsletters();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const handleSend = async (id: string) => {
    const nl = newsletters.find(n => n.id === id);
    if (!confirm(`Send "${nl?.subject}" to ${subscriberCount} active subscribers?`)) return;
    setSending(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/newsletter/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSuccess(data.message);
      fetchNewsletters();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    }
    setSending(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNewsletters(prev => prev.filter(n => n.id !== id));
        setSuccess("Draft deleted");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Failed to delete");
    }
    setDeleting(null);
  };

  const handlePreview = (id: string) => {
    window.open(`/api/admin/newsletter/${id}/preview`, "_blank");
  };

  const handleStats = async (nl: Newsletter) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter/${nl.id}/stats`);
      const data = await res.json();
      setStatsModal({ newsletter: nl, data });
    } catch {
      setError("Failed to load stats");
    }
    setStatsLoading(false);
  };

  // Stats
  const sentNewsletters = newsletters.filter(n => n.status === "sent");
  const totalDelivered = sentNewsletters.reduce((s, n) => s + n.sentCount, 0);
  const totalOpens = sentNewsletters.reduce((s, n) => s + n.openCount, 0);
  const avgOpenRate = totalDelivered > 0 ? ((totalOpens / totalDelivered) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Newsletter</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-[#004D98] text-white rounded-lg text-sm font-medium hover:bg-[#003d7a] transition-colors"
        >
          + New Draft
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Subscribers", value: subscriberCount, color: "text-[#004D98]" },
          { label: "Sent Newsletters", value: sentNewsletters.length, color: "text-[#1A1A2E]" },
          { label: "Total Delivered", value: totalDelivered, color: "text-green-600" },
          { label: "Avg Open Rate", value: `${avgOpenRate}%`, color: "text-[#A50044]" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Editor Panel */}
      {showEditor && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-[#1A1A2E]">
              {editingId ? "Edit Newsletter" : "New Newsletter Draft"}
            </h2>
            <button onClick={resetEditor} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Newsletter subject line..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004D98] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
              <textarea
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                rows={12}
                placeholder="<h2>Hello Culers!</h2>&#10;<p>Latest news from Camp Nou...</p>"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#004D98] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plain Text (fallback)</label>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                rows={4}
                placeholder="Plain text version for email clients that don't support HTML..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004D98] focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#004D98] text-white rounded-lg text-sm font-medium hover:bg-[#003d7a] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update Draft" : "Create Draft"}
              </button>
              <button
                onClick={resetEditor}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newsletters Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Subject</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Recipients</th>
                <th className="px-4 py-3 font-medium text-gray-500">Opens</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : newsletters.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No newsletters yet. Create your first draft!</td></tr>
              ) : (
                newsletters.map(nl => {
                  const openRate = nl.sentCount > 0 ? ((nl.openCount / nl.sentCount) * 100).toFixed(1) : "-";
                  return (
                    <tr key={nl.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1A1A2E] max-w-[250px] truncate">{nl.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_BADGE[nl.status] || "bg-gray-100 text-gray-600"}`}>
                          {nl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {nl.status === "draft" ? "-" : `${nl.sentCount}/${nl.recipientCount}`}
                        {nl.failedCount > 0 && <span className="text-red-500 ml-1">({nl.failedCount} failed)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {nl.status === "sent" ? `${nl.openCount} (${openRate}%)` : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {nl.sentAt ? new Date(nl.sentAt).toLocaleString() : new Date(nl.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(nl.id)}
                            className="text-[#004D98] hover:text-[#003d7a] text-xs font-medium"
                          >
                            Preview
                          </button>
                          {nl.status === "sent" && (
                            <button
                              onClick={() => handleStats(nl)}
                              disabled={statsLoading}
                              className="text-[#A50044] hover:text-[#7a0030] text-xs font-medium disabled:opacity-50"
                            >
                              Stats
                            </button>
                          )}
                          {nl.status === "draft" && (
                            <>
                              <button
                                onClick={() => openEdit(nl)}
                                className="text-[#004D98] hover:text-[#003d7a] text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleSend(nl.id)}
                                disabled={sending === nl.id}
                                className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                              >
                                {sending === nl.id ? "Sending..." : "Send"}
                              </button>
                              <button
                                onClick={() => handleDelete(nl.id)}
                                disabled={deleting === nl.id}
                                className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                              >
                                {deleting === nl.id ? "..." : "Delete"}
                              </button>
                            </>
                          )}
                          {nl.errorMessage && (
                            <button
                              onClick={() => alert(nl.errorMessage)}
                              className="text-red-500 text-xs font-medium"
                              title="View errors"
                            >
                              Errors
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Modal */}
      {statsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setStatsModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-bold text-[#1A1A2E] text-lg">Newsletter Stats</h2>
              <button onClick={() => setStatsModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4 truncate">{statsModal.newsletter.subject}</p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#004D98]">{statsModal.data.uniqueOpens}</div>
                  <div className="text-xs text-gray-500">Unique Opens</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">{statsModal.data.totalOpens}</div>
                  <div className="text-xs text-gray-500">Total Opens</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{statsModal.data.openRate}%</div>
                  <div className="text-xs text-gray-500">Open Rate</div>
                </div>
              </div>

              {/* Subscribers who opened */}
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Subscribers who opened ({statsModal.data.opens.length})
              </h3>
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg">
                {statsModal.data.opens.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No opens tracked yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Opened At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {statsModal.data.opens.map((o, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">{o.email}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {new Date(o.openedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
