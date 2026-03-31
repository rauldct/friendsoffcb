'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState(''); // honeypot
  const [formTs] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const FEEDBACK_TYPES = [
    { value: 'general', label: t('feedback.general') },
    { value: 'travel', label: t('feedback.travel') },
    { value: 'promotion', label: t('feedback.promotion') },
    { value: 'suggestion', label: t('feedback.suggestion') },
    { value: 'bug', label: t('feedback.bug') },
    { value: 'partnership', label: t('feedback.partnership') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, type, message, _hp: hp, _ts: formTs }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError(t('feedback.networkError'));
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-5xl mb-4">&#10003;</div>
          <h3 className="text-xl font-heading font-bold text-[#1A1A2E] mb-2">{t('feedback.thanks')}</h3>
          <p className="text-gray-500 mb-6">{t('feedback.thanksDesc')}</p>
          <button onClick={onClose} className="bg-[#004D98] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#003a75] transition-colors">
            {t('feedback.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-heading font-bold text-[#1A1A2E]">{t('feedback.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Honeypot */}
          <input type="text" name="company" value={hp} onChange={(e) => setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:'absolute',left:'-9999px',opacity:0,height:0,width:0}} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('feedback.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('feedback.namePlaceholder')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('feedback.email')} *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('feedback.topic')} *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none"
            >
              {FEEDBACK_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('feedback.message')} *</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('feedback.messagePlaceholder')}
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
            {sending ? t('feedback.sending') : t('feedback.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
