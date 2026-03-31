'use client';

import { useLanguage } from '@/lib/LanguageContext';
import CompetitionCard from '@/components/CompetitionCard';

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

interface CompetitionItem {
  id: string;
  name: string;
  season: string;
  barcaPosition: number;
  barcaPoints: number;
  barcaPlayed: number;
  barcaWon: number;
  barcaDraw: number;
  barcaLost: number;
  barcaGoalsFor: number;
  barcaGoalsAgainst: number;
  standings: StandingRow[];
  nextMatches: MatchItem[];
  aiPrediction: string;
  aiPredictionEs: string;
  aiExplanation: string;
  aiExplanationEs: string;
  seasonForecast: string;
  seasonForecastEs: string;
  seasonExplanation: string;
  seasonExplanationEs: string;
  aiStructuredData: Record<string, unknown>;
  updatedAt: string;
}

interface CompetitionsClientProps {
  competitions: CompetitionItem[];
}

export default function CompetitionsClient({ competitions }: CompetitionsClientProps) {
  const { t } = useLanguage();

  const hasData = competitions.length > 0;

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-[#A50044]/10 text-[#A50044] uppercase tracking-wide mb-3">
            {competitions.length > 0 ? t("comp.season") + " " + competitions[0].season : t("comp.currentSeason")}
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            {t("comp.title")}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t("comp.desc")}
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
                standings={comp.standings}
                nextMatches={comp.nextMatches}
                aiPrediction={comp.aiPrediction}
                aiPredictionEs={comp.aiPredictionEs}
                aiExplanation={comp.aiExplanation}
                aiExplanationEs={comp.aiExplanationEs}
                seasonForecast={comp.seasonForecast}
                seasonForecastEs={comp.seasonForecastEs}
                seasonExplanation={comp.seasonExplanation}
                seasonExplanationEs={comp.seasonExplanationEs}
                aiStructuredData={comp.aiStructuredData}
                updatedAt={comp.updatedAt}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl max-w-2xl mx-auto">
            <div className="text-5xl mb-4">&#9917;</div>
            <h2 className="text-xl font-heading font-bold text-[#1A1A2E] mb-2">{t("comp.noData")}</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {t("comp.noDataDesc")}
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-[#004D98]/5 to-[#A50044]/5 rounded-2xl p-6 md:p-8">
            <h2 className="font-heading font-bold text-[#1A1A2E] text-lg mb-3">{t("comp.howItWorks")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-2xl">&#128202;</span>
                <div>
                  <div className="font-medium text-[#1A1A2E] mb-1">{t("comp.realTimeStats")}</div>
                  <p>{t("comp.realTimeStatsDesc")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">&#129504;</span>
                <div>
                  <div className="font-medium text-[#1A1A2E] mb-1">{t("comp.aiAnalysis")}</div>
                  <p>{t("comp.aiAnalysisDesc")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">&#128338;</span>
                <div>
                  <div className="font-medium text-[#1A1A2E] mb-1">{t("comp.dailyUpdates")}</div>
                  <p>{t("comp.dailyUpdatesDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
