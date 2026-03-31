"use client";

import Link from "next/link";
import Image from "next/image";
import { MatchPackage } from "@/types";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";
import { localized } from "@/lib/i18n";

const competitionColors: Record<string, string> = {
  "Champions League": "bg-[#EDBB00] text-[#1A1A2E]",
  "La Liga": "bg-[#004D98] text-white",
  "Copa del Rey": "bg-[#A50044] text-white",
  "default": "bg-gray-600 text-white",
};

export default function PackageCard({ pkg, priority = false }: { pkg: MatchPackage; priority?: boolean }) {
  const { t, locale } = useLanguage();
  const lp = useLocalePath();
  const badgeColor = competitionColors[pkg.competition] || competitionColors.default;
  const lowestPrice = pkg.tickets?.length ? Math.min(...pkg.tickets.map(t => t.priceFrom)) : 0;
  const matchTitle = localized(locale, pkg.matchTitle, pkg.matchTitleEs);

  return (
    <Link href={lp(`/packages/${pkg.slug}`)} className="card group block">
      <div className="relative h-48 bg-gradient-to-br from-[#004D98] to-[#A50044] overflow-hidden">
        {pkg.heroImage ? (
          <Image src={pkg.heroImage} alt={matchTitle} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" priority={priority} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-20">⚽</span>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
          {pkg.competition}
        </span>
        {pkg.featured && (
          <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-[#EDBB00] text-[#1A1A2E]">{t("misc.featured")}</span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-lg text-[#1A1A2E] group-hover:text-[#A50044] transition-colors mb-2">
          {matchTitle}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {new Date(pkg.matchDate).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { weekday: "short", month: "short", day: "numeric" })} · {pkg.matchTime}
        </p>
        <div className="flex items-center justify-between">
          {lowestPrice > 0 && (
            <span className="text-[#A50044] font-bold">{t("packages.from")} €{lowestPrice}</span>
          )}
          <span className="text-sm text-[#004D98] font-medium group-hover:underline">{t("packages.viewPackage")}</span>
        </div>
      </div>
    </Link>
  );
}
