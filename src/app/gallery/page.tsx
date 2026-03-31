import prisma from '@/lib/prisma';
import GalleryGrid from '@/components/GalleryGrid';
import GalleryPageHeader from '@/components/GalleryPageHeader';
import GalleryPageFooter from '@/components/GalleryPageFooter';
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
    languages: { "en": "https://friendsofbarca.com/gallery", "es": "https://friendsofbarca.com/es/gallery", "x-default": "https://friendsofbarca.com/gallery" },
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
      <GalleryPageHeader />

      <GalleryGrid
        initialPhotos={serialized}
        initialTotal={total}
        initialPage={1}
        totalPages={Math.ceil(total / limit)}
      />

      <GalleryPageFooter />
    </div>
  );
}
