import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NewsArticleContent from "@/components/NewsArticleContent";
import { newsArticleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { getServerLocale, localizedAlternatesForLocale } from "@/lib/server-locale";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let article = await prisma.newsArticle.findUnique({ where: { slug: params.slug } });
  if (!article) {
    article = await prisma.newsArticle.findFirst({ where: { oldSlug: params.slug } });
  }
  if (!article) return { title: "Article Not Found" };

  const locale = getServerLocale();
  const isEs = locale === "es";

  const title = isEs
    ? (article.metaTitleEs || article.titleEs || article.metaTitle || article.title)
    : (article.metaTitle || article.title);
  const description = isEs
    ? (article.metaDescriptionEs || article.excerptEs || article.metaDescription || article.excerpt)
    : (article.metaDescription || article.excerpt);

  const ogTitle = isEs ? (article.titleEs || article.title) : article.title;
  const ogImage = article.coverImage
    ? { url: article.coverImage }
    : { url: `/api/og?title=${encodeURIComponent(ogTitle)}&type=news`, width: 1200, height: 630 };

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
      locale: isEs ? "es_ES" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_ES",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [article.coverImage || `/api/og?title=${encodeURIComponent(ogTitle)}&type=news`],
    },
    alternates: localizedAlternatesForLocale(`/news/${article.slug}`, locale),
  };
}

export const revalidate = 300;

export default async function NewsArticlePage({ params }: Props) {
  let article = await prisma.newsArticle.findUnique({ where: { slug: params.slug } });

  // If not found by slug, check oldSlug for 301 redirect
  if (!article) {
    const oldArticle = await prisma.newsArticle.findFirst({ where: { oldSlug: params.slug } });
    if (oldArticle) {
      permanentRedirect(`/news/${oldArticle.slug}`);
    }
  }

  if (!article || article.status !== "published") notFound();

  const locale = getServerLocale();
  const isEs = locale === "es";

  const relatedArticles = await prisma.newsArticle.findMany({
    where: { status: "published", slug: { not: article.slug } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true, titleEs: true, category: true, matchResult: true, coverImage: true, publishedAt: true },
  });

  const jsonLd = newsArticleJsonLd({
    title: isEs ? (article.titleEs || article.title) : article.title,
    titleEs: article.titleEs,
    excerpt: isEs ? (article.excerptEs || article.excerpt) : article.excerpt,
    slug: article.slug,
    author: article.author,
    publishedAt: article.publishedAt.toISOString(),
    coverImage: article.coverImage,
    category: article.category,
    matchResult: article.matchResult,
  });

  const breadcrumb = breadcrumbJsonLd([
    { name: isEs ? "Inicio" : "Home", url: isEs ? "https://friendsofbarca.com/es" : "https://friendsofbarca.com" },
    { name: isEs ? "Noticias" : "News", url: isEs ? "https://friendsofbarca.com/es/news" : "https://friendsofbarca.com/news" },
    { name: isEs ? (article.titleEs || article.title) : article.title, url: `https://friendsofbarca.com${isEs ? "/es" : ""}/news/${article.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <NewsArticleContent
        title={article.title}
        titleEs={article.titleEs}
        category={article.category}
        matchResult={article.matchResult}
        author={article.author}
        publishedAt={article.publishedAt.toISOString()}
        coverImage={article.coverImage}
        excerpt={article.excerpt}
        excerptEs={article.excerptEs}
        content={article.content}
        contentEs={article.contentEs}
        slug={article.slug}
        relatedArticles={relatedArticles.map(a => ({
          slug: a.slug,
          title: a.title,
          titleEs: a.titleEs,
          category: a.category,
          matchResult: a.matchResult,
          coverImage: a.coverImage,
          publishedAt: a.publishedAt.toISOString(),
        }))}
      />
    </>
  );
}
