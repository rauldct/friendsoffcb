'use client';

import Image from 'next/image';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onReport: () => void;
}

export default function PhotoCard({ photo, onClick, onReport }: PhotoCardProps) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl break-inside-avoid mb-4 bg-gray-100"
      onClick={onClick}
    >
      <Image
        src={`/uploads/gallery/${photo.thumbnailName}`}
        alt={`Photo by ${photo.uploaderName}`}
        width={400}
        height={400}
        className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Report flag button - top right on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onReport(); }}
        className="absolute top-2 right-2 rounded-full bg-black/40 p-1.5 text-white/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white"
        aria-label="Report photo"
        title="Report photo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-4.392l1.657-.348a6.449 6.449 0 014.271.572 7.948 7.948 0 005.965.524l2.078-.64A.75.75 0 0018 12.25v-8.5a.75.75 0 00-.904-.734l-2.38.501a7.25 7.25 0 01-4.186-.363l-.502-.2a8.75 8.75 0 00-5.053-.439l-1.475.31V2.75z" />
        </svg>
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
        {photo.location && (
          <p className="text-xs text-white/90 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433a19.695 19.695 0 002.608-1.862c2.078-1.7 4.52-4.258 4.52-7.987A8.5 8.5 0 0010 0a8.5 8.5 0 00-8.5 8.5c0 3.729 2.442 6.287 4.52 7.987a19.695 19.695 0 002.608 1.862 11.58 11.58 0 001.038.573l.018.008.006.003z" clipRule="evenodd" />
            </svg>
            {photo.location}
          </p>
        )}
        {photo.takenAt && (
          <p className="text-xs text-white/70 mt-0.5">
            {new Date(photo.takenAt).toLocaleDateString()}
          </p>
        )}
        <p className="text-xs text-white/70 mt-0.5">by {photo.uploaderName}</p>
      </div>
    </div>
  );
}
