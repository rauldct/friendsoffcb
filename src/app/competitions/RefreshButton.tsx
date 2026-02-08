'use client';

import { useState } from 'react';

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/competitions/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: 'Data refreshed! Reloading...' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult({
          type: 'error',
          message: data.errors?.join(', ') || data.error || 'Failed to refresh.',
        });
      }
    } catch {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#004D98] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#003a75] disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Refreshing... (this takes ~30s)
          </>
        ) : (
          <>&#128260; Refresh Competition Data</>
        )}
      </button>
      {result && (
        <p className={`text-sm mt-2 ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
