'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showRestoreUpload, setShowRestoreUpload] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backup');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const showMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 8000);
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showMsg(`Backup created: ${data.filename} (${formatSize(data.size)})`, 'success');
        fetchBackups();
      } else {
        showMsg(data.error || 'Backup failed', 'error');
      }
    } catch {
      showMsg('Network error', 'error');
    }
    setCreating(false);
  };

  const handleDownload = async (filename: string) => {
    try {
      const res = await fetch(`/api/admin/backup?action=download&filename=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showMsg('Download failed', 'error');
    }
  };

  const handleRestore = async (filename: string) => {
    setRestoring(filename);
    setConfirmRestore(null);
    try {
      const formData = new FormData();
      formData.append('action', 'restore');
      formData.append('filename', filename);
      const res = await fetch('/api/admin/backup', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showMsg(data.message || 'Database restored successfully', 'success');
        fetchBackups();
      } else {
        showMsg(data.error || 'Restore failed', 'error');
      }
    } catch {
      showMsg('Restore failed', 'error');
    }
    setRestoring(null);
  };

  const handleRestoreUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setRestoring('upload');
    try {
      const formData = new FormData();
      formData.append('action', 'restore');
      formData.append('file', file);
      const res = await fetch('/api/admin/backup', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showMsg(data.message || 'Database restored from uploaded file', 'success');
        fetchBackups();
        setShowRestoreUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showMsg(data.error || 'Restore failed', 'error');
      }
    } catch {
      showMsg('Restore failed', 'error');
    }
    setRestoring(null);
  };

  const handleDelete = async (filename: string) => {
    setDeleting(filename);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/backup?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showMsg('Backup deleted', 'success');
        fetchBackups();
      } else {
        showMsg(data.error || 'Delete failed', 'error');
      }
    } catch {
      showMsg('Delete failed', 'error');
    }
    setDeleting(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Database Backup</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRestoreUpload(!showRestoreUpload)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors"
          >
            Restore from File
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-[#004D98] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#003a75] disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
          >
            {creating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Restore from file upload */}
      {showRestoreUpload && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <h3 className="font-bold text-orange-800 mb-2">Restore from Upload</h3>
          <p className="text-sm text-orange-700 mb-3">
            Upload a .sql backup file to restore the database. A pre-restore backup will be created automatically.
          </p>
          <form onSubmit={handleRestoreUpload} className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql"
              className="flex-1 text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
            />
            <button
              type="submit"
              disabled={restoring === 'upload'}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {restoring === 'upload' ? 'Restoring...' : 'Restore'}
            </button>
          </form>
        </div>
      )}

      {/* Backups list */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Saved Backups ({backups.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No backups yet. Click &quot;Create Backup&quot; to create your first backup.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {backups.map((backup) => (
              <div key={backup.filename} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <span className="text-sm font-medium text-[#1A1A2E] truncate">{backup.filename}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-6 text-xs text-gray-400">
                    <span>{formatSize(backup.size)}</span>
                    <span>{new Date(backup.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(backup.filename)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                    title="Download"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setConfirmRestore(backup.filename)}
                    disabled={restoring !== null}
                    className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200 transition-colors disabled:opacity-50"
                    title="Restore"
                  >
                    {restoring === backup.filename ? 'Restoring...' : 'Restore'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(backup.filename)}
                    disabled={deleting === backup.filename}
                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === backup.filename ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500 space-y-2">
        <p><strong>Notes:</strong></p>
        <ul className="list-disc ml-5 space-y-1 text-xs">
          <li>Backups are stored on the server at <code className="bg-white px-1 py-0.5 rounded text-xs">/var/www/friendsofbarca/backups/</code></li>
          <li>A pre-restore backup is automatically created before any restore operation</li>
          <li>Backup format: PostgreSQL plain SQL (compatible with <code className="bg-white px-1 py-0.5 rounded text-xs">psql</code>)</li>
          <li>After restoring, you may need to restart the application for changes to take full effect</li>
        </ul>
      </div>

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmRestore(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-[#1A1A2E]">Restore Database</h3>
                <p className="text-sm text-gray-500">This action will replace all current data</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to restore the database from:
            </p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded-lg mb-4 break-all">{confirmRestore}</p>
            <p className="text-xs text-gray-400 mb-5">A pre-restore backup will be created automatically before restoring.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                disabled={restoring !== null}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {restoring ? 'Restoring...' : 'Yes, Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-[#1A1A2E]">Delete Backup</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to permanently delete this backup?
            </p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded-lg mb-5 break-all">{confirmDelete}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting !== null}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
