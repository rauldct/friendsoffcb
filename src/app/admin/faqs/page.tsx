"use client";

import { useState, useEffect, useCallback } from "react";

interface Faq {
  id: string;
  question: string;
  questionEs: string | null;
  answer: string;
  answerEs: string | null;
  sortOrder: number;
  active: boolean;
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    question: "",
    questionEs: "",
    answer: "",
    answerEs: "",
    sortOrder: 0,
    active: true,
  });

  const fetchFaqs = useCallback(async () => {
    const res = await fetch("/api/admin/faqs");
    const data = await res.json();
    setFaqs(data.faqs || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const resetForm = () => {
    setForm({ question: "", questionEs: "", answer: "", answerEs: "", sortOrder: 0, active: true });
    setEditing(null);
    setCreating(false);
  };

  const openEdit = (faq: Faq) => {
    setCreating(false);
    setEditing(faq);
    setForm({
      question: faq.question,
      questionEs: faq.questionEs || "",
      answer: faq.answer,
      answerEs: faq.answerEs || "",
      sortOrder: faq.sortOrder,
      active: faq.active,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm({
      question: "",
      questionEs: "",
      answer: "",
      answerEs: "",
      sortOrder: faqs.length > 0 ? Math.max(...faqs.map((f) => f.sortOrder)) + 1 : 1,
      active: true,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await fetch("/api/admin/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form, questionEs: form.questionEs || null, answerEs: form.answerEs || null }),
      });
    } else {
      await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, questionEs: form.questionEs || null, answerEs: form.answerEs || null }),
      });
    }
    setSaving(false);
    resetForm();
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await fetch(`/api/admin/faqs?id=${id}`, { method: "DELETE" });
    fetchFaqs();
  };

  const toggleActive = async (faq: Faq) => {
    await fetch("/api/admin/faqs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: faq.id, active: !faq.active }),
    });
    fetchFaqs();
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  const isFormOpen = editing || creating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">
          FAQ Management
          <span className="ml-2 text-sm font-normal text-gray-400">({faqs.length})</span>
        </h1>
        {!isFormOpen && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#004D98] text-white text-sm font-medium rounded-lg hover:bg-[#003d7a] transition-colors"
          >
            + Add FAQ
          </button>
        )}
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-heading font-bold text-[#1A1A2E]">
            {editing ? "Edit FAQ" : "New FAQ"}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Question (EN) *</label>
              <input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#004D98]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pregunta (ES)</label>
              <input
                value={form.questionEs}
                onChange={(e) => setForm({ ...form, questionEs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#004D98]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Answer (EN) *</label>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#004D98]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Respuesta (ES)</label>
              <textarea
                value={form.answerEs}
                onChange={(e) => setForm({ ...form, answerEs: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#004D98]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#004D98]"
              />
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.question || !form.answer}
              className="px-5 py-2 bg-[#004D98] text-white text-sm font-medium rounded-lg hover:bg-[#003d7a] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="divide-y divide-gray-50">
          {faqs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No FAQs yet</div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className={`px-5 py-4 ${!faq.active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{faq.sortOrder}
                      </span>
                      {!faq.active && (
                        <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-[#1A1A2E] text-sm">{faq.question}</p>
                    {faq.questionEs && (
                      <p className="text-xs text-gray-400 mt-0.5">{faq.questionEs}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(faq)}
                      className={`p-2 rounded-lg text-xs ${faq.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"} transition-colors`}
                      title={faq.active ? "Hide" : "Show"}
                    >
                      {faq.active ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(faq)}
                      className="p-2 rounded-lg text-[#004D98] hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
