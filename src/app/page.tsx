import HeroSection from "@/components/HeroSection";
import NextMatchesCarousel from "@/components/NextMatchesCarousel";
import FeaturedPackages from "@/components/FeaturedPackages";
import LatestNews from "@/components/LatestNews";
import NewsletterSection from "@/components/NewsletterSection";
import prisma from "@/lib/prisma";

export const revalidate = 300;

export default async function HomePage() {
  const [packages, newsArticles, matches] = await Promise.all([
    prisma.matchPackage.findMany({
      where: { featured: true, status: "upcoming" },
      orderBy: { matchDate: "asc" },
      take: 6,
    }),
    prisma.newsArticle.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.match.findMany({
      orderBy: { date: "asc" },
      where: { date: { gte: new Date() } },
    }),
  ]);

  const serializedPackages = packages.map(p => ({
    ...p,
    matchDate: p.matchDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    tickets: p.tickets as any[],
    hotels: p.hotels as any[],
    activities: p.activities as any[],
  }));

  const serializedNews = newsArticles.map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    coverImage: a.coverImage,
    category: a.category,
    author: a.author,
    matchResult: a.matchResult,
    publishedAt: a.publishedAt.toISOString(),
  }));

  const serializedMatches = matches.map(m => ({
    ...m,
    date: m.date.toISOString(),
  }));

  return (
    <>
      <HeroSection />
      <NextMatchesCarousel matches={serializedMatches} />
      <FeaturedPackages packages={serializedPackages} />
      <LatestNews articles={serializedNews} />
      <NewsletterSection />
    </>
  );
}
