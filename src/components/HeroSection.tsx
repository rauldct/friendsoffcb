"use client";

import Link from "next/link";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";

export default function HeroSection() {
  const { t } = useLanguage();
  const lp = useLocalePath();

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#004D98] to-[#A50044]" />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-20">
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-6 leading-tight">
          {t("hero.title")}{" "}
          <span className="text-[#EDBB00]">{t("hero.titleHighlight")}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={lp("/about")} className="btn-gold text-lg py-4 px-8">{t("hero.cta1")}</Link>
          <Link href={lp("/chat")} className="btn-secondary text-lg py-4 px-8">{t("hero.cta2")}</Link>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-gray-300">
          <span className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            {t("hero.stat1")}
          </span>
          <span className="hidden sm:inline text-gray-500">·</span>
          <span className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            {t("hero.stat2")}
          </span>
          <span className="hidden sm:inline text-gray-500">·</span>
          <span className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            {t("hero.stat3")}
          </span>
        </div>
      </div>
    </section>
  );
}
