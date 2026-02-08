'use client';

import { useState, useCallback } from 'react';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';
import PhotoLightbox from './PhotoLightbox';
import { useLanguage } from '@/lib/LanguageContext';

interface GalleryGridProps {
  initialPhotos: Photo[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
}

export default function GalleryGrid({ initialPhotos, initialTotal, initialPage, totalPages }: GalleryGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const { t } = useLanguage();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/gallery?page=${nextPage}&limit=24`);
      const data = await res.json();
      setPhotos((prev) => [...prev, ...data.photos]);
      setPage(nextPage);
      setHasMore(nextPage < data.totalPages);
    } catch (err) {
      console.error('Failed to load more photos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return (
    <>
      {photos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('gallery.empty')}</h3>
          <p className="text-gray-500">{t('gallery.emptyDesc')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {initialTotal} {t('gallery.photosCount')}
          </p>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => setLightboxIndex(index)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-lg bg-[#004D98] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[#003a75] disabled:opacity-50"
              >
                {loading ? t('gallery.loading') : t('gallery.loadMore')}
              </button>
            </div>
          )}
        </>
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <PhotoLightbox
          photo={photos[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setLightboxIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < photos.length - 1}
        />
      )}
    </>
  );
}
