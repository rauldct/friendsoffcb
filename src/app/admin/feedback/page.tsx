'use client';

import { useState, useEffect, useCallback } from 'react';

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
  general: 'General',
  travel: 'Travel & Trips',
  promotion: 'Promotions',
  suggestion: 'Suggestion',
  bug: 'Bug Report',
  partnership: 'Partnership',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-green-100 text-green-700',
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      setItems(data.feedback || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatus = async (id: string, status: string) => {
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  const handleSaveNote = async (id: string) => {
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, adminNote: editNote }),
    });
    setEditId(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    await fetch(`/api/admin/feedback?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Feedback</h1>
        <span className="text-sm text-gray-500">{items.length} message{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          No feedback received yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {item.name || 'Anonymous'} &lt;{item.email}&gt;
                  </p>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.message}</p>

                {/* Admin note */}
                {editId === item.id ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Admin note..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveNote(item.id)} className="text-xs bg-[#004D98] text-white px-3 py-1 rounded-lg">Save</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-500">Cancel</button>
                    </div>
                  </div>
                ) : item.adminNote ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <span className="font-medium">Note:</span> {item.adminNote}
                    <button onClick={() => { setEditId(item.id); setEditNote(item.adminNote || ''); }} className="ml-2 text-blue-600 underline text-xs">Edit</button>
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  {item.status === 'new' && (
                    <button onClick={() => handleStatus(item.id, 'read')} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200">Mark Read</button>
                  )}
                  {item.status !== 'replied' && (
                    <button onClick={() => handleStatus(item.id, 'replied')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200">Mark Replied</button>
                  )}
                  {!item.adminNote && editId !== item.id && (
                    <button onClick={() => { setEditId(item.id); setEditNote(''); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200">Add Note</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
