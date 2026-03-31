import { Metadata } from "next";
import prisma from "@/lib/prisma";
import CompetitionsClient from "@/components/CompetitionsClient";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "FC Barcelona's current standings and AI predictions across La Liga and Champions League. Updated daily with expert analysis.",
  openGraph: {
    title: "FC Barcelona Competitions | Friends of Barça",
    description:
      "Track Barcelona's progress in La Liga and Champions League with AI-powered predictions and analysis.",
    type: "website",
    images: [{ url: "/images/packages/camp-nou-aerial.jpg", alt: "Spotify Camp Nou" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FC Barcelona Competitions",
    description: "Standings, stats & AI predictions for La Liga and Champions League.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/competitions",
    languages: { "en": "https://friendsofbarca.com/competitions", "es": "https://friendsofbarca.com/es/competitions", "x-default": "https://friendsofbarca.com/competitions" },
  },
};

export const revalidate = 3600; // 1 hour ISR

export default async function CompetitionsPage() {
  const competitions = await prisma.competitionData.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  const serialized = competitions.map((comp) => ({
    id: comp.id,
    name: comp.name,
    season: comp.season,
    barcaPosition: comp.barcaPosition,
    barcaPoints: comp.barcaPoints,
    barcaPlayed: comp.barcaPlayed,
    barcaWon: comp.barcaWon,
    barcaDraw: comp.barcaDraw,
    barcaLost: comp.barcaLost,
    barcaGoalsFor: comp.barcaGoalsFor,
    barcaGoalsAgainst: comp.barcaGoalsAgainst,
    standings: comp.standings as unknown as {
      position: number;
      teamName: string;
      teamCrest: string;
      teamId: number;
      played: number;
      won: number;
      draw: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
    }[],
    nextMatches: comp.nextMatches as unknown as {
      id: number;
      date: string;
      homeTeam: string;
      homeCrest: string;
      awayTeam: string;
      awayCrest: string;
      isHome: boolean;
      type?: 'upcoming' | 'result';
      homeGoals?: number | null;
      awayGoals?: number | null;
    }[],
    aiPrediction: comp.aiPrediction,
    aiPredictionEs: comp.aiPredictionEs,
    aiExplanation: comp.aiExplanation,
    aiExplanationEs: comp.aiExplanationEs,
    seasonForecast: comp.seasonForecast,
    seasonForecastEs: comp.seasonForecastEs,
    seasonExplanation: comp.seasonExplanation,
    seasonExplanationEs: comp.seasonExplanationEs,
    aiStructuredData: comp.aiStructuredData as Record<string, unknown> || {},
    updatedAt: comp.updatedAt.toISOString(),
  }));

  const compJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "FC Barcelona Competitions & Predictions",
    description: "FC Barcelona standings, statistics, and AI predictions for La Liga and Champions League.",
    url: "https://friendsofbarca.com/competitions",
    mainEntity: serialized.map(c => ({
      "@type": "SportsEvent",
      name: c.name,
      description: `FC Barcelona in ${c.name} ${c.season}`,
      eventStatus: "https://schema.org/EventScheduled",
    })),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://friendsofbarca.com" },
    { name: "Competitions", url: "https://friendsofbarca.com/competitions" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(compJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <CompetitionsClient competitions={serialized} />
    </>
  );
}
