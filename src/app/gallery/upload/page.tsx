import PhotoUploadForm from '@/components/PhotoUploadForm';
import UploadPageHeader from '@/components/UploadPageHeader';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Photo | Fan Gallery | Friends of Barça',
  description: 'Share your FC Barcelona photos with the community. Upload your best Camp Nou and matchday moments.',
  alternates: {
    canonical: "https://friendsofbarca.com/gallery/upload",
    languages: {
      en: "https://friendsofbarca.com/gallery/upload",
      es: "https://friendsofbarca.com/gallery/upload",
      "x-default": "https://friendsofbarca.com/gallery/upload",
    },
  },
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <UploadPageHeader />

      <PhotoUploadForm />
    </div>
  );
}
