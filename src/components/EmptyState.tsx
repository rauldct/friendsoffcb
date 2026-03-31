"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function EmptyState({ icon, titleKey, descKey }: { icon: string; titleKey: string; descKey: string }) {
  const { t } = useLanguage();
  return (
    <div className="text-center py-20">
      <span className="text-6xl mb-4 block">{icon}</span>
      <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-2">{t(titleKey)}</h2>
      <p className="text-gray-500">{t(descKey)}</p>
    </div>
  );
}
