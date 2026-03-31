"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

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

// Disposable domains (mirror of server list for client-side flagging)
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "yopmail.com", "sharklasers.com", "dispostable.com", "trashmail.com",
  "10minutemail.com", "fakeinbox.com", "mailnesia.com", "maildrop.cc",
  "discard.email", "temp-mail.org", "temp-mail.io", "emailondeck.com",
  "mohmal.com", "getnada.com", "mailsac.com", "tmpmail.net", "tmpmail.org",
  "tempr.email", "fakemail.net", "mailcatch.com", "mintemail.com",
  "guerrillamail.info", "guerrillamail.net", "guerrillamail.de",
  "burnermail.io", "dropmail.me", "nada.email", "1secmail.com",
  "1secmail.org", "1secmail.net", "emailfake.com", "mailslurp.com",
  "generator.email",
]);

function getSpamFlags(sub: Subscriber): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  const domain = sub.email.split("@")[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    flags.push("Disposable email");
    score += 40;
  }

  const local = sub.email.split("@")[0] || "";
  if (/[^aeiou]{6,}/i.test(local)) { flags.push("Random chars"); score += 20; }
  if (local.length > 40) { flags.push("Very long"); score += 15; }
  if (/^\d+$/.test(local)) { flags.push("All numbers"); score += 10; }

  if (sub.totalOpens === 0) {
    const days = Math.floor((Date.now() - new Date(sub.subscribedAt).getTime()) / 86400000);
    if (days > 14) { flags.push(`No opens (${days}d)`); score += 15; }
  }

  return { score: Math.min(score, 100), flags };
}

type FilterMode = "all" | "active" | "inactive" | "spam";

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortBy, setSortBy] = useState<"email" | "name" | "language" | "source" | "active" | "spamScore" | "totalOpens" | "subscribedAt">("subscribedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      // Default order: desc for dates/numbers, asc for text fields
      const textFields: string[] = ["email", "name", "language", "source"];
      setSortOrder(textFields.includes(field) ? "asc" : "desc");
    }
  };

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/subscribers-list");
    const data = await res.json();
    setSubscribers(data.subscribers);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscriber?")) return;
    setDeleting(prev => new Set(prev).add(id));
    const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    setDeleting(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const label = selected.size === 1 ? "1 subscriber" : `${selected.size} subscribers`;
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    const ids = [...selected];
    setDeleting(new Set(ids));
    let deleted = 0;
    for (const id of ids) {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
      if (res.ok) deleted++;
    }
    setSubscribers(prev => prev.filter(s => !selected.has(s.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${deleted} of ${ids.length} subscribers.`);
  };

  const handleDeleteAllSpam = async () => {
    const spamSubs = enriched.filter(s => s.spamScore >= 40);
    if (spamSubs.length === 0) { alert("No spam subscribers detected."); return; }
    if (!confirm(`Delete ${spamSubs.length} suspected spam subscribers?`)) return;
    const ids = spamSubs.map(s => s.id);
    setDeleting(new Set(ids));
    let deleted = 0;
    for (const id of ids) {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
      if (res.ok) deleted++;
    }
    setSubscribers(prev => prev.filter(s => !ids.includes(s.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${deleted} spam subscribers.`);
  };

  // Enrich with spam flags
  const enriched = useMemo(() => {
    return subscribers.map(sub => {
      const { score, flags } = getSpamFlags(sub);
      return { ...sub, spamScore: score, spamFlags: flags };
    });
  }, [subscribers]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = enriched;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.email.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q));
    }
    if (filter === "active") list = list.filter(s => s.active);
    if (filter === "inactive") list = list.filter(s => !s.active);
    if (filter === "spam") list = list.filter(s => s.spamScore >= 30);

    // Sort
    list = [...list].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      let va: any = a[sortBy as keyof typeof a] ?? "";
      let vb: any = b[sortBy as keyof typeof b] ?? "";
      if (sortBy === "subscribedAt") { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      if (typeof va === "boolean") return (va === vb ? 0 : va ? -1 : 1) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return list;
  }, [enriched, search, filter, sortBy, sortOrder]);

  const active = subscribers.filter(s => s.active).length;
  const spamCount = enriched.filter(s => s.spamScore >= 30).length;
  const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Subscribers</h1>
          <div className="flex gap-3 mt-1 text-sm">
            <span className="text-green-600 font-medium">{active} active</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{subscribers.length} total</span>
            {spamCount > 0 && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-red-500 font-medium">{spamCount} suspected spam</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium">
              Delete {selected.size} selected
            </button>
          )}
          {spamCount > 0 && (
            <button onClick={handleDeleteAllSpam} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 font-medium">
              Delete all spam
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search email or name..."
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#004D98]"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "active", "inactive", "spam"] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f === "all" ? "All" : f === "active" ? "Active" : f === "inactive" ? "Inactive" : `Spam (${spamCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("email")}>
                  <div className="flex items-center gap-1">
                    Email
                    {sortBy === "email" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">
                    Name
                    {sortBy === "name" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("language")}>
                  <div className="flex items-center gap-1">
                    Lang
                    {sortBy === "language" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("source")}>
                  <div className="flex items-center gap-1">
                    Source
                    {sortBy === "source" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("active")}>
                  <div className="flex items-center gap-1">
                    Status
                    {sortBy === "active" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("spamScore")}>
                  <div className="flex items-center gap-1">
                    Spam
                    {sortBy === "spamScore" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("totalOpens")}>
                  <div className="flex items-center gap-1">
                    Opens
                    {sortBy === "totalOpens" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("subscribedAt")}>
                  <div className="flex items-center gap-1">
                    Subscribed
                    {sortBy === "subscribedAt" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">{search ? "No matches found." : "No subscribers."}</td></tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className={`hover:bg-gray-50 ${sub.spamScore >= 40 ? "bg-red-50/50" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(sub.id)} onChange={() => toggleOne(sub.id)} className="rounded" />
                    </td>
                    <td className="px-3 py-3 font-medium text-[#1A1A2E] text-xs max-w-[200px] truncate" title={sub.email}>{sub.email}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{sub.name || "-"}</td>
                    <td className="px-3 py-3 text-gray-600 uppercase text-xs font-medium">{sub.language}</td>
                    <td className="px-3 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{sub.source}</span></td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${sub.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {sub.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {sub.spamScore >= 40 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium cursor-help" title={sub.spamFlags.join(", ")}>
                          {sub.spamScore}%
                        </span>
                      ) : sub.spamScore >= 15 ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium cursor-help" title={sub.spamFlags.join(", ")}>
                          {sub.spamScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {sub.totalOpens > 0 ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{sub.totalOpens}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        disabled={deleting.has(sub.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deleting.has(sub.id) ? "..." : "Delete"}
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
