import HeroSection from "@/components/HeroSection";
import NextMatchesCarousel from "@/components/NextMatchesCarousel";
import FeaturedPackages from "@/components/FeaturedPackages";
import LatestNews from "@/components/LatestNews";
import NewsletterSection from "@/components/NewsletterSection";
import prisma from "@/lib/prisma";

export const revalidate = 300;

export default async function HomePage() {
  const [packages, posts, matches] = await Promise.all([
    prisma.matchPackage.findMany({
      where: { featured: true, status: "upcoming" },
      orderBy: { matchDate: "asc" },
      take: 6,
    }),
    prisma.blogPost.findMany({
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

  const serializedPosts = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
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
      <LatestNews posts={serializedPosts} />
      <NewsletterSection />
    </>
  );
}
