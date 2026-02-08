import Link from "next/link";
import Image from "next/image";
import { MatchPackage } from "@/types";

const competitionColors: Record<string, string> = {
  "Champions League": "bg-[#EDBB00] text-[#1A1A2E]",
  "La Liga": "bg-[#004D98] text-white",
  "Copa del Rey": "bg-[#A50044] text-white",
  "default": "bg-gray-600 text-white",
};

export default function PackageCard({ pkg }: { pkg: MatchPackage }) {
  const badgeColor = competitionColors[pkg.competition] || competitionColors.default;
  const lowestPrice = pkg.tickets?.length ? Math.min(...pkg.tickets.map(t => t.priceFrom)) : 0;

  return (
    <Link href={`/packages/${pkg.slug}`} className="card group block">
      <div className="relative h-48 bg-gradient-to-br from-[#004D98] to-[#A50044] overflow-hidden">
        {pkg.heroImage ? (
          <Image src={pkg.heroImage} alt={pkg.matchTitle} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-20">⚽</span>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
          {pkg.competition}
        </span>
        {pkg.featured && (
          <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-[#EDBB00] text-[#1A1A2E]">Featured</span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-lg text-[#1A1A2E] group-hover:text-[#A50044] transition-colors mb-2">
          {pkg.matchTitle}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {new Date(pkg.matchDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {pkg.matchTime}
        </p>
        <div className="flex items-center justify-between">
          {lowestPrice > 0 && (
            <span className="text-[#A50044] font-bold">From €{lowestPrice}</span>
          )}
          <span className="text-sm text-[#004D98] font-medium group-hover:underline">View Package →</span>
        </div>
      </div>
    </Link>
  );
}
