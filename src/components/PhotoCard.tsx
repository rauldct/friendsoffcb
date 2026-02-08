'use client';

import Image from 'next/image';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
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
