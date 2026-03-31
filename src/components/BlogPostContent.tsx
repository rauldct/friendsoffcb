"use client";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "./Breadcrumbs";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";
import { localized } from "@/lib/i18n";
import { renderInline } from "@/lib/renderInline";

interface BlogPostContentProps {
  title: string;
  titleEs?: string | null;
  category: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  content: string;
  contentEs?: string | null;
  tags: string[];
  relatedPackageSlug: string | null;
  relatedPosts?: Array<{
    slug: string;
    title: string;
    titleEs?: string | null;
    coverImage: string | null;
    publishedAt: string;
  }>;
}

export default function BlogPostContent({
  title: titleEn,
  titleEs,
  category,
  author,
  publishedAt,
  coverImage,
  content: contentEn,
  contentEs,
  tags,
  relatedPackageSlug,
  relatedPosts,
}: BlogPostContentProps) {
  const { locale, t } = useLanguage();
  const lp = useLocalePath();
  const title = localized(locale, titleEn, titleEs);
  const content = localized(locale, contentEn, contentEs);

  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return (
    <article className="section-padding">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Breadcrumbs items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.blog"), href: "/blog" },
            { label: title },
          ]} />
          <span className="inline-block text-xs font-medium px-3 py-1 rounded bg-blue-100 text-blue-800 mb-4 ml-4">
            {category}
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{t("misc.by")} {author}</span>
            <span>&middot;</span>
            <time>
              {new Date(publishedAt).toLocaleDateString(dateLocale, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
        </div>

        {coverImage && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <Image src={coverImage} alt={title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
          {content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## "))
              return (
                <h2 key={i} className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8 mb-4">
                  {renderInline(paragraph.replace("## ", ""))}
                </h2>
              );
            if (paragraph.startsWith("### "))
              return (
                <h3 key={i} className="text-xl font-heading font-bold text-[#1A1A2E] mt-6 mb-3">
                  {renderInline(paragraph.replace("### ", ""))}
                </h3>
              );
            return <p key={i}>{renderInline(paragraph)}</p>;
          })}
        </div>

        {relatedPackageSlug && (
          <div className="mt-12 p-6 bg-gradient-to-r from-[#A50044] to-[#004D98] rounded-2xl text-white text-center">
            <h3 className="font-heading font-bold text-xl mb-2">{t("pkg.goingMatch")}</h3>
            <p className="text-gray-200 mb-4">{t("pkg.goingMatchDesc")}</p>
            <Link href={lp(`/packages/${relatedPackageSlug}`)} className="btn-gold">
              {t("calendar.viewPackage")}
            </Link>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">#{tag}</span>
          ))}
        </div>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="font-heading font-bold text-xl text-[#1A1A2E] mb-6">
              {locale === "es" ? "Artículos relacionados" : "Related Articles"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(rp => (
                <Link key={rp.slug} href={lp(`/blog/${rp.slug}`)} className="group block rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                  {rp.coverImage && (
                    <div className="h-32 overflow-hidden">
                      <Image src={rp.coverImage} alt={localized(locale, rp.title, rp.titleEs)} fill={false} width={400} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-[#1A1A2E] line-clamp-2 group-hover:text-[#004D98] transition-colors">
                      {localized(locale, rp.title, rp.titleEs)}
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
