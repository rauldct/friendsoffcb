"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function GalleryPageFooter() {
  const { t } = useLanguage();
  return (
    <div className="mt-12 border-t border-gray-200 pt-6 text-center">
      <p className="text-xs text-gray-400">
        {t("gallery.termsNotice")}{' '}
        <Link href="/gallery/terms" className="text-[#004D98] hover:underline">
          {t("gallery.termsLink")}
        </Link>
        {' '}&middot;{' '}
        <Link href="/privacy" className="text-[#004D98] hover:underline">
          {t("footer.privacyPolicy")}
        </Link>
        {' '}&middot;{' '}
        {t("gallery.removalRequests")} <a href="mailto:info@friendsofbarca.com" className="text-[#004D98] hover:underline">info@friendsofbarca.com</a>
      </p>
    </div>
  );
}
