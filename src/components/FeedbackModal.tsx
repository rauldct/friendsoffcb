'use client';

import { useState } from 'react';

const FEEDBACK_TYPES = [
  { value: 'general', label: 'General Feedback' },
  { value: 'travel', label: 'Travel & Trips' },
  { value: 'promotion', label: 'Promotions & Offers' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug', label: 'Report a Problem' },
  { value: 'partnership', label: 'Partnership / Business' },
];

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, type, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-5xl mb-4">&#10003;</div>
          <h3 className="text-xl font-heading font-bold text-[#1A1A2E] mb-2">Thank you!</h3>
          <p className="text-gray-500 mb-6">Your feedback has been received. We appreciate you taking the time to write to us.</p>
          <button onClick={onClose} className="bg-[#004D98] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#003a75] transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-heading font-bold text-[#1A1A2E]">Send us Feedback</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none"
            >
              {FEEDBACK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[#004D98] text-white py-2.5 rounded-lg font-medium hover:bg-[#003a75] disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
