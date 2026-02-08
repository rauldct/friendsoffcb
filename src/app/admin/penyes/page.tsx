"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  tiktok?: string;
}

interface Penya {
  id: string;
  name: string;
  city: string;
  province: string;
  country: string;
  region: string;
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: SocialMedia | null;
  president: string | null;
  foundedYear: number | null;
  memberCount: number | null;
  description: string | null;
  notes: string | null;
  websiteValidation: string | null;
  scrapedContent: unknown;
  enrichmentStatus: string;
  detailsUpdatedAt: string | null;
}

interface Counts {
  total: number;
  cataluna: number;
  spain: number;
  world: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalPages: number;
}

export default function AdminPenyesPage() {
  const [penyes, setPenyes] = useState<Penya[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, cataluna: 0, spain: 0, world: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 25, totalFiltered: 0, totalPages: 0 });
  const [region, setRegion] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Slide-over state
  const [selectedPenya, setSelectedPenya] = useState<Penya | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [enriching, setEnriching] = useState<string | null>(null); // penya id being enriched
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Debounce search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [region]);
  useEffect(() => { setPage(1); }, [pageSize]);

  const fetchPenyes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (region !== "all") params.set("region", region);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const res = await fetch(`/api/admin/penyes?${params}`);
    const data = await res.json();
    setPenyes(data.penyes);
    setCounts(data.counts);
    setPagination(data.pagination);
    setLastSync(data.lastSync);
    setLoading(false);
  }, [region, debouncedSearch, page, pageSize]);

  useEffect(() => { fetchPenyes(); }, [fetchPenyes]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("/api/admin/penyes", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Synced ${data.total} penyes (Cat: ${data.cataluna}, Spain: ${data.spain}, World: ${data.world})`);
        setPage(1);
        fetchPenyes();
      } else {
        setSyncResult(`Error: ${data.error}`);
      }
    } catch {
      setSyncResult("Error connecting to server");
    }
    setSyncing(false);
  };

  const handleEnrich = async (penyaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEnriching(penyaId);
    try {
      const res = await fetch(`/api/admin/penyes/${penyaId}/enrich`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Refresh the list to update status dot
        await fetchPenyes();
        // If this penya is currently open in the slide-over, refresh it
        if (selectedPenya?.id === penyaId) {
          const detailRes = await fetch(`/api/admin/penyes/${penyaId}`);
          const detail = await detailRes.json();
          setSelectedPenya(detail);
          populateForm(detail);
        }
      }
    } catch {
      // silently fail, the status dot will show "failed"
    }
    setEnriching(null);
  };

  const openSlideOver = async (penya: Penya) => {
    // Fetch full details
    const res = await fetch(`/api/admin/penyes/${penya.id}`);
    const detail = await res.json();
    setSelectedPenya(detail);
    populateForm(detail);
    setSlideOpen(true);
  };

  const populateForm = (p: Penya) => {
    const sm = p.socialMedia || {};
    setFormData({
      address: p.address || "",
      postalCode: p.postalCode || "",
      email: p.email || "",
      phone: p.phone || "",
      website: p.website || "",
      president: p.president || "",
      foundedYear: p.foundedYear?.toString() || "",
      memberCount: p.memberCount?.toString() || "",
      description: p.description || "",
      notes: p.notes || "",
      facebook: sm.facebook || "",
      twitter: sm.twitter || "",
      instagram: sm.instagram || "",
      tiktok: sm.tiktok || "",
    });
  };

  const handleSave = async () => {
    if (!selectedPenya) return;
    setSaving(true);
    try {
      const body = {
        address: formData.address || null,
        postalCode: formData.postalCode || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        president: formData.president || null,
        foundedYear: formData.foundedYear ? Number(formData.foundedYear) : null,
        memberCount: formData.memberCount ? Number(formData.memberCount) : null,
        description: formData.description || null,
        notes: formData.notes || null,
        socialMedia: {
          facebook: formData.facebook || null,
          twitter: formData.twitter || null,
          instagram: formData.instagram || null,
          tiktok: formData.tiktok || null,
        },
      };
      const res = await fetch(`/api/admin/penyes/${selectedPenya.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setSelectedPenya(updated);
      populateForm(updated);
      await fetchPenyes();
    } catch {
      // handle error silently
    }
    setSaving(false);
  };

  const regionLabel = (r: string) => {
    if (r === "cataluna") return "Catalunya";
    if (r === "spain") return "Spain";
    if (r === "world") return "World";
    return r;
  };

  const regionBadge = (r: string) => {
    if (r === "cataluna") return "bg-red-100 text-red-700";
    if (r === "spain") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  const statusDot = (status: string) => {
    if (status === "enriched") return "bg-green-500";
    if (status === "manual") return "bg-blue-500";
    if (status === "failed") return "bg-red-500";
    return "bg-gray-300";
  };

  const statusLabel = (status: string) => {
    if (status === "enriched") return "AI enriched";
    if (status === "manual") return "Manually edited";
    if (status === "failed") return "Enrichment failed";
    return "Pending";
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages: (number | "...")[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">
          Peñas FCBarcelona ({counts.total})
        </h1>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-xs text-gray-500">
              Last sync: {formatDate(lastSync)}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {syncing ? "Syncing..." : "Sync from FCB"}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`p-3 rounded-lg text-sm ${syncResult.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {syncResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "bg-gray-100" },
          { label: "Catalunya", value: counts.cataluna, color: "bg-red-50" },
          { label: "Spain", value: counts.spain, color: "bg-yellow-50" },
          { label: "World", value: counts.world, color: "bg-blue-50" },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
            <div className="text-2xl font-bold text-[#1A1A2E]">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All regions</option>
          <option value="cataluna">Catalunya</option>
          <option value="spain">Spain</option>
          <option value="world">World</option>
        </select>
        <input
          type="text"
          placeholder="Search by name, city, country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1 min-w-[200px]"
        />
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-3 font-medium text-gray-500 w-12"></th>
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">City</th>
                <th className="px-4 py-3 font-medium text-gray-500">Province</th>
                <th className="px-4 py-3 font-medium text-gray-500">Country</th>
                <th className="px-4 py-3 font-medium text-gray-500">Region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : penyes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No penyes found. Click &quot;Sync from FCB&quot; to scrape data.</td></tr>
              ) : (
                penyes.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openSlideOver(p)}
                  >
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${statusDot(p.enrichmentStatus)} inline-block`}
                        title={statusLabel(p.enrichmentStatus)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.city}</td>
                    <td className="px-4 py-3 text-gray-600">{p.province || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.country}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${regionBadge(p.region)}`}>
                        {regionLabel(p.region)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!loading && pagination.totalPages > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalFiltered)} of {pagination.totalFiltered} penyes
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {getPageNumbers().map((pn, i) =>
                pn === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">...</span>
                ) : (
                  <button
                    key={pn}
                    onClick={() => setPage(pn as number)}
                    className={`px-2 py-1 text-xs rounded border ${
                      pn === pagination.page
                        ? "bg-[#004D98] text-white border-[#004D98]"
                        : "border-gray-200 bg-white hover:bg-gray-100"
                    }`}
                  >
                    {pn}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Website Validation Modal */}
      {showValidationModal && selectedPenya?.websiteValidation && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowValidationModal(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-bold text-[#1A1A2E]">Website Validation</h3>
                </div>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 overflow-y-auto">
                {selectedPenya.website && (
                  <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500">URL: </span>
                    <a
                      href={selectedPenya.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline break-all"
                    >
                      {selectedPenya.website}
                    </a>
                  </div>
                )}
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedPenya.websiteValidation}
                </p>
              </div>
              <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide-over panel */}
      {slideOpen && selectedPenya && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSlideOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A2E]">{selectedPenya.name}</h2>
                <p className="text-sm text-gray-500">{selectedPenya.city}, {selectedPenya.country}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${statusDot(selectedPenya.enrichmentStatus)}`} />
                  <span className="text-xs text-gray-400">{statusLabel(selectedPenya.enrichmentStatus)}</span>
                  {selectedPenya.detailsUpdatedAt && (
                    <span className="text-xs text-gray-400">
                       &middot; {formatDate(selectedPenya.detailsUpdatedAt)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSlideOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* AI Enrich button */}
            <div className="px-6 py-3 border-b bg-gray-50">
              <button
                onClick={() => handleEnrich(selectedPenya.id)}
                disabled={enriching === selectedPenya.id}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                {enriching === selectedPenya.id ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search with AI
                  </>
                )}
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <input
                    type="text"
                    value={(formData.address as string) || ""}
                    onChange={e => updateField("address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={(formData.postalCode as string) || ""}
                    onChange={e => updateField("postalCode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="08001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input
                    type="text"
                    value={(formData.phone as string) || ""}
                    onChange={e => updateField("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="+34 ..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={(formData.email as string) || ""}
                    onChange={e => updateField("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="contact@penya.org"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-xs font-medium text-gray-500">Website</label>
                    {selectedPenya?.websiteValidation && (
                      <button
                        type="button"
                        onClick={() => setShowValidationModal(true)}
                        className="text-indigo-500 hover:text-indigo-700 transition-colors"
                        title="Why we think this is the peña's website"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={(formData.website as string) || ""}
                    onChange={e => updateField("website", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">President</label>
                  <input
                    type="text"
                    value={(formData.president as string) || ""}
                    onChange={e => updateField("president", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Founded Year</label>
                  <input
                    type="number"
                    value={(formData.foundedYear as string) || ""}
                    onChange={e => updateField("foundedYear", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="1990"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Member Count</label>
                  <input
                    type="number"
                    value={(formData.memberCount as string) || ""}
                    onChange={e => updateField("memberCount", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Social Media</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16">Facebook</span>
                    <input
                      type="url"
                      value={(formData.facebook as string) || ""}
                      onChange={e => updateField("facebook", e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16">Twitter/X</span>
                    <input
                      type="url"
                      value={(formData.twitter as string) || ""}
                      onChange={e => updateField("twitter", e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="https://x.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16">Instagram</span>
                    <input
                      type="url"
                      value={(formData.instagram as string) || ""}
                      onChange={e => updateField("instagram", e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16">TikTok</span>
                    <input
                      type="url"
                      value={(formData.tiktok as string) || ""}
                      onChange={e => updateField("tiktok", e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={(formData.description as string) || ""}
                  onChange={e => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                  placeholder="Brief description of the peña..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes (internal)</label>
                <textarea
                  value={(formData.notes as string) || ""}
                  onChange={e => updateField("notes", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
