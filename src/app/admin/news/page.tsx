"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  matchResult: string | null;
  matchDate?: string | null;
  coverImage?: string;
  author: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Slide-over state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // New article modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "chronicle",
    matchResult: "",
    matchDate: "",
    coverImage: "",
    status: "published",
  });

  // Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Debounce search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));
      params.set("pageSize", "20");
      const res = await fetch(`/api/admin/news?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setPagination(data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 });
    } catch {
      setFeedback({ type: "error", message: "Failed to load articles" });
    }
    setLoading(false);
  }, [category, debouncedSearch, page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Clear feedback after 4s
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const openSlideOver = async (article: Article) => {
    try {
      const res = await fetch(`/api/admin/news/${article.id}`);
      const detail = await res.json();
      if (detail.error) {
        setFeedback({ type: "error", message: detail.error });
        return;
      }
      setSelectedArticle(detail);
      populateForm(detail);
      setSlideOpen(true);
    } catch {
      setFeedback({ type: "error", message: "Failed to load article details" });
    }
  };

  const populateForm = (a: Article) => {
    setFormData({
      title: a.title || "",
      excerpt: a.excerpt || "",
      content: a.content || "",
      category: a.category || "chronicle",
      matchResult: a.matchResult || "",
      matchDate: a.matchDate ? a.matchDate.slice(0, 10) : "",
      coverImage: a.coverImage || "",
      status: a.status || "published",
      metaTitle: a.metaTitle || "",
      metaDescription: a.metaDescription || "",
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedArticle) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        matchResult: formData.matchResult || null,
        matchDate: formData.matchDate || null,
        coverImage: formData.coverImage,
        status: formData.status,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
      };
      const res = await fetch(`/api/admin/news/${selectedArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedArticle(data.article);
        populateForm(data.article);
        setFeedback({ type: "success", message: "Article saved" });
        fetchArticles();
      } else {
        setFeedback({ type: "error", message: data.error || "Save failed" });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to save article" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/news", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "Article deleted" });
        setSlideOpen(false);
        setSelectedArticle(null);
        setDeleteConfirm(null);
        fetchArticles();
      } else {
        setFeedback({ type: "error", message: data.error || "Delete failed" });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to delete article" });
    }
    setDeleting(false);
  };

  const handleCreate = async () => {
    if (!newForm.title.trim() || !newForm.content.trim()) {
      setFeedback({ type: "error", message: "Title and content are required" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newForm.title,
          excerpt: newForm.excerpt || newForm.title,
          content: newForm.content,
          category: newForm.category,
          matchResult: newForm.matchResult || null,
          matchDate: newForm.matchDate || null,
          coverImage: newForm.coverImage || null,
          status: newForm.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "Article created" });
        setShowNewModal(false);
        setNewForm({
          title: "",
          excerpt: "",
          content: "",
          category: "chronicle",
          matchResult: "",
          matchDate: "",
          coverImage: "",
          status: "published",
        });
        fetchArticles();
      } else {
        setFeedback({ type: "error", message: data.error || "Create failed" });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to create article" });
    }
    setCreating(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + "..." : str;

  const categoryBadge = (cat: string) => {
    if (cat === "chronicle") return "bg-blue-100 text-blue-700";
    if (cat === "digest") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  };

  const statusBadge = (s: string) => {
    if (s === "published") return "bg-green-100 text-green-700";
    if (s === "draft") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-600";
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

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-[80] px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">
          News Articles ({pagination.total})
        </h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "chronicle", label: "Chronicles" },
            { key: "digest", label: "Digests" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                category === tab.key
                  ? "bg-[#004D98] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by title or excerpt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1 min-w-[200px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-28">Category</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-28">Result</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-24">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-28">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No articles found. Click &quot;New Article&quot; to create one.
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openSlideOver(a)}
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">
                      {truncate(a.title, 60)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${categoryBadge(a.category)}`}
                      >
                        {a.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {a.matchResult || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(a.publishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSlideOver(a);
                          }}
                          className="text-[#004D98] hover:text-[#003d7a] transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {deleteConfirm === a.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(a.id);
                              }}
                              className="text-xs text-red-600 font-medium hover:text-red-800"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(null);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(a.id);
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}&ndash;
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
              {pagination.total} articles
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {getPageNumbers().map((pn, i) =>
                pn === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">
                    ...
                  </span>
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
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Article Modal */}
      {showNewModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowNewModal(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              {/* Modal header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1A1A2E]">New Article</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                  <input
                    type="text"
                    value={newForm.title}
                    onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Article title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Excerpt</label>
                  <textarea
                    value={newForm.excerpt}
                    onChange={(e) => setNewForm((p) => ({ ...p, excerpt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                    placeholder="Brief summary (defaults to title if empty)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Content *</label>
                  <textarea
                    value={newForm.content}
                    onChange={(e) => setNewForm((p) => ({ ...p, content: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y"
                    placeholder="HTML content of the article..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                    <select
                      value={newForm.category}
                      onChange={(e) => setNewForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="chronicle">Chronicle</option>
                      <option value="digest">Digest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      value={newForm.status}
                      onChange={(e) => setNewForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Match Result</label>
                    <input
                      type="text"
                      value={newForm.matchResult}
                      onChange={(e) => setNewForm((p) => ({ ...p, matchResult: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="e.g. FCB 3-1 RMA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Match Date</label>
                    <input
                      type="date"
                      value={newForm.matchDate}
                      onChange={(e) => setNewForm((p) => ({ ...p, matchDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={newForm.coverImage}
                    onChange={(e) => setNewForm((p) => ({ ...p, coverImage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="/images/packages/camp-nou-match.jpg"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {creating ? "Creating..." : "Create Article"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide-over panel */}
      {slideOpen && selectedArticle && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setSlideOpen(false);
              setDeleteConfirm(null);
            }}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#1A1A2E] truncate">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${categoryBadge(selectedArticle.category)}`}
                  >
                    {selectedArticle.category}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(selectedArticle.status)}`}
                  >
                    {selectedArticle.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(selectedArticle.publishedAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSlideOpen(false);
                  setDeleteConfirm(null);
                }}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* View on site link */}
            <div className="px-6 py-2 border-b bg-gray-50">
              <a
                href={`/news/${selectedArticle.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#004D98] hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View on public site
              </a>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt || ""}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
                <textarea
                  value={formData.content || ""}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    value={formData.category || "chronicle"}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="chronicle">Chronicle</option>
                    <option value="digest">Digest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={formData.status || "published"}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Match Result</label>
                  <input
                    type="text"
                    value={formData.matchResult || ""}
                    onChange={(e) => updateField("matchResult", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g. FCB 3-1 RMA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Match Date</label>
                  <input
                    type="date"
                    value={formData.matchDate || ""}
                    onChange={(e) => updateField("matchDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={formData.coverImage || ""}
                  onChange={(e) => updateField("coverImage", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="/images/packages/camp-nou-match.jpg"
                />
              </div>

              {/* SEO fields */}
              <div className="pt-2 border-t">
                <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                  SEO
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle || ""}
                      onChange={(e) => updateField("metaTitle", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="SEO title (max 70 chars)"
                      maxLength={70}
                    />
                    <span className="text-xs text-gray-400">
                      {(formData.metaTitle || "").length}/70
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.metaDescription || ""}
                      onChange={(e) => updateField("metaDescription", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                      placeholder="SEO description (max 160 chars)"
                      maxLength={160}
                    />
                    <span className="text-xs text-gray-400">
                      {(formData.metaDescription || "").length}/160
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-[#004D98] text-white rounded-lg hover:bg-[#003d7a] disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {deleteConfirm === selectedArticle.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(selectedArticle.id)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(selectedArticle.id)}
                  className="w-full px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Delete Article
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
