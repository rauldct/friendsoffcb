'use client';

import { useState } from 'react';

export default function AdminBackupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBackup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Backup failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : `friendsofbarca-backup.sql`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      setSuccess(`Backup downloaded successfully (${sizeMB} MB)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Database Backup</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-[#1A1A2E] mb-2">PostgreSQL Backup</h2>
          <p className="text-sm text-gray-500">
            Download a complete backup of the friendsofbarca database. The backup includes all tables, data, and schema definitions in SQL format.
          </p>
        </div>

        <button
          onClick={handleBackup}
          disabled={loading}
          className="bg-[#004D98] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#003a75] disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Creating backup...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Backup
            </>
          )}
        </button>

        {success && <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}
        {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      </div>

      <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500 space-y-2">
        <p><strong>Restore instructions:</strong></p>
        <code className="block bg-white p-3 rounded-lg text-xs font-mono">
          psql -U friendsofbarca -d friendsofbarca &lt; backup-file.sql
        </code>
      </div>
    </div>
  );
}
