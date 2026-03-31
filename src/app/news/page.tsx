import { Metadata } from "next";
import prisma from "@/lib/prisma";
import NewsPageClient from "@/components/NewsPageClient";
import { getServerLocale, localizedAlternatesForLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const isEs = locale === "es";

  return {
    title: isEs ? "Últimas Noticias" : "Latest News",
    description: isEs
      ? "Las últimas noticias del FC Barcelona, crónicas de partidos y resúmenes semanales con IA. Mantente al día con todo lo que pasa en el club."
      : "The latest FC Barcelona news, match chronicles, and weekly digests powered by AI. Stay updated with everything happening at the club.",
    openGraph: {
      title: isEs ? "Últimas Noticias FC Barcelona | Friends of Barça" : "FC Barcelona Latest News | Friends of Barça",
      description: isEs
        ? "Resúmenes de noticias y crónicas de partidos del FC Barcelona impulsados por IA."
        : "AI-powered news digests and match chronicles for FC Barcelona fans.",
      type: "website",
      locale: isEs ? "es_ES" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_ES",
      images: ["/images/packages/camp-nou-match.jpg"],
    },
    alternates: localizedAlternatesForLocale("/news", locale),
  };
}

export const revalidate = 300;

export default async function NewsPage() {
  const heroArticles = await prisma.newsArticle.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const serialized = heroArticles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    titleEs: article.titleEs,
    excerpt: article.excerpt,
    excerptEs: article.excerptEs,
    coverImage: article.coverImage,
    category: article.category,
    matchResult: article.matchResult,
    publishedAt: article.publishedAt.toISOString(),
  }));

  return <NewsPageClient heroArticles={serialized} />;
}
