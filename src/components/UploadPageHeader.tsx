"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function UploadPageHeader() {
  const { t } = useLanguage();
  return (
    <>
      <div className="mb-8">
        <Link href="/gallery" className="text-sm text-[#004D98] hover:underline">
          {t("gallery.back")}
        </Link>
      </div>
      <div className="mx-auto max-w-xl text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] sm:text-4xl">{t("gallery.uploadTitle")}</h1>
        <p className="mt-3 text-gray-600">{t("gallery.uploadDesc")}</p>
      </div>
    </>
  );
}
