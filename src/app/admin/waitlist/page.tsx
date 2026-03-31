"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface WaitlistEntry {
  id: string;
  email: string;
  country: string | null;
  ip: string | null;
  userAgent: string | null;
  geoCity: string | null;
  geoRegion: string | null;
  geoCountry: string | null;
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

function getSpamInfo(entry: WaitlistEntry, allEntries: WaitlistEntry[]): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  const email = entry.email.toLowerCase();
  const domain = email.split("@")[1] || "";
  const local = email.split("@")[0] || "";

  if (DISPOSABLE_DOMAINS.has(domain)) { flags.push("Disposable"); score += 40; }
  if (domain === "gmail.com" && (local.match(/\./g) || []).length >= 3) {
    flags.push("Gmail dot abuse"); score += 35;
  }
  if (/[^aeiou\d@._ -]{6,}/i.test(local)) { flags.push("Random chars"); score += 20; }
  if (local.length > 40) { flags.push("Long email"); score += 15; }

  // Duplicate email
  const sameEmail = allEntries.filter(e => e.email.toLowerCase() === email);
  if (sameEmail.length > 1) { flags.push(`Dup x${sameEmail.length}`); score += 10; }

  return { score: Math.min(score, 100), flags };
}

function parseDevice(ua: string | null): string {
  if (!ua) return "-";
  if (/iPhone/.test(ua)) {
    const m = ua.match(/iPhone OS (\d+)/);
    return `iPhone (iOS ${m?.[1] || "?"})`;
  }
  if (/iPad/.test(ua)) {
    const m = ua.match(/OS (\d+)/);
    return `iPad (iOS ${m?.[1] || "?"})`;
  }
  if (/Android/.test(ua)) {
    const ver = ua.match(/Android (\d+[\d.]*)/)?.[1] || "?";
    const model = ua.match(/; ([^;)]+)\) AppleWebKit/)?.[1]?.replace(/Build.*/, "").trim();
    return model ? `${model} (Android ${ver})` : `Android ${ver}`;
  }
  if (/Macintosh/.test(ua)) {
    const ver = ua.match(/Mac OS X (\d+[_.\d]*)/)?.[1]?.replace(/_/g, ".") || "?";
    return `Mac (${ver})`;
  }
  if (/Windows NT (\d+\.\d+)/.test(ua)) {
    const ntVer = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    const winMap: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    return `Windows ${winMap[ntVer || ""] || ntVer}`;
  }
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "";
}

function formatGeo(entry: WaitlistEntry): string {
  const parts = [entry.geoCity, entry.geoRegion, entry.geoCountry].filter(Boolean);
  return parts.join(", ") || "-";
}

type FilterMode = "all" | "spam";

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortBy, setSortBy] = useState<"email" | "country" | "source" | "spamScore" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedUA, setExpandedUA] = useState<string | null>(null);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/waitlist");
      const data = await res.json();
      setEntries(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const deleteSingle = async (id: string) => {
    if (!confirm("Remove this email from the waitlist?")) return;
    setDeleting(prev => new Set(prev).add(id));
    const res = await fetch("/api/admin/waitlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    setDeleting(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} waitlist entry${selected.size > 1 ? "ies" : "y"}? This cannot be undone.`)) return;
    const ids = [...selected];
    setDeleting(new Set(ids));
    let ok = 0;
    for (const id of ids) {
      const res = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) ok++;
    }
    setEntries(prev => prev.filter(e => !selected.has(e.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${ok} of ${ids.length} entries.`);
  };

  const deleteAllSpam = async () => {
    const spamIds = enriched.filter(e => e.spamScore >= 30).map(e => e.id);
    if (spamIds.length === 0) { alert("No spam entries detected."); return; }
    if (!confirm(`Delete ${spamIds.length} suspected spam entries?`)) return;
    setDeleting(new Set(spamIds));
    let ok = 0;
    for (const id of spamIds) {
      const res = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) ok++;
    }
    setEntries(prev => prev.filter(e => !spamIds.includes(e.id)));
    setSelected(new Set());
    setDeleting(new Set());
    alert(`Deleted ${ok} spam entries.`);
  };

  const handleExport = () => {
    const csv = "Email,Country,IP,GeoLocation,Device,Browser,Source,Date\n" + entries.map(e =>
      [
        e.email,
        e.country || "",
        e.ip || "",
        formatGeo(e),
        parseDevice(e.userAgent),
        parseBrowser(e.userAgent),
        e.source,
        new Date(e.createdAt).toLocaleDateString(),
      ].map(v => `"${v}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Enrich with spam info
  const enriched = useMemo(() => {
    return entries.map(entry => {
      const { score, flags } = getSpamInfo(entry, entries);
      return { ...entry, spamScore: score, spamFlags: flags };
    });
  }, [entries]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = enriched;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.email.toLowerCase().includes(q) ||
        e.country?.toLowerCase().includes(q) ||
        e.source?.toLowerCase().includes(q) ||
        formatGeo(e).toLowerCase().includes(q)
      );
    }
    if (filter === "spam") list = list.filter(e => e.spamScore >= 30);

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

  const spamCount = enriched.filter(e => e.spamScore >= 30).length;
  const allSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.id)));
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
          <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Waitlist</h1>
          <div className="flex gap-3 mt-1 text-sm">
            <span className="text-gray-600 font-medium">{entries.length} total</span>
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
          {entries.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg bg-[#004D98] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#003d7a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
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
          placeholder="Search email, country, source..."
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#004D98]"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "spam"] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f === "all" ? "All" : `Spam (${spamCount})`}
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
                    {sortBy === "email" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("country")}>
                  <div className="flex items-center gap-1">
                    Country
                    {sortBy === "country" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500">GeoIP</th>
                <th className="px-3 py-3 font-medium text-gray-500">Device</th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("source")}>
                  <div className="flex items-center gap-1">
                    Source
                    {sortBy === "source" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("spamScore")}>
                  <div className="flex items-center gap-1">
                    Spam
                    {sortBy === "spamScore" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center gap-1">
                    Date
                    {sortBy === "createdAt" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">{search ? "No matches." : "No waitlist entries yet."}</td></tr>
              ) : (
                filtered.map(entry => (
                  <tr key={entry.id} className={`hover:bg-gray-50 ${entry.spamScore >= 40 ? "bg-red-50/50" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleOne(entry.id)} className="rounded" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-[#1A1A2E] text-xs max-w-[180px] truncate" title={entry.email}>{entry.email}</div>
                      {entry.ip && (
                        <div className="text-[10px] text-gray-400 font-mono">{entry.ip}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{entry.country || "-"}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{formatGeo(entry)}</td>
                    <td className="px-3 py-3">
                      <div className="text-gray-700 text-xs">{parseDevice(entry.userAgent)}</div>
                      {parseBrowser(entry.userAgent) && (
                        <div className="text-gray-400 text-[10px]">{parseBrowser(entry.userAgent)}</div>
                      )}
                      {entry.userAgent && (
                        <button
                          onClick={() => setExpandedUA(expandedUA === entry.id ? null : entry.id)}
                          className="text-[10px] text-blue-500 hover:underline mt-0.5"
                        >
                          {expandedUA === entry.id ? "Hide UA" : "Full UA"}
                        </button>
                      )}
                      {expandedUA === entry.id && entry.userAgent && (
                        <div className="text-[10px] text-gray-400 font-mono mt-1 max-w-[200px] break-all">
                          {entry.userAgent}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                        {entry.source}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {entry.spamScore >= 40 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium cursor-help" title={entry.spamFlags.join(", ")}>
                          {entry.spamScore}%
                        </span>
                      ) : entry.spamScore >= 15 ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium cursor-help" title={entry.spamFlags.join(", ")}>
                          {entry.spamScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteSingle(entry.id)}
                        disabled={deleting.has(entry.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deleting.has(entry.id) ? "..." : "Delete"}
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
