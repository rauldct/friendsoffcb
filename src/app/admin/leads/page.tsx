"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

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

function getSpamInfo(lead: Lead, allLeads: Lead[]): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  const email = lead.email.toLowerCase();
  const domain = email.split("@")[1] || "";
  const local = email.split("@")[0] || "";

  // Disposable domain
  if (DISPOSABLE_DOMAINS.has(domain)) { flags.push("Disposable"); score += 40; }

  // Gmail dot abuse (3+ dots)
  if (domain === "gmail.com" && (local.match(/\./g) || []).length >= 3) {
    flags.push("Gmail dot abuse"); score += 35;
  }

  // Random chars (6+ consonants)
  if (/[^aeiou\d@._ -]{6,}/i.test(local)) { flags.push("Random chars"); score += 20; }

  // Very long local
  if (local.length > 40) { flags.push("Long email"); score += 15; }

  // Bot pattern: same email submitted from package page AND contact_form
  const sameEmail = allLeads.filter(l => l.email.toLowerCase() === email);
  if (sameEmail.length > 1) {
    const sources = sameEmail.map(l => l.source);
    const hasPackage = sources.some(s => s && s.startsWith("/packages/"));
    const hasContact = sources.some(s => s === "contact_form");
    if (hasPackage && hasContact) { flags.push("Bot pattern"); score += 30; }
  }

  // Duplicate email
  if (sameEmail.length > 1) { flags.push(`Dup x${sameEmail.length}`); score += 10; }

  return { score: Math.min(score, 100), flags };
}

type FilterMode = "all" | "spam" | "contact" | "package";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortBy, setSortBy] = useState<"email" | "name" | "matchInterested" | "groupSize" | "country" | "source" | "spamScore" | "createdAt" | "message">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/leads-list");
    const data = await res.json();
    setLeads(data.leads);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const deleteSingle = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    setDeleting(prev => new Set(prev).add(id));
    const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    setDeleting(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} lead${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const ids = [...selected];
    setDeleting(new Set(ids));
    let ok = 0;
    for (const id of ids) {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
      if (res.ok) ok++;
    }
    setLeads(prev => prev.filter(l => !selected.has(l.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${ok} of ${ids.length} leads.`);
  };

  const deleteAllSpam = async () => {
    const spamIds = enriched.filter(l => l.spamScore >= 30).map(l => l.id);
    if (spamIds.length === 0) { alert("No spam leads detected."); return; }
    if (!confirm(`Delete ${spamIds.length} suspected spam leads?`)) return;
    setDeleting(new Set(spamIds));
    let ok = 0;
    for (const id of spamIds) {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
      if (res.ok) ok++;
    }
    setLeads(prev => prev.filter(l => !spamIds.includes(l.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${ok} spam leads.`);
  };

  // Enrich with spam info
  const enriched = useMemo(() => {
    return leads.map(lead => {
      const { score, flags } = getSpamInfo(lead, leads);
      return { ...lead, spamScore: score, spamFlags: flags };
    });
  }, [leads]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = enriched;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.email.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q) ||
        l.country?.toLowerCase().includes(q) ||
        l.message?.toLowerCase().includes(q)
      );
    }
    if (filter === "spam") list = list.filter(l => l.spamScore >= 30);
    if (filter === "contact") list = list.filter(l => l.source === "contact_form");
    if (filter === "package") list = list.filter(l => l.source.startsWith("/packages/"));

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

  const spamCount = enriched.filter(l => l.spamScore >= 30).length;
  const allSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
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
          <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Leads</h1>
          <div className="flex gap-3 mt-1 text-sm">
            <span className="text-gray-600 font-medium">{leads.length} total</span>
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
          placeholder="Search email, name, country..."
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#004D98]"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "spam", "contact", "package"] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f === "all" ? "All" : f === "spam" ? `Spam (${spamCount})` : f === "contact" ? "Contact" : "Package"}
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
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("matchInterested")}>
                  <div className="flex items-center gap-1">
                    Match
                    {sortBy === "matchInterested" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("groupSize")}>
                  <div className="flex items-center gap-1">
                    Grp
                    {sortBy === "groupSize" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("country")}>
                  <div className="flex items-center gap-1">
                    Country
                    {sortBy === "country" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("source")}>
                  <div className="flex items-center gap-1">
                    Source
                    {sortBy === "source" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "▲" : "▼"}</span> : <span className="text-gray-300">▲▼</span>}
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
                <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">{search ? "No matches." : "No leads yet."}</td></tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className={`hover:bg-gray-50 ${lead.spamScore >= 40 ? "bg-red-50/50" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleOne(lead.id)} className="rounded" />
                    </td>
                    <td className="px-3 py-3 font-medium text-[#1A1A2E] text-xs max-w-[180px] truncate" title={lead.email}>{lead.email}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{lead.name || "-"}</td>
                    <td className="px-3 py-3">
                      {lead.matchInterested ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded truncate max-w-[120px] inline-block" title={lead.matchInterested}>
                          {lead.matchInterested.replace("/packages/", "").slice(0, 20)}
                        </span>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs text-center">{lead.groupSize || "-"}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{lead.country || "-"}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${lead.source === "contact_form" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                        {lead.source === "contact_form" ? "Contact" : lead.source.startsWith("/packages/") ? "Package" : lead.source}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {lead.spamScore >= 40 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium cursor-help" title={lead.spamFlags.join(", ")}>
                          {lead.spamScore}%
                        </span>
                      ) : lead.spamScore >= 15 ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium cursor-help" title={lead.spamFlags.join(", ")}>
                          {lead.spamScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs max-w-[150px] truncate" title={lead.message || ""}>{lead.message || "-"}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteSingle(lead.id)}
                        disabled={deleting.has(lead.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deleting.has(lead.id) ? "..." : "Delete"}
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
