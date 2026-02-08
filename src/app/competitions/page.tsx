import { Metadata } from "next";
import prisma from "@/lib/prisma";
import CompetitionCard from "@/components/CompetitionCard";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "FC Barcelona's current standings and AI predictions across La Liga, Champions League, and Copa del Rey. Updated daily with expert analysis.",
  openGraph: {
    title: "FC Barcelona Competitions | Friends of Barça",
    description:
      "Track Barcelona's progress in La Liga, Champions League, and Copa del Rey with AI-powered predictions and analysis.",
    type: "website",
    images: [{ url: "/images/packages/camp-nou-aerial.jpg", alt: "Spotify Camp Nou" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FC Barcelona Competitions",
    description: "Standings, stats & AI predictions for all Barcelona competitions.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/competitions",
  },
};

export const revalidate = 3600; // 1 hour ISR

interface StandingRow {
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
}

interface MatchItem {
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
}

export default async function CompetitionsPage() {
  const competitions = await prisma.competitionData.findMany({
    orderBy: { createdAt: "asc" },
  });

  const hasData = competitions.length > 0;

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-[#A50044]/10 text-[#A50044] uppercase tracking-wide mb-3">
            {competitions.length > 0 ? `Season ${competitions[0].season}` : 'Current Season'}
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            FC Barcelona Competitions
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Track Barcelona&apos;s progress across all competitions with real-time standings and AI-powered predictions
            based on statistics, form, and upcoming fixtures.
          </p>
        </div>

        {hasData ? (
          <div className="space-y-8 max-w-3xl mx-auto">
            {competitions.map((comp) => (
              <CompetitionCard
                key={comp.id}
                id={comp.id}
                name={comp.name}
                season={comp.season}
                barcaPosition={comp.barcaPosition}
                barcaPoints={comp.barcaPoints}
                barcaPlayed={comp.barcaPlayed}
                barcaWon={comp.barcaWon}
                barcaDraw={comp.barcaDraw}
                barcaLost={comp.barcaLost}
                barcaGoalsFor={comp.barcaGoalsFor}
                barcaGoalsAgainst={comp.barcaGoalsAgainst}
                standings={comp.standings as unknown as StandingRow[]}
                nextMatches={comp.nextMatches as unknown as MatchItem[]}
                aiPrediction={comp.aiPrediction}
                aiExplanation={comp.aiExplanation}
                seasonForecast={comp.seasonForecast}
                seasonExplanation={comp.seasonExplanation}
                updatedAt={comp.updatedAt.toISOString()}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl max-w-2xl mx-auto">
            <div className="text-5xl mb-4">&#9917;</div>
            <h2 className="text-xl font-heading font-bold text-[#1A1A2E] mb-2">No Competition Data Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Competition data is updated automatically every day. Check back soon!
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-[#004D98]/5 to-[#A50044]/5 rounded-2xl p-6 md:p-8">
            <h2 className="font-heading font-bold text-[#1A1A2E] text-lg mb-3">How AI Predictions Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-2xl">&#128202;</span>
                <div>
                  <div className="font-medium text-[#1A1A2E] mb-1">Real-Time Stats</div>
                  <p>Current standings, form, and results from official sources.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">&#129504;</span>
                <div>
                  <div className="font-medium text-[#1A1A2E] mb-1">AI Analysis</div>
                  <p>Claude AI analyzes trends, fixtures difficulty, and historical patterns.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">&#128338;</span>
                <div>
                  <div className="font-medium text-[#1A1A2E] mb-1">Daily Updates</div>
                  <p>Predictions refresh every day to reflect the latest results.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
