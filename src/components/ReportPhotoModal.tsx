'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface ReportPhotoModalProps {
  photoId: string;
  onClose: () => void;
}

const REASONS = [
  { value: 'inappropriate', labelKey: 'Inappropriate content' },
  { value: 'spam', labelKey: 'Spam' },
  { value: 'copyright', labelKey: 'Copyright violation' },
  { value: 'not_related', labelKey: 'Not related to Barça / Football' },
  { value: 'other', labelKey: 'Other' },
];

export default function ReportPhotoModal({ photoId, onClose }: ReportPhotoModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'already'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async () => {
    if (!reason) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/gallery/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, reason, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'already_reported') {
          setStatus('already');
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Failed to submit report.');
        }
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Failed to submit report.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">&#10003;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-sm text-gray-500 mb-4">Thank you. Our team will review this photo.</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#004D98] px-6 py-2 text-sm font-medium text-white hover:bg-[#003a75]"
            >
              Close
            </button>
          </div>
        ) : status === 'already' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">&#9888;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Already Reported</h3>
            <p className="text-sm text-gray-500 mb-4">You have already reported this photo.</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Photo</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">Why are you reporting this photo?</p>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    reason === r.value
                      ? 'border-[#004D98] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[#004D98]"
                  />
                  <span className="text-sm text-gray-700">{r.labelKey}</span>
                </label>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Additional details (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:outline-none focus:ring-1 focus:ring-[#004D98] resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>

            {status === 'error' && (
              <p className="text-sm text-red-600 mt-2">{errorMsg}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || status === 'loading'}
                className="flex-1 rounded-lg bg-[#A50044] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8a003a] disabled:opacity-50"
              >
                {status === 'loading' ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
