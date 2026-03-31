'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

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

interface PredictionInfoProps {
  title: string;
  prediction: string;
  explanation: string;
}

export function ProbabilityBoxes({ winPct, drawPct, lossPct, t }: { winPct: number; drawPct: number; lossPct: number; t: (k: string) => string }) {
  const boxes = [
    { pct: winPct, label: t("comp.winProb"), color: 'bg-green-500', bgLight: 'bg-green-50', text: 'text-green-700' },
    { pct: drawPct, label: t("comp.drawProb"), color: 'bg-yellow-500', bgLight: 'bg-yellow-50', text: 'text-yellow-700' },
    { pct: lossPct, label: t("comp.lossProb"), color: 'bg-red-500', bgLight: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {boxes.map((box) => (
        <div key={box.label} className={`${box.bgLight} rounded-xl p-3 text-center`}>
          <div className={`text-2xl font-extrabold ${box.text}`}>{box.pct}%</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">{box.label}</div>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${box.color} rounded-full transition-all`} style={{ width: `${box.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface MatchPrediction {
  opponent: string;
  venue: string;
  prediction: string;
  score: string;
  points: number;
  reason: string;
}

export interface FixturePrediction {
  h: string;
  a: string;
  hs: number;
  as: number;
}

interface BracketRound {
  round: string;
  opponent: string;
  winPct: number;
  reason: string;
}

function getTeamKey(name: string): string {
  // Extract distinctive part - keep "real" (distinguishes Real Madrid from Atlético Madrid)
  return name.toLowerCase()
    .replace(/\b(fc|cf|ud|cd|rcd|rc|ca|sd|club|de|del|la)\b/g, '')
    .replace(/[^a-záéíóúñü]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function teamsMatch(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;

  const k1 = getTeamKey(name1);
  const k2 = getTeamKey(name2);
  if (k1 === k2) return true;

  // Compare word sets - must be identical to avoid "barcelona" matching both FC Barcelona and Espanyol de Barcelona
  const w1 = k1.split(' ').filter(w => w.length > 2).sort();
  const w2 = k2.split(' ').filter(w => w.length > 2).sort();
  if (w1.length > 0 && w1.length === w2.length && w1.every((w, i) => w === w2[i])) return true;

  return false;
}

function teamMatchesFromFixtures(teamName: string, allFixtures: FixturePrediction[]): MatchPrediction[] {
  return allFixtures
    .filter(f => teamsMatch(teamName, f.h) || teamsMatch(teamName, f.a))
    .filter(f => !(teamsMatch(teamName, f.h) && teamsMatch(teamName, f.a))) // exclude self-match edge case
    .map(f => {
      const home = teamsMatch(teamName, f.h);
      const teamGoals = home ? f.hs : f.as;
      const oppGoals = home ? f.as : f.hs;
      const opponent = home ? f.a : f.h;
      const prediction = teamGoals > oppGoals ? 'W' : teamGoals === oppGoals ? 'D' : 'L';
      const points = prediction === 'W' ? 3 : prediction === 'D' ? 1 : 0;
      const score = home ? `${f.hs}-${f.as}` : `${f.as}-${f.hs}`;

      return { opponent, venue: home ? 'H' : 'A', prediction, score, points, reason: '' };
    });
}

function TeamInfoPopover({ team, current, projected, played, allFixtures, t, onClose }: {
  team: string;
  current: number;
  projected: number;
  played: number;
  allFixtures: FixturePrediction[];
  t: (k: string) => string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const matchByMatch = teamMatchesFromFixtures(team, allFixtures);
  const predictedGain = matchByMatch.reduce((sum, m) => sum + m.points, 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const resultColor = (pred: string) => {
    if (pred === 'W') return 'text-green-600 bg-green-50';
    if (pred === 'D') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72 text-left max-h-80 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#1A1A2E] truncate max-w-[80%]">{team}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">&times;</button>
      </div>

      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span>{t("comp.current")}: <span className="font-semibold text-[#1A1A2E]">{current} pts</span> ({played} PJ)</span>
        <span>&rarr; <span className="font-bold text-[#004D98]">{projected}</span></span>
      </div>

      {matchByMatch.length > 0 ? (
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{t("comp.matchBreakdown")}</div>
          <div className="space-y-1">
            {matchByMatch.map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${resultColor(m.prediction)}`}>
                  {m.prediction}
                </span>
                <span className="text-gray-500 w-3 flex-shrink-0">{m.venue === 'H' ? 'L' : 'V'}</span>
                <span className="text-gray-700 truncate flex-1">{m.opponent}</span>
                <span className="font-mono text-gray-500 flex-shrink-0">{m.score}</span>
                <span className="font-bold text-[#1A1A2E] w-4 text-right flex-shrink-0">+{m.points}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-2 pt-1.5 flex justify-between text-xs">
            <span className="text-gray-500">{current} + {predictedGain} ({matchByMatch.length} part.)</span>
            <span className="font-bold text-[#004D98]">= {current + predictedGain} pts</span>
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-gray-400 italic">{t("comp.aiAdjusted")}</div>
      )}
    </div>
  );
}

export function BracketView({ bracketRounds, t }: { bracketRounds: BracketRound[]; t: (k: string) => string }) {
  if (!bracketRounds || bracketRounds.length === 0) return null;

  const roundColor = (pct: number) => {
    if (pct >= 60) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
    if (pct >= 35) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
  };

  return (
    <div>
      <h5 className="text-xs font-medium text-gray-500 mb-3">{t("comp.bracketPath")}</h5>
      <div className="space-y-2">
        {bracketRounds.map((round, i) => {
          const colors = roundColor(round.winPct);
          return (
            <div key={i} className={`flex items-center gap-3 ${colors.bg} border ${colors.border} rounded-lg px-3 py-2`}>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-gray-400 uppercase">{round.round}</div>
                <div className="text-xs font-medium text-gray-700 truncate">{t("comp.vs")} {round.opponent}</div>
                <div className="text-[10px] text-gray-500 truncate">{round.reason}</div>
              </div>
              <div className={`text-lg font-extrabold ${colors.text} flex-shrink-0`}>
                {round.winPct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectedPointsBars({
  projectedPoints,
  standings,
  allFixtures,
  t,
}: {
  projectedPoints: Array<{ team: string; projected: number }>;
  standings: StandingRow[];
  allFixtures?: FixturePrediction[];
  t: (k: string) => string;
}) {
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  if (!projectedPoints || projectedPoints.length === 0) return null;

  const maxProjected = Math.max(...projectedPoints.map(p => p.projected), 1);

  const getTeamData = (teamName: string): { points: number; played: number } => {
    const row = standings.find(s =>
      s.teamName.toLowerCase().includes(teamName.toLowerCase().split(' ')[0]) ||
      teamName.toLowerCase().includes(s.teamName.toLowerCase().split(' ')[0])
    );
    return { points: row?.points ?? 0, played: row?.played ?? 0 };
  };

  const isBarca = (name: string) =>
    name.toLowerCase().includes('barcelona') || name.toLowerCase().includes('barça');

  // Recalculate projected points from fixtures so bar chart and breakdown always match
  const computedProjections = projectedPoints.slice(0, 6).map((entry) => {
    const teamData = getTeamData(entry.team);
    if (allFixtures && allFixtures.length > 0) {
      const matches = teamMatchesFromFixtures(entry.team, allFixtures);
      if (matches.length > 0) {
        const gain = matches.reduce((sum, m) => sum + m.points, 0);
        return { ...entry, projected: teamData.points + gain };
      }
    }
    return entry;
  });

  const maxComputed = Math.max(...computedProjections.map(p => p.projected), 1);

  return (
    <div className="space-y-2.5">
      {computedProjections.map((entry) => {
        const teamData = getTeamData(entry.team);
        const projWidth = (entry.projected / maxComputed) * 100;
        const currentWidth = (teamData.points / maxComputed) * 100;
        const barca = isBarca(entry.team);

        return (
          <div key={entry.team} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium truncate max-w-[55%] ${barca ? 'text-[#A50044] font-bold' : 'text-gray-700'}`}>
                {entry.team}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400">{teamData.points} &rarr; </span>
                <span className={`font-bold ${barca ? 'text-[#A50044]' : 'text-[#1A1A2E]'}`}>{entry.projected}</span>
                <button
                  onClick={() => setOpenTeam(openTeam === entry.team ? null : entry.team)}
                  className="w-4 h-4 rounded-full bg-[#004D98] text-white text-[9px] font-bold flex items-center justify-center hover:bg-[#003a75] transition-colors flex-shrink-0"
                  title="Info"
                >
                  i
                </button>
              </div>
            </div>
            <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${barca ? 'bg-[#A50044]/20' : 'bg-[#004D98]/10'}`}
                style={{ width: `${projWidth}%` }}
              />
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${barca ? 'bg-[#A50044]' : 'bg-[#004D98]/60'}`}
                style={{ width: `${currentWidth}%` }}
              />
            </div>
            {openTeam === entry.team && (
              <TeamInfoPopover
                team={entry.team}
                current={teamData.points}
                projected={entry.projected}
                played={teamData.played}
                allFixtures={allFixtures || []}
                t={t}
                onClose={() => setOpenTeam(null)}
              />
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-4 justify-end mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded bg-[#004D98]/60" />
          <span className="text-[10px] text-gray-500">{t("comp.current")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded bg-[#004D98]/10 border border-[#004D98]/20" />
          <span className="text-[10px] text-gray-500">{t("comp.projected")}</span>
        </div>
      </div>
    </div>
  );
}

export function ProgressRing({ percentage, label, size = 100 }: { percentage: number; label: string; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 60 ? '#22c55e' : percentage >= 30 ? '#eab308' : '#ef4444';
  const bgColor = percentage >= 60 ? '#dcfce7' : percentage >= 30 ? '#fef9c3' : '#fee2e2';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ backgroundColor: bgColor }}
        >
          <span className="text-xl font-extrabold" style={{ color }}>{percentage}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 mt-2 text-center">{label}</span>
    </div>
  );
}

export default function PredictionInfo({
  title,
  prediction,
  explanation,
}: PredictionInfoProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (!prediction) return null;

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        <p className="text-sm text-gray-700 flex-1">{prediction}</p>
        {explanation && (
          <button
            onClick={() => setOpen(!open)}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-[#004D98] text-white text-xs font-bold flex items-center justify-center hover:bg-[#003a75] transition-colors"
            aria-label="More info"
            title={t("comp.aiAnalysis")}
          >
            i
          </button>
        )}
      </div>

      {open && explanation && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-[#1A1A2E] text-lg">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                &times;
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-[#004D98]">{prediction}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
            <p className="text-xs text-gray-400 mt-4 italic">
              {t("comp.aiDisclaimer")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
