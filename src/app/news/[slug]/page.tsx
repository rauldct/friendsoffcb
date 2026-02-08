import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await prisma.newsArticle.findUnique({ where: { slug: params.slug } });
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt,
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
    twitter: {
      card: "summary",
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt,
    },
    alternates: {
      canonical: `https://friendsofbarca.com/news/${params.slug}`,
    },
  };
}

export const revalidate = 300;

export default async function NewsArticlePage({ params }: Props) {
  const article = await prisma.newsArticle.findUnique({ where: { slug: params.slug } });
  if (!article || article.status !== "published") notFound();

  const sources = (article.sources as Array<{ name: string; url: string }>) || [];

  return (
    <article className="section-padding">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/news" className="text-[#004D98] text-sm hover:underline mb-4 inline-block">
            &larr; Back to News
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded ${
                article.category === "chronicle"
                  ? "bg-[#EDBB00]/10 text-[#A50044]"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {article.category === "chronicle" ? "Match Report" : "News Digest"}
            </span>
            {article.matchResult && (
              <span className="text-sm font-bold text-[#1A1A2E] bg-gray-100 px-3 py-1 rounded">
                {article.matchResult}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{article.author}</span>
            <span>&middot;</span>
            <time>
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
        </div>

        {article.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        {article.excerpt && (
          <div className="bg-gray-50 rounded-xl p-5 mb-8">
            <p className="text-gray-700 font-medium italic">{article.excerpt}</p>
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
          {article.content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## "))
              return (
                <h2
                  key={i}
                  className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8 mb-4"
                >
                  {paragraph.replace("## ", "")}
                </h2>
              );
            if (paragraph.startsWith("### "))
              return (
                <h3
                  key={i}
                  className="text-xl font-heading font-bold text-[#1A1A2E] mt-6 mb-3"
                >
                  {paragraph.replace("### ", "")}
                </h3>
              );
            return <p key={i}>{paragraph}</p>;
          })}
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Sources
            </h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {src.name} &rarr;
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 flex items-center gap-3 text-sm text-gray-400">
          <span>Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`https://friendsofbarca.com/news/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#004D98] transition-colors"
          >
            Twitter/X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://friendsofbarca.com/news/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#004D98] transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' https://friendsofbarca.com/news/' + article.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#004D98] transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
