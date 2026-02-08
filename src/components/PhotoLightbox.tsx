'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Photo } from '@/types';
import { useLanguage } from '@/lib/LanguageContext';

interface PhotoLightboxProps {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function PhotoLightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext }: PhotoLightboxProps) {
  const { t } = useLanguage();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    if (e.key === 'ArrowRight' && hasNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-7xl flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation arrows */}
        {hasPrev && (
          <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20" aria-label="Previous">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20" aria-label="Next">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {/* Main image */}
        <div className="relative max-h-[80vh] max-w-full">
          <Image
            src={`/uploads/gallery/${photo.filename}`}
            alt={`Photo by ${photo.uploaderName}`}
            width={photo.width}
            height={photo.height}
            className="max-h-[80vh] w-auto rounded-lg object-contain"
            priority
          />
        </div>

        {/* Metadata bar */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
          <span className="font-medium text-white">{photo.uploaderName}</span>
          {photo.location && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433a19.695 19.695 0 002.608-1.862c2.078-1.7 4.52-4.258 4.52-7.987A8.5 8.5 0 0010 0a8.5 8.5 0 00-8.5 8.5c0 3.729 2.442 6.287 4.52 7.987a19.695 19.695 0 002.608 1.862 11.58 11.58 0 001.038.573l.018.008.006.003z" clipRule="evenodd" />
              </svg>
              {photo.location}
            </span>
          )}
          {photo.takenAt && (
            <span>{t('gallery.taken')}: {new Date(photo.takenAt).toLocaleDateString()}</span>
          )}

          {/* Social Share buttons */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/gallery`;
                const imgUrl = `${window.location.origin}/uploads/gallery/${photo.filename}`;
                const text = `Check out this photo from FriendsOfBarca! ${photo.location ? `📍 ${photo.location}` : ''}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
              }}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Share on X"
              title="Share on X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/gallery`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
              }}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Share on Facebook"
              title="Share on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/gallery`;
                const text = `Check out the FriendsOfBarca fan gallery! ${photo.location ? `📍 ${photo.location}` : ''}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
              }}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Share on WhatsApp"
              title="Share on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
