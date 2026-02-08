'use client';

import { useState } from 'react';

interface SettingFormProps {
  settingKey: string;
  placeholder: string;
  inputType?: string;
  successMessage?: string;
}

export default function SettingForm({ settingKey, placeholder, inputType = 'text', successMessage = 'Saved successfully.' }: SettingFormProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setStatus('saving');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value: value.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setStatus('success');
      setMessage(successMessage);
      setValue('');
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#004D98] focus:outline-none focus:ring-1 focus:ring-[#004D98]"
      />
      <button
        type="submit"
        disabled={!value.trim() || status === 'saving'}
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
