"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface FeedbackItem {
  id: string;
  email: string;
  name: string;
  type: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  general: "General",
  travel: "Travel & Trips",
  promotion: "Promotions",
  suggestion: "Suggestion",
  bug: "Bug Report",
  partnership: "Partnership",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-yellow-100 text-yellow-700",
  replied: "bg-green-100 text-green-700",
};

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

function getSpamInfo(item: FeedbackItem, allItems: FeedbackItem[]): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  const email = item.email.toLowerCase();
  const domain = email.split("@")[1] || "";
  const local = email.split("@")[0] || "";

  if (DISPOSABLE_DOMAINS.has(domain)) { flags.push("Disposable"); score += 40; }
  if (domain === "gmail.com" && (local.match(/\./g) || []).length >= 3) {
    flags.push("Gmail dot abuse"); score += 35;
  }
  if (/[^aeiou\d@._ -]{6,}/i.test(local)) { flags.push("Random chars"); score += 20; }
  if (local.length > 40) { flags.push("Long email"); score += 15; }

  // Duplicate email
  const sameEmail = allItems.filter(l => l.email.toLowerCase() === email);
  if (sameEmail.length > 1) { flags.push(`Dup x${sameEmail.length}`); score += 10; }

  return { score: Math.min(score, 100), flags };
}

type FilterMode = "all" | "spam" | "new" | "read" | "replied";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortBy, setSortBy] = useState<"status" | "email" | "name" | "type" | "spamScore" | "createdAt" | "message">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback");
      const data = await res.json();
      setItems(data.feedback || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatus = async (id: string, status: string) => {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const handleSaveNote = async (id: string) => {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminNote: editNote }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, adminNote: editNote } : i));
    setEditId(null);
  };

  const deleteSingle = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    setDeleting(prev => new Set(prev).add(id));
    const res = await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    setDeleting(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} feedback item${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const ids = [...selected];
    setDeleting(new Set(ids));
    let ok = 0;
    for (const id of ids) {
      const res = await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) ok++;
    }
    setItems(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${ok} of ${ids.length} feedback items.`);
  };

  const deleteAllSpam = async () => {
    const spamIds = enriched.filter(i => i.spamScore >= 30).map(i => i.id);
    if (spamIds.length === 0) { alert("No spam feedback detected."); return; }
    if (!confirm(`Delete ${spamIds.length} suspected spam feedback?`)) return;
    setDeleting(new Set(spamIds));
    let ok = 0;
    for (const id of spamIds) {
      const res = await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) ok++;
    }
    setItems(prev => prev.filter(i => !spamIds.includes(i.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${ok} spam feedback items.`);
  };

  // Enrich with spam info
  const enriched = useMemo(() => {
    return items.map(item => {
      const { score, flags } = getSpamInfo(item, items);
      return { ...item, spamScore: score, spamFlags: flags };
    });
  }, [items]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = enriched;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.email.toLowerCase().includes(q) ||
        i.name?.toLowerCase().includes(q) ||
        i.message?.toLowerCase().includes(q) ||
        i.type?.toLowerCase().includes(q)
      );
    }
    if (filter === "spam") list = list.filter(i => i.spamScore >= 30);
    if (filter === "new") list = list.filter(i => i.status === "new");
    if (filter === "read") list = list.filter(i => i.status === "read");
    if (filter === "replied") list = list.filter(i => i.status === "replied");

    list = [...list].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      let va: any = a[sortBy as keyof typeof a] ?? "";
      let vb: any = b[sortBy as keyof typeof b] ?? "";
      if (sortBy === "createdAt") { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [enriched, search, filter, sortBy, sortOrder]);

  const spamCount = enriched.filter(i => i.spamScore >= 30).length;
  const newCount = enriched.filter(i => i.status === "new").length;
  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Feedback</h1>
          <div className="flex gap-3 mt-1 text-sm">
            <span className="text-gray-600 font-medium">{items.length} total</span>
            {newCount > 0 && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-blue-600 font-medium">{newCount} new</span>
              </>
            )}
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
            <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium">
              Delete {selected.size} selected
            </button>
          )}
          {spamCount > 0 && (
            <button onClick={deleteAllSpam} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 font-medium">
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
          placeholder="Search email, name, message..."
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#004D98]"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "spam", "new", "read", "replied"] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f === "all" ? "All" : f === "spam" ? `Spam (${spamCount})` : f === "new" ? `New (${newCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
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
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">
                    Status
                    {sortBy === "status" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
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
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("type")}>
                  <div className="flex items-center gap-1">
                    Type
                    {sortBy === "type" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("spamScore")}>
                  <div className="flex items-center gap-1">
                    Spam
                    {sortBy === "spamScore" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center gap-1">
                    Date
                    {sortBy === "createdAt" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("message")}>
                  <div className="flex items-center gap-1">
                    Message
                    {sortBy === "message" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">{search ? "No matches." : "No feedback yet."}</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.spamScore >= 40 ? "bg-red-50/50" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} className="rounded" />
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-700"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-[#1A1A2E] text-xs max-w-[180px] truncate" title={item.email}>{item.email}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{item.name || "-"}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {item.spamScore >= 40 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium cursor-help" title={item.spamFlags.join(", ")}>
                          {item.spamScore}%
                        </span>
                      ) : item.spamScore >= 15 ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium cursor-help" title={item.spamFlags.join(", ")}>
                          {item.spamScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <div
                        className={`text-gray-600 text-xs cursor-pointer ${expandedId === item.id ? "" : "max-w-[200px] truncate"}`}
                        title={expandedId !== item.id ? item.message : undefined}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        {item.message || "-"}
                      </div>
                      {item.adminNote && (
                        <div className="mt-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                          Note: {item.adminNote}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex gap-1">
                          {item.status === "new" && (
                            <button onClick={() => handleStatus(item.id, "read")} className="text-yellow-600 hover:text-yellow-800 text-[10px] font-medium">Read</button>
                          )}
                          {item.status !== "replied" && (
                            <button onClick={() => handleStatus(item.id, "replied")} className="text-green-600 hover:text-green-800 text-[10px] font-medium">Replied</button>
                          )}
                          <button
                            onClick={() => { setEditId(editId === item.id ? null : item.id); setEditNote(item.adminNote || ""); }}
                            className="text-blue-500 hover:text-blue-700 text-[10px] font-medium"
                          >
                            Note
                          </button>
                        </div>
                        <button
                          onClick={() => deleteSingle(item.id)}
                          disabled={deleting.has(item.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                        >
                          {deleting.has(item.id) ? "..." : "Delete"}
                        </button>
                      </div>
                      {editId === item.id && (
                        <div className="mt-2 space-y-1">
                          <textarea
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                            placeholder="Admin note..."
                            rows={2}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#004D98] focus:outline-none"
                          />
                          <div className="flex gap-1">
                            <button onClick={() => handleSaveNote(item.id)} className="text-[10px] bg-[#004D98] text-white px-2 py-0.5 rounded">Save</button>
                            <button onClick={() => setEditId(null)} className="text-[10px] text-gray-500">Cancel</button>
                          </div>
                        </div>
                      )}
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
