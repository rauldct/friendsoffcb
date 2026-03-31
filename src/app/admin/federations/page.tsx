"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

interface Federation {
  id: string;
  name: string;
  abbreviation: string | null;
  regions: string[];
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  president: string | null;
  description: string | null;
  memberCount: number | null;
  zone: string | null;
  socialMedia: Record<string, string> | null;
  scrapedData: Record<string, unknown> | null;
  lastScrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFederationsPage() {
  const [federations, setFederations] = useState<Federation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Federation | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Federation>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedFederations = useMemo(() => {
    return [...federations].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "abbreviation") return (a.abbreviation || "").localeCompare(b.abbreviation || "") * dir;
      if (sortBy === "regions") return a.regions.join(", ").localeCompare(b.regions.join(", ")) * dir;
      if (sortBy === "zone") return (a.zone || "").localeCompare(b.zone || "") * dir;
      if (sortBy === "lastScrapedAt") {
        const da = a.lastScrapedAt ? new Date(a.lastScrapedAt).getTime() : 0;
        const db = b.lastScrapedAt ? new Date(b.lastScrapedAt).getTime() : 0;
        return (da - db) * dir;
      }
      return 0;
    });
  }, [federations, sortBy, sortOrder]);

  const fetchFederations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/federations");
      const data = await res.json();
      setFederations(data.federations || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load federations" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFederations();
  }, [fetchFederations]);

  const handleAdd = () => {
    setSelected(null);
    setEditing(true);
    setAdding(true);
    setEditForm({
      name: "",
      abbreviation: null,
      website: null,
      email: null,
      phone: null,
      address: null,
      president: null,
      description: null,
      memberCount: null,
      zone: null,
    });
  };

  const handleCreate = async () => {
    if (!editForm.name) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/federations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Federation created" });
        setEditing(false);
        setAdding(false);
        fetchFederations();
      } else {
        setMessage({ type: "error", text: data.error || "Create failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Create request failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleScrape = async (fed: Federation) => {
    setScraping(fed.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/federations/${fed.id}/scrape`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        const s = data.scrapedData;
        setMessage({
          type: "success",
          text: `Scraped ${fed.abbreviation || fed.name}: ${s.penyaNamesFound} peña names found, ${s.subPagesScraped} subpages`,
        });
        fetchFederations();
        if (selected?.id === fed.id && data.federation) {
          setSelected(data.federation);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Scrape failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Scrape request failed" });
    } finally {
      setScraping(null);
    }
  };

  const handleEdit = (fed: Federation) => {
    setSelected(fed);
    setEditing(true);
    setEditForm({
      name: fed.name,
      abbreviation: fed.abbreviation,
      website: fed.website,
      email: fed.email,
      phone: fed.phone,
      address: fed.address,
      president: fed.president,
      description: fed.description,
      memberCount: fed.memberCount,
      zone: fed.zone,
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/federations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Federation updated" });
        setEditing(false);
        setSelected(data.federation);
        fetchFederations();
      } else {
        setMessage({ type: "error", text: data.error || "Update failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Update request failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fed: Federation) => {
    if (!confirm(`Delete "${fed.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/federations/${fed.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Federation deleted" });
        if (selected?.id === fed.id) {
          setSelected(null);
          setEditing(false);
        }
        fetchFederations();
      }
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="mt-3 text-gray-500">Loading federations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              Federaciones de Peñas
            </h1>
            <p className="text-gray-500 mt-1">
              {federations.length} federaciones registradas
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] transition-colors text-sm font-medium"
          >
            + Add Federation
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-lg leading-none opacity-60 hover:opacity-100"
          >
            x
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Table */}
        <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${selected ? "flex-1" : "w-full"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
                      {sortBy === "name" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("abbreviation")}>
                    <div className="flex items-center gap-1">
                      Abbr
                      {sortBy === "abbreviation" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("regions")}>
                    <div className="flex items-center gap-1">
                      Regions
                      {sortBy === "regions" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Web</th>
                  <th className="px-4 py-3 text-center cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("zone")}>
                    <div className="flex items-center justify-center gap-1">
                      Zone
                      {sortBy === "zone" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("lastScrapedAt")}>
                    <div className="flex items-center justify-center gap-1">
                      Last Scraped
                      {sortBy === "lastScrapedAt" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedFederations.map((fed) => (
                  <tr
                    key={fed.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selected?.id === fed.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => { setSelected(fed); setEditing(false); }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {fed.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {fed.abbreviation || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                      {fed.regions.join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {fed.website ? (
                        <a
                          href={fed.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline truncate block max-w-[150px]"
                        >
                          {new URL(fed.website).hostname}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">
                      {fed.zone || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {formatDate(fed.lastScrapedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {fed.website && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScrape(fed);
                            }}
                            disabled={scraping === fed.id}
                            className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:opacity-50 transition-colors"
                            title="Scrape website"
                          >
                            {scraping === fed.id ? "..." : "Scrape"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(fed);
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(fed);
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {federations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No federations yet. Click "+ Add Federation" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail / Edit Panel */}
        {(selected || adding) && (
          <div className="w-96 shrink-0 bg-white rounded-xl shadow-sm p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900 leading-tight">
                {adding ? "New Federation" : editing ? "Edit Federation" : selected?.abbreviation || selected?.name}
              </h2>
              <button
                onClick={() => { setSelected(null); setEditing(false); setAdding(false); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                x
              </button>
            </div>

            {(editing || adding) ? (
              <div className="space-y-3">
                {(
                  [
                    { key: "name", label: "Name", type: "text" },
                    { key: "abbreviation", label: "Abbreviation", type: "text" },
                    { key: "website", label: "Website", type: "url" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "phone", label: "Phone", type: "text" },
                    { key: "address", label: "Address", type: "text" },
                    { key: "president", label: "President", type: "text" },
                    { key: "zone", label: "Zone", type: "text" },
                    { key: "memberCount", label: "Member Count", type: "number" },
                  ] as const
                ).map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={(editForm[field.key] as string | number) ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          [field.key]: field.type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={(editForm.description as string) ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={adding ? handleCreate : handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {saving ? "Saving..." : adding ? "Create" : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setAdding(false); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selected ? (
              <div className="space-y-3 text-sm">
                <InfoRow label="Name" value={selected.name} />
                <InfoRow label="Abbreviation" value={selected.abbreviation} />
                <InfoRow label="Regions" value={selected.regions.join(", ")} />
                <InfoRow label="Zone" value={selected.zone} />
                {selected.website && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Website</span>
                    <div>
                      <a
                        href={selected.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {selected.website}
                      </a>
                    </div>
                  </div>
                )}
                <InfoRow label="Email" value={selected.email} />
                <InfoRow label="Phone" value={selected.phone} />
                <InfoRow label="Address" value={selected.address} />
                <InfoRow label="President" value={selected.president} />
                <InfoRow
                  label="Members"
                  value={selected.memberCount?.toString()}
                />
                <InfoRow label="Description" value={selected.description} />
                <InfoRow label="Last Scraped" value={formatDate(selected.lastScrapedAt)} />

                {selected.scrapedData && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Scraped Data
                    </span>
                    <div className="mt-1 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-48 overflow-y-auto">
                      {(() => {
                        const sd = selected.scrapedData as Record<string, unknown>;
                        const names = (sd.extractedPenyaNames as string[]) || [];
                        return (
                          <>
                            {names.length > 0 && (
                              <div className="mb-2">
                                <strong>Peña names found ({names.length}):</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {names.slice(0, 20).map((n, i) => (
                                    <li key={i}>{n}</li>
                                  ))}
                                  {names.length > 20 && (
                                    <li className="text-gray-400">
                                      ...and {names.length - 20} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                            <div>
                              <strong>Raw data keys:</strong>{" "}
                              {Object.keys(sd).join(", ")}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => handleEdit(selected)}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                  >
                    Edit Federation
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
