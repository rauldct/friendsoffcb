'use client';

import { useState } from 'react';

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setStatus('saving');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ANTHROPIC_API_KEY', value: apiKey.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setStatus('success');
      setMessage('API key updated successfully. It will take effect on the next upload.');
      setApiKey('');
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-ant-api03-..."
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#004D98] focus:outline-none focus:ring-1 focus:ring-[#004D98]"
      />
      <button
        type="submit"
        disabled={!apiKey.trim() || status === 'saving'}
        className="rounded-lg bg-[#004D98] px-4 py-2 text-sm font-medium text-white hover:bg-[#003a75] disabled:opacity-50"
      >
        {status === 'saving' ? 'Saving...' : 'Update'}
      </button>
      {message && (
        <span className={`self-center text-xs ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </span>
      )}
    </form>
  );
}
