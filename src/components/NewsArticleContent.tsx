"use client";
import Link from "next/link";
import Breadcrumbs from "./Breadcrumbs";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";
import { localized } from "@/lib/i18n";
import { renderInline } from "@/lib/renderInline";

interface NewsArticleContentProps {
  title: string;
  titleEs?: string | null;
  category: string;
  matchResult: string | null;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  excerpt: string | null;
  excerptEs?: string | null;
  content: string;
  contentEs?: string | null;
  slug: string;
  relatedArticles?: Array<{
    slug: string;
    title: string;
    titleEs?: string | null;
    category: string;
    matchResult: string | null;
    coverImage: string | null;
    publishedAt: string;
  }>;
}

export default function NewsArticleContent({
  title: titleEn,
  titleEs,
  category,
  matchResult,
  author,
  publishedAt,
  coverImage,
  excerpt: excerptEn,
  excerptEs,
  content: contentEn,
  contentEs,
  slug,
  relatedArticles,
}: NewsArticleContentProps) {
  const { locale, t } = useLanguage();
  const lp = useLocalePath();
  const title = localized(locale, titleEn, titleEs);
  const excerpt = excerptEn ? localized(locale, excerptEn, excerptEs) : null;
  const content = localized(locale, contentEn, contentEs);

  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return (
    <article className="section-padding">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Breadcrumbs items={[
            { label: t("nav.home"), href: lp("/") },
            { label: t("nav.news"), href: lp("/news") },
            { label: title },
          ]} />
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded ${
                category === "chronicle"
                  ? "bg-[#EDBB00]/10 text-[#A50044]"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {category === "chronicle" ? t("news.matchReport") : t("news.newsDigest")}
            </span>
            {matchResult && (
              <span className="text-sm font-bold text-[#1A1A2E] bg-gray-100 px-3 py-1 rounded">
                {matchResult}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>{author}</span>
            <span>&middot;</span>
            <time dateTime={publishedAt}>
              {new Date(publishedAt).toLocaleDateString(dateLocale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {", "}
              {new Date(publishedAt).toLocaleTimeString(dateLocale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        </div>

        {coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        {excerpt && (
          <div className="bg-gray-50 rounded-xl p-5 mb-8">
            <p className="text-gray-700 font-medium italic">{excerpt}</p>
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
          {content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## "))
              return (
                <h2
                  key={i}
                  className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8 mb-4"
                >
                  {renderInline(paragraph.replace("## ", ""))}
                </h2>
              );
            if (paragraph.startsWith("### "))
              return (
                <h3
                  key={i}
                  className="text-xl font-heading font-bold text-[#1A1A2E] mt-6 mb-3"
                >
                  {renderInline(paragraph.replace("### ", ""))}
                </h3>
              );
            return <p key={i}>{renderInline(paragraph)}</p>;
          })}
        </div>

        {/* Share */}
        <div className="mt-8 flex items-center gap-3 text-sm text-gray-400">
          <span>{t("news.share")}</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`https://friendsofbarca.com/news/${slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#004D98] transition-colors"
          >
            Twitter/X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://friendsofbarca.com/news/${slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#004D98] transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' https://friendsofbarca.com/news/' + slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#004D98] transition-colors"
          >
            WhatsApp
          </a>
        </div>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="font-heading font-bold text-xl text-[#1A1A2E] mb-6">
              {locale === "es" ? "Noticias relacionadas" : "Related News"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map(a => (
                <Link key={a.slug} href={lp(`/news/${a.slug}`)} className="group block rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                  {a.coverImage && (
                    <div className="h-32 overflow-hidden">
                      <img src={a.coverImage} alt={localized(locale, a.title, a.titleEs)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${a.category === "chronicle" ? "bg-[#EDBB00]/10 text-[#A50044]" : "bg-blue-50 text-blue-700"}`}>
                      {a.category === "chronicle" ? (locale === "es" ? "Crónica" : "Match Report") : (locale === "es" ? "Resumen" : "Digest")}
                    </span>
                    <h4 className="text-sm font-semibold text-[#1A1A2E] mt-2 line-clamp-2 group-hover:text-[#004D98] transition-colors">
                      {localized(locale, a.title, a.titleEs)}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
