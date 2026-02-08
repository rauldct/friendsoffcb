import PhotoUploadForm from '@/components/PhotoUploadForm';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Photo | Fan Gallery | Friends of Barça',
  description: 'Share your FC Barcelona photos with the community. Upload your best Camp Nou and matchday moments.',
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/gallery" className="text-sm text-[#004D98] hover:underline">
          &larr; Back to Gallery
        </Link>
      </div>

      <div className="mx-auto max-w-xl text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] sm:text-4xl">Upload Your Photo</h1>
        <p className="mt-3 text-gray-600">
          Share your best FC Barcelona moments with fans around the world.
          Photos are reviewed to ensure they&apos;re related to football and Barça.
        </p>
      </div>

      <PhotoUploadForm />
    </div>
  );
}
