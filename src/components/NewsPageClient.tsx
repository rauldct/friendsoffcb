"use client";

import Link from "next/link";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";
import { localized } from "@/lib/i18n";
import NewsExplorer from "@/components/NewsExplorer";

interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  titleEs?: string | null;
  excerpt: string | null;
  excerptEs?: string | null;
  coverImage: string | null;
  category: string;
  matchResult: string | null;
  publishedAt: string;
}

interface NewsPageClientProps {
  heroArticles: NewsArticle[];
}

export default function NewsPageClient({ heroArticles }: NewsPageClientProps) {
  const { t, locale } = useLanguage();
  const lp = useLocalePath();

  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-[#A50044]/10 text-[#A50044] uppercase tracking-wide mb-3">
            {t("news.badge")}
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            {t("news.title")}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t("news.desc")}
          </p>
        </div>

        {/* Hero Section */}
        {heroArticles.length > 0 && (
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Hero Article */}
              {heroArticles[0] && (
                <Link
                  href={lp(`/news/${heroArticles[0].slug}`)}
                  className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-shadow md:row-span-2 flex flex-col justify-end min-h-[320px]"
                >
                  {heroArticles[0].coverImage ? (
                    <img
                      src={heroArticles[0].coverImage}
                      alt={localized(locale, heroArticles[0].title, heroArticles[0].titleEs)}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                  <div className={`absolute inset-0 ${heroArticles[0].coverImage ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-br from-[#1A1A2E] to-[#004D98]'}`} />
                  <div className="relative p-8">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 w-fit ${
                        heroArticles[0].category === "chronicle"
                          ? "bg-[#EDBB00] text-[#1A1A2E]"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {heroArticles[0].category === "chronicle" ? t("news.matchReport") : t("news.newsDigest")}
                    </span>
                    <h2 className="text-2xl font-heading font-bold mb-3 text-white group-hover:text-[#EDBB00] transition-colors">
                      {localized(locale, heroArticles[0].title, heroArticles[0].titleEs)}
                    </h2>
                    <p className="text-gray-300 text-sm mb-3">{localized(locale, heroArticles[0].excerpt || "", heroArticles[0].excerptEs)}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <time>
                        {new Date(heroArticles[0].publishedAt).toLocaleDateString(dateLocale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {", "}
                        {new Date(heroArticles[0].publishedAt).toLocaleTimeString(dateLocale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      {heroArticles[0].matchResult && (
                        <>
                          <span>&middot;</span>
                          <span className="font-medium text-[#EDBB00]">{heroArticles[0].matchResult}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Side Articles */}
              {heroArticles.slice(1, 3).map((article) => (
                <Link
                  key={article.id}
                  href={lp(`/news/${article.slug}`)}
                  className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                >
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${
                      article.category === "chronicle"
                        ? "bg-[#EDBB00]/10 text-[#A50044]"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {article.category === "chronicle" ? t("news.matchReport") : t("news.newsDigest")}
                  </span>
                  <h3 className="font-heading font-bold text-[#1A1A2E] mb-2 group-hover:text-[#A50044] transition-colors">
                    {localized(locale, article.title, article.titleEs)}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{localized(locale, article.excerpt || "", article.excerptEs)}</p>
                  <time className="text-xs text-gray-400 mt-3 block">
                    {new Date(article.publishedAt).toLocaleDateString(dateLocale, {
                      month: "short",
                      day: "numeric",
                    })}
                    {", "}
                    {new Date(article.publishedAt).toLocaleTimeString(dateLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* News Explorer - Client component with search + pagination */}
        <NewsExplorer />
      </div>
    </div>
  );
}
