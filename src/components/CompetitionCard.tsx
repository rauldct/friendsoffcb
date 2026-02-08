'use client';

import PredictionInfo from './PredictionInfo';

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

interface CompetitionCardProps {
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
  aiExplanation: string;
  seasonForecast: string;
  seasonExplanation: string;
  updatedAt: string;
}

const COMP_ICONS: Record<string, string> = {
  'la-liga': '\u{1F1EA}\u{1F1F8}',
  'champions-league': '\u2B50',
  'copa-del-rey': '\u{1F3C6}',
};

const COMP_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  'la-liga': { bg: 'bg-gradient-to-r from-red-50 to-yellow-50', border: 'border-red-200', accent: 'text-red-700' },
  'champions-league': { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50', border: 'border-blue-200', accent: 'text-blue-700' },
  'copa-del-rey': { bg: 'bg-gradient-to-r from-amber-50 to-orange-50', border: 'border-amber-200', accent: 'text-amber-700' },
};

const BARCA_TEAM_ID = 529;

export default function CompetitionCard({
  id,
  name,
  season,
  barcaPosition,
  barcaPoints,
  barcaPlayed,
  barcaWon,
  barcaDraw,
  barcaLost,
  barcaGoalsFor,
  barcaGoalsAgainst,
  standings,
  nextMatches,
  aiPrediction,
  aiExplanation,
  seasonForecast,
  seasonExplanation,
  updatedAt,
}: CompetitionCardProps) {
  const colors = COMP_COLORS[id] || COMP_COLORS['la-liga'];
  const icon = COMP_ICONS[id] || '\u{1F3C6}';
  const gd = barcaGoalsFor - barcaGoalsAgainst;

  const upcomingMatches = nextMatches.filter(m => m.type === 'upcoming' || !m.type);
  const recentResults = nextMatches.filter(m => m.type === 'result');

  return (
    <div className={`rounded-2xl border ${colors.border} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className={`${colors.bg} px-6 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="text-xl font-heading font-bold text-[#1A1A2E]">{name}</h2>
              <p className="text-xs text-gray-500">Season {season}</p>
            </div>
          </div>
          {barcaPosition > 0 && (
            <div className="text-center">
              <div className={`text-3xl font-heading font-extrabold ${colors.accent}`}>
                #{barcaPosition}
              </div>
              <div className="text-xs text-gray-500">{barcaPoints} pts</div>
            </div>
          )}
        </div>

        {/* Barca Quick Stats */}
        {barcaPlayed > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{barcaWon}</div>
              <div className="text-[10px] text-gray-500 uppercase">Won</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-600">{barcaDraw}</div>
              <div className="text-[10px] text-gray-500 uppercase">Draw</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-600">{barcaLost}</div>
              <div className="text-[10px] text-gray-500 uppercase">Lost</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <div className={`text-lg font-bold ${gd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {gd > 0 ? '+' : ''}{gd}
              </div>
              <div className="text-[10px] text-gray-500 uppercase">GD</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Standings Table */}
        {standings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Standings</h3>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b">
                    <th className="text-left py-2 px-2 w-8">#</th>
                    <th className="text-left py-2 px-2">Team</th>
                    <th className="text-center py-2 px-1 w-8">PL</th>
                    <th className="text-center py-2 px-1 w-8">W</th>
                    <th className="text-center py-2 px-1 w-8">D</th>
                    <th className="text-center py-2 px-1 w-8">L</th>
                    <th className="text-center py-2 px-1 w-10">GD</th>
                    <th className="text-center py-2 px-2 w-10 font-bold">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => {
                    const isBarca = row.teamId === BARCA_TEAM_ID;
                    return (
                      <tr
                        key={row.position}
                        className={`border-b border-gray-50 ${
                          isBarca ? 'bg-[#A50044]/5 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2 px-2 text-gray-400">{row.position}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            {row.teamCrest && (
                              <img
                                src={row.teamCrest}
                                alt=""
                                className="w-4 h-4 object-contain"
                                loading="lazy"
                              />
                            )}
                            <span className={isBarca ? 'text-[#A50044]' : 'text-gray-700'}>
                              {row.teamName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-1 text-center text-gray-500">{row.played}</td>
                        <td className="py-2 px-1 text-center text-gray-500">{row.won}</td>
                        <td className="py-2 px-1 text-center text-gray-500">{row.draw}</td>
                        <td className="py-2 px-1 text-center text-gray-500">{row.lost}</td>
                        <td className="py-2 px-1 text-center text-gray-500">
                          {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                        </td>
                        <td className={`py-2 px-2 text-center font-bold ${isBarca ? 'text-[#A50044]' : 'text-[#1A1A2E]'}`}>
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming Matches</h3>
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    {m.homeCrest && <img src={m.homeCrest} alt="" className="w-5 h-5 object-contain" loading="lazy" />}
                    <span className={`text-sm font-medium ${m.isHome ? 'text-[#A50044]' : 'text-gray-700'}`}>
                      {m.homeTeam}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 px-3">
                    {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!m.isHome ? 'text-[#A50044]' : 'text-gray-700'}`}>
                      {m.awayTeam}
                    </span>
                    {m.awayCrest && <img src={m.awayCrest} alt="" className="w-5 h-5 object-contain" loading="lazy" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Results</h3>
            <div className="space-y-2">
              {recentResults.map((m) => {
                const barcaGoals = m.isHome ? m.homeGoals : m.awayGoals;
                const oppGoals = m.isHome ? m.awayGoals : m.homeGoals;
                const isWin = barcaGoals != null && oppGoals != null && barcaGoals > oppGoals;
                const isDraw = barcaGoals != null && oppGoals != null && barcaGoals === oppGoals;
                const resultColor = isWin ? 'bg-green-50' : isDraw ? 'bg-yellow-50' : 'bg-red-50';
                return (
                  <div key={m.id} className={`flex items-center justify-between ${resultColor} rounded-lg px-4 py-3`}>
                    <div className="flex items-center gap-2">
                      {m.homeCrest && <img src={m.homeCrest} alt="" className="w-5 h-5 object-contain" loading="lazy" />}
                      <span className={`text-sm font-medium ${m.isHome ? 'text-[#A50044]' : 'text-gray-700'}`}>
                        {m.homeTeam}
                      </span>
                    </div>
                    <div className="text-center px-3">
                      <div className="text-sm font-bold text-[#1A1A2E]">
                        {m.homeGoals} - {m.awayGoals}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!m.isHome ? 'text-[#A50044]' : 'text-gray-700'}`}>
                        {m.awayTeam}
                      </span>
                      {m.awayCrest && <img src={m.awayCrest} alt="" className="w-5 h-5 object-contain" loading="lazy" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Predictions */}
        {(aiPrediction || seasonForecast) && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <span className="text-base">&#129302;</span> AI Predictions
            </h3>

            {aiPrediction && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="text-xs font-medium text-blue-500 uppercase mb-2">Next Match</div>
                <PredictionInfo
                  title={`${name} - Next Match Analysis`}
                  prediction={aiPrediction}
                  explanation={aiExplanation}
                />
              </div>
            )}

            {seasonForecast && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <div className="text-xs font-medium text-purple-500 uppercase mb-2">Season Forecast</div>
                <PredictionInfo
                  title={`${name} - Season Forecast`}
                  prediction={seasonForecast}
                  explanation={seasonExplanation}
                />
              </div>
            )}
          </div>
        )}

        {/* Updated at */}
        <div className="text-xs text-gray-400 text-right">
          Updated: {new Date(updatedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
