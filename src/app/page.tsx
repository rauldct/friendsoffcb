import dynamic from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import NextMatchesCarousel from "@/components/NextMatchesCarousel";
import LatestResult from "@/components/LatestResult";
import FeaturedPackages from "@/components/FeaturedPackages";
import LatestNews from "@/components/LatestNews";
import TitleChancesWidget from "@/components/TitleChancesWidget";
import prisma from "@/lib/prisma";

const NewsletterSection = dynamic(() => import("@/components/NewsletterSection"));

export const revalidate = 300;

export default async function HomePage() {
  const [packages, newsArticles, matches, latestChronicle, competitionsData] = await Promise.all([
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
    prisma.newsArticle.findFirst({
      where: { status: "published", category: "chronicle", matchResult: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { title: true, titleEs: true, slug: true, matchResult: true, matchDate: true, excerpt: true, excerptEs: true, coverImage: true, publishedAt: true },
    }),
    prisma.competitionData.findMany({
      where: { active: true },
      select: { id: true, name: true, aiStructuredData: true },
    }),
  ]);

  const serializedPackages = packages.map(p => ({
    ...p,
    matchDate: p.matchDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lastSyncedAt: p.lastSyncedAt?.toISOString() || null,
    tickets: p.tickets as any[],
    hotels: p.hotels as any[],
    activities: p.activities as any[],
  }));

  const serializedNews = newsArticles.map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    titleEs: a.titleEs,
    excerpt: a.excerpt,
    excerptEs: a.excerptEs,
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

  // Find opponent info from Match table for the latest chronicle
  // First try matching by opponent name from chronicle title, then fallback to date
  let opponentCrest: string | null = null;
  let opponentName: string | null = null;
  let matchVenue: string | null = null;
  if (latestChronicle?.matchDate) {
    const d = new Date(latestChronicle.matchDate);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const matchRecords = await prisma.match.findMany({
      where: { date: { gte: start, lt: end } },
      select: { opponent: true, opponentLogo: true, venue: true, date: true },
    });
    let matchRecord = matchRecords[0] || null;
    if (matchRecords.length > 1) {
      // Multiple matches same day: match by opponent name from chronicle title
      const titleLower = latestChronicle.title.toLowerCase();
      const byName = matchRecords.find(m => {
        const oppWords = m.opponent.toLowerCase().split(/\s+/);
        // Match if any significant word (>3 chars) of opponent name appears in title
        return oppWords.some(w => w.length > 3 && titleLower.includes(w));
      });
      matchRecord = byName || matchRecords[0];
    }
    if (matchRecord) {
      opponentCrest = matchRecord.opponentLogo || null;
      opponentName = matchRecord.opponent;
      matchVenue = matchRecord.venue;
    }
  }

  const titleChances = competitionsData.map(c => {
    const data = c.aiStructuredData as Record<string, unknown> | null;
    return {
      id: c.id,
      name: c.name,
      titlePct: Number(data?.titlePct) || 0,
    };
  });

  return (
    <>
      <HeroSection />
      <TitleChancesWidget competitions={titleChances} />
      <NextMatchesCarousel matches={serializedMatches} />
      {latestChronicle && latestChronicle.matchResult && (
        <LatestResult
          title={latestChronicle.title}
          titleEs={latestChronicle.titleEs}
          slug={latestChronicle.slug}
          matchResult={latestChronicle.matchResult}
          matchDate={(latestChronicle.matchDate || latestChronicle.publishedAt).toISOString()}
          excerpt={latestChronicle.excerpt}
          excerptEs={latestChronicle.excerptEs}
          coverImage={latestChronicle.coverImage}
          opponentCrest={opponentCrest}
          opponentName={opponentName}
          venue={matchVenue}
        />
      )}
      <FeaturedPackages packages={serializedPackages} />
      <LatestNews articles={serializedNews} />
      <NewsletterSection />
    </>
  );
}
