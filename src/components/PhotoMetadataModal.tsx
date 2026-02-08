'use client';

interface PhotoMeta {
  id: string;
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
  createdAt: string;
}

interface PhotoMetadataModalProps {
  photo: PhotoMeta;
  onClose: () => void;
}

export default function PhotoMetadataModal({ photo, onClose }: PhotoMetadataModalProps) {
  const hasGps = photo.latitude !== null && photo.longitude !== null;

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-heading font-bold text-[#1A1A2E]">Photo Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Map */}
          {hasGps && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${photo.longitude! - 0.005},${photo.latitude! - 0.003},${photo.longitude! + 0.005},${photo.latitude! + 0.003}&layer=mapnik&marker=${photo.latitude},${photo.longitude}`}
                />
              </div>
              {photo.location && (
                <p className="text-sm text-gray-600 mt-2">{photo.location}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {photo.latitude!.toFixed(6)}, {photo.longitude!.toFixed(6)}
              </p>
            </div>
          )}

          {!hasGps && photo.location && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Location</h4>
              <p className="text-sm text-gray-600">{photo.location}</p>
            </div>
          )}

          {/* File Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">File Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Filename</span>
                <p className="text-gray-700 truncate">{photo.originalName}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Size</span>
                <p className="text-gray-700">{formatFileSize(photo.fileSize)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Dimensions</span>
                <p className="text-gray-700">{photo.width} &times; {photo.height} px</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Type</span>
                <p className="text-gray-700">{photo.mimeType}</p>
              </div>
            </div>
          </div>

          {/* Date/Time */}
          {photo.takenAt && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Date Taken</h4>
              <p className="text-sm text-gray-600">
                {new Date(photo.takenAt).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Uploader */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Uploader</h4>
            <p className="text-sm text-gray-600">{photo.uploaderName} ({photo.uploaderEmail})</p>
            <p className="text-xs text-gray-400 mt-1">
              Uploaded: {new Date(photo.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
