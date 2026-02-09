'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

type Status = 'idle' | 'uploading' | 'success' | 'error' | 'rejected';

export default function PhotoUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFile = useCallback((f: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    // iPhones may send empty type for HEIC — infer from extension
    let fileType = f.type?.toLowerCase() || '';
    if (!fileType || fileType === 'application/octet-stream') {
      const ext = f.name?.split('.').pop()?.toLowerCase();
      const extMap: Record<string, string> = { heic: 'image/heic', heif: 'image/heif', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      fileType = extMap[ext || ''] || fileType;
    }
    if (!validTypes.includes(fileType)) {
      setMessage(t('gallery.invalidType'));
      setStatus('error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setMessage(t('gallery.tooLarge'));
      setStatus('error');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    setMessage('');
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || !email.trim()) return;

    setStatus('uploading');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaderName', name.trim());
      formData.append('uploaderEmail', email.trim());

      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || t('form.error'));
        return;
      }

      if (data.status === 'rejected') {
        setStatus('rejected');
        setMessage(data.rejectionReason || t('gallery.rejected'));
      } else if (data.status === 'approved') {
        setStatus('success');
        setMessage(t('gallery.approved'));
      } else {
        setStatus('success');
        setMessage(t('gallery.pending'));
      }

      // Reset form on success
      if (data.status !== 'rejected') {
        setFile(null);
        setPreview(null);
        setName('');
        setEmail('');
      }
    } catch {
      setStatus('error');
      setMessage(t('form.error'));
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      {/* Drag & Drop Zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-[#004D98] bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative">
            <Image src={preview} alt="Preview" width={400} height={300} className="mx-auto max-h-64 w-auto rounded-lg object-contain" />
            <button
              type="button"
              onClick={removeFile}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="mt-2 text-sm text-gray-500">{file?.name}</p>
          </div>
        ) : (
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-700">{t('gallery.dragDrop')}</p>
            <p className="mt-1 text-xs text-gray-500">{t('gallery.fileTypes')}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              {t('gallery.browse')}
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Name & Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="uploaderName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('contact.name')} *
          </label>
          <input
            id="uploaderName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#004D98] focus:outline-none focus:ring-1 focus:ring-[#004D98]"
            placeholder={t('form.yourName')}
          />
        </div>
        <div>
          <label htmlFor="uploaderEmail" className="block text-sm font-medium text-gray-700 mb-1">
            {t('contact.email')} *
          </label>
          <input
            id="uploaderEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#004D98] focus:outline-none focus:ring-1 focus:ring-[#004D98]"
            placeholder={t('form.yourEmail')}
          />
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`rounded-lg p-4 text-sm ${
          status === 'success' ? 'bg-green-50 text-green-700' :
          status === 'rejected' ? 'bg-orange-50 text-orange-700' :
          'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || !name.trim() || !email.trim() || status === 'uploading'}
        className="w-full rounded-lg bg-[#A50044] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#8a003a] disabled:opacity-50"
      >
        {status === 'uploading' ? t('gallery.uploading') : t('gallery.upload')}
      </button>

      <p className="text-xs text-gray-500 text-center">{t('gallery.uploadNote')}</p>
    </form>
  );
}
