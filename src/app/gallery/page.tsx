import prisma from '@/lib/prisma';
import GalleryGrid from '@/components/GalleryGrid';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Fan Gallery',
  description: 'Photos from FC Barcelona fans around the world. Share your Camp Nou moments, matchday photos, and Barça experiences with the community.',
  openGraph: {
    title: 'Fan Gallery | FC Barcelona Photos',
    description: 'Community photo gallery from Barça fans worldwide. Share your Camp Nou moments!',
    images: ['/images/packages/camp-nou-match.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FC Barcelona Fan Gallery',
    description: 'Photos from Barça fans worldwide. Share your Camp Nou moments!',
  },
  alternates: {
    canonical: 'https://friendsofbarca.com/gallery',
  },
};

export default async function GalleryPage() {
  const limit = 24;
  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.photo.count({ where: { status: 'approved' } }),
  ]);

  const serialized = photos.map((p) => ({
    ...p,
    takenAt: p.takenAt?.toISOString() ?? null,
    moderatedAt: p.moderatedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] sm:text-4xl">Fan Gallery</h1>
          <p className="mt-2 text-gray-600">Photos from Barça fans around the world</p>
        </div>
        <Link
          href="/gallery/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-[#A50044] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#8a003a] hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload Photo
        </Link>
      </div>

      <GalleryGrid
        initialPhotos={serialized}
        initialTotal={total}
        initialPage={1}
        totalPages={Math.ceil(total / limit)}
      />
    </div>
  );
}
