"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function GalleryPageHeader() {
  const { t } = useLanguage();
  return (
    <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] sm:text-4xl">{t("gallery.title")}</h1>
        <p className="mt-2 text-gray-600">{t("gallery.desc")}</p>
      </div>
      <Link
        href="/gallery/upload"
        className="inline-flex items-center gap-2 rounded-lg bg-[#A50044] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#8a003a] hover:shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {t("gallery.upload")}
      </Link>
    </div>
  );
}
