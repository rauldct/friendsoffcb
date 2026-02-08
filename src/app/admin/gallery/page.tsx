'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import PhotoMetadataModal from '@/components/PhotoMetadataModal';

interface Photo {
  id: string;
  filename: string;
  thumbnailName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  takenAt: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  uploaderName: string;
  uploaderEmail: string;
  status: string;
  rejectionReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>('approved');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [metadataPhoto, setMetadataPhoto] = useState<Photo | null>(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/admin/gallery?${params}`);
      const data = await res.json();
      setPhotos(data.photos);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    setActionLoading(id);
    try {
      if (action === 'delete') {
        await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/admin/gallery', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: action === 'approve' ? 'approved' : 'rejected',
          }),
        });
      }
      fetchPhotos();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
        <div className="flex gap-2">
          {['approved', 'pending', 'rejected', ''].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f ? 'bg-[#004D98] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} photo{total !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : photos.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No photos found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="relative aspect-square">
                <Image
                  src={`/uploads/gallery/${photo.thumbnailName}`}
                  alt={photo.originalName}
                  fill
                  className="object-cover"
                />
                <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(photo.status)}`}>
                  {photo.status}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{photo.uploaderName}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMetadataPhoto(photo)}
                      className="text-gray-400 hover:text-[#004D98] transition-colors"
                      title="View details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-500">{new Date(photo.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate">{photo.uploaderEmail}</p>
                {photo.location && (
                  <p className="text-xs text-gray-500 truncate">&#128205; {photo.location}</p>
                )}
                <p className="text-xs text-gray-400">{photo.originalName} ({(photo.fileSize / 1024).toFixed(0)} KB)</p>

                <div className="flex gap-2 pt-1">
                  {photo.status !== 'approved' && (
                    <button
                      onClick={() => handleAction(photo.id, 'approve')}
                      disabled={actionLoading === photo.id}
                      className="flex-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {photo.status !== 'rejected' && (
                    <button
                      onClick={() => handleAction(photo.id, 'reject')}
                      disabled={actionLoading === photo.id}
                      className="flex-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(photo.id, 'delete')}
                    disabled={actionLoading === photo.id}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Metadata Modal */}
      {metadataPhoto && (
        <PhotoMetadataModal
          photo={metadataPhoto}
          onClose={() => setMetadataPhoto(null)}
        />
      )}
    </div>
  );
}
