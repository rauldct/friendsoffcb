"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function AboutContent() {
  const { t } = useLanguage();

  return (
    <div className="section-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-8 text-center">{t("about.title")}</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <p className="text-xl text-gray-500 text-center mb-10">
            {t("about.subtitle")}
          </p>

          <div className="bg-[#F5F5F5] rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">{t("about.mission")}</h2>
            <p>{t("about.missionDesc")}</p>
          </div>

          <h2 className="text-2xl font-heading font-bold text-[#1A1A2E]">{t("about.whatWeDo")}</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>{t("about.do1")}</span></li>
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>{t("about.do2")}</span></li>
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>{t("about.do3")}</span></li>
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>{t("about.do4")}</span></li>
          </ul>

          <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8">{t("about.affiliateTitle")}</h2>
          <p>{t("about.affiliateDesc")}</p>

          <div className="text-center mt-10">
            <Link href="/contact" className="btn-primary">{t("about.getInTouch")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
