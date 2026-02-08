"use client";
import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSelector() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          locale === "en"
            ? "bg-white shadow text-[#1A1A2E]"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("es")}
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
