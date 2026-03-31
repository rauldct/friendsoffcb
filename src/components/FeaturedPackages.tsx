"use client";

import Link from "next/link";
import PackageCard from "./PackageCard";
import { MatchPackage } from "@/types";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";

export default function FeaturedPackages({ packages }: { packages: MatchPackage[] }) {
  const { t } = useLanguage();
  const lp = useLocalePath();

  return (
    <section className="section-padding bg-[#F5F5F5]">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">{t("section.featured")}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">{t("section.featuredDesc")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.slice(0, 3).map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} priority={index === 0} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href={lp("/packages")} className="btn-primary">{t("packages.viewAll")}</Link>
        </div>
      </div>
    </section>
  );
}
