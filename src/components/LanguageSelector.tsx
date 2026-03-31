"use client";
import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSelector() {
  const { locale, setLocale } = useLanguage();

  const switchTo = (newLocale: "en" | "es") => {
    if (newLocale === locale) return;
    setLocale(newLocale);

    // Use window.location to get the real browser URL (not the rewritten one)
    const currentPath = window.location.pathname;

    if (newLocale === "es") {
      // Add /es prefix
      const esPath = currentPath.startsWith("/es") ? currentPath : `/es${currentPath}`;
      window.location.href = esPath;
    } else {
      // Remove /es prefix
      const enPath = currentPath.startsWith("/es/") ? currentPath.slice(3) : currentPath === "/es" ? "/" : currentPath;
      window.location.href = enPath;
    }
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => switchTo("en")}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          locale === "en"
            ? "bg-white shadow text-[#1A1A2E]"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchTo("es")}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          locale === "es"
            ? "bg-white shadow text-[#1A1A2E]"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        ES
      </button>
    </div>
  );
}
