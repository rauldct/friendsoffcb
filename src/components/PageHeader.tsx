"use client";

import { useLanguage } from "@/lib/LanguageContext";

interface PageHeaderProps {
  titleKey: string;
  descKey: string;
}

export default function PageHeader({ titleKey, descKey }: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4">{t(titleKey)}</h1>
      <p className="text-gray-500 max-w-2xl mx-auto">{t(descKey)}</p>
    </div>
  );
}
