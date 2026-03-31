"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";
import { localized } from "@/lib/i18n";

interface LatestResultProps {
  title: string;
  titleEs?: string | null;
  slug: string;
  matchResult: string;
  matchDate: string;
  excerpt: string;
  excerptEs?: string | null;
  coverImage: string;
  opponentCrest?: string | null;
  opponentName?: string | null;
  venue?: string | null;
}

export default function LatestResult({ title: titleEn, titleEs, slug, matchResult, matchDate, excerpt: excerptEn, excerptEs, coverImage, opponentCrest, opponentName: opponentNameProp, venue }: LatestResultProps) {
  const { t, locale } = useLanguage();
  const lp = useLocalePath();
  const title = localized(locale, titleEn, titleEs);
  const excerpt = localized(locale, excerptEn, excerptEs);
  // matchResult format: "3-0 (win)" or "1-2 (loss)" or "1-1 (draw)"
  const scoreMatch = matchResult.match(/(\d+)-(\d+)/);
  const score = scoreMatch ? `${scoreMatch[1]}-${scoreMatch[2]}` : matchResult;
  const resultType = matchResult.includes("win") ? "win" : matchResult.includes("loss") ? "loss" : "draw";

  // Determine teams using DB props (venue + opponentName), fallback to title parsing
  let homeTeam = "FC Barcelona";
  let awayTeam = opponentNameProp || "";
  let isBarcaHome = true;
  let isBarcaAway = false;

  if (opponentNameProp && venue) {
    // Use DB data: venue is "home" or "away" (from Barça's perspective)
    if (venue === "home") {
      homeTeam = "FC Barcelona";
      awayTeam = opponentNameProp;
      isBarcaHome = true;
      isBarcaAway = false;
    } else {
      homeTeam = opponentNameProp;
      awayTeam = "FC Barcelona";
      isBarcaHome = false;
      isBarcaAway = true;
    }
  } else {
    // Fallback: extract teams from title "TeamA X-Y TeamB: ..."
    const titleMatch = title.match(/^(.+?)\s+\d+-\d+\s+(.+?):/);
    if (titleMatch) {
      homeTeam = titleMatch[1].trim();
      awayTeam = titleMatch[2].trim();
      isBarcaHome = /Barça|Barcelona|Barca/i.test(homeTeam);
      isBarcaAway = /Barça|Barcelona|Barca/i.test(awayTeam);
    }
  }

  // Opponent crest: use prop from server, fallback to slug-based guess
  const resolvedOpponent = isBarcaHome ? awayTeam : homeTeam;
  const opponentSlug = resolvedOpponent.toLowerCase()
    .replace(/[áà]/g, "a").replace(/[éè]/g, "e").replace(/[íì]/g, "i").replace(/[óò]/g, "o").replace(/[úù]/g, "u")
    .replace(/ñ/g, "n").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const opponentCrestSrc = opponentCrest || `/images/crests/${opponentSlug}.png`;

  const dateFormatted = new Date(matchDate).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const resultBadge = resultType === "win"
    ? "bg-green-500/20 text-green-300 border-green-500/30"
    : resultType === "loss"
    ? "bg-red-500/20 text-red-300 border-red-500/30"
    : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";

  const resultLabel = resultType === "win" ? t("news.victory") : resultType === "loss" ? t("news.defeat") : t("news.draw");

  const [opponentCrestError, setOpponentCrestError] = useState(false);

  return (
    <section className="section-padding bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-heading font-extrabold text-white">{t("news.latestResult")}</h2>
          <Link href={lp("/news")} className="text-sm text-[#EDBB00] hover:underline font-medium">
            {t("news.allNews")} →
          </Link>
        </div>

        <Link href={lp(`/news/${slug}`)} className="block group">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/15 transition-colors">
            <div className="p-6 md:p-8 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-gray-300">{dateFormatted}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${resultBadge}`}>
                  {resultLabel}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6 md:gap-10 mb-6">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 min-w-[90px]">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center p-2">
                    {isBarcaHome ? (
                      <Image src="/images/crests/fc-barcelona.png" alt="FC Barcelona" width={44} height={44} className="object-contain" />
                    ) : opponentCrestError ? (
                      <span className="text-2xl">⚽</span>
                    ) : (
                      <Image
                        src={opponentCrestSrc}
                        alt={homeTeam}
                        width={44}
                        height={44}
                        className="object-contain"
                        onError={() => setOpponentCrestError(true)}
                      />
                    )}
                  </div>
                  <span className="text-white text-sm font-medium text-center leading-tight">{homeTeam}</span>
                </div>

                {/* Score */}
                <div className="text-5xl md:text-6xl font-heading font-black text-[#EDBB00] tracking-wider">
                  {score}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 min-w-[90px]">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center p-2">
                    {isBarcaAway ? (
                      <Image src="/images/crests/fc-barcelona.png" alt="FC Barcelona" width={44} height={44} className="object-contain" />
                    ) : opponentCrestError ? (
                      <span className="text-2xl">⚽</span>
                    ) : (
                      <Image
                        src={opponentCrestSrc}
                        alt={awayTeam}
                        width={44}
                        height={44}
                        className="object-contain"
                        onError={() => setOpponentCrestError(true)}
                      />
                    )}
                  </div>
                  <span className="text-white text-sm font-medium text-center leading-tight">{awayTeam}</span>
                </div>
              </div>

              <h3 className="text-white text-lg font-heading font-bold group-hover:text-[#EDBB00] transition-colors text-center max-w-xl">
                {title}
              </h3>
              <p className="text-gray-300 text-sm mt-2 text-center line-clamp-2 max-w-lg">{excerpt}</p>

              <div className="mt-4">
                <span className="inline-flex items-center gap-2 text-[#EDBB00] text-sm font-medium group-hover:gap-3 transition-all">
                  {t("news.readReport")} <span>→</span>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
