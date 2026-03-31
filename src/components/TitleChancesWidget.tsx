'use client';

import { useLanguage, useLocalePath } from '@/lib/LanguageContext';
import Link from 'next/link';

interface CompetitionChance {
  id: string;
  name: string;
  titlePct: number;
}

const COMP_META: Record<string, { icon: string; gradient: string; ring: string }> = {
  'la-liga': { icon: '\u{1F1EA}\u{1F1F8}', gradient: 'from-red-500 to-yellow-500', ring: '#ef4444' },
  'champions-league': { icon: '\u2B50', gradient: 'from-blue-500 to-indigo-500', ring: '#3b82f6' },
  'copa-del-rey': { icon: '\u{1F3C6}', gradient: 'from-amber-500 to-orange-500', ring: '#f59e0b' },
};

function MiniRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const sw = 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-extrabold text-[#1A1A2E]">{pct}%</span>
      </div>
    </div>
  );
}

export default function TitleChancesWidget({ competitions }: { competitions: CompetitionChance[] }) {
  const { t } = useLanguage();
  const lp = useLocalePath();

  if (!competitions || competitions.length === 0) return null;

  const active = competitions.filter(c => c.titlePct > 0);
  if (active.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 -mt-4 mb-8 relative z-10">
      <Link href={lp("/competitions")} className="block">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 px-6 py-4 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wide flex items-center gap-2">
              <span className="text-base">&#129302;</span>
              {t("comp.titleChances")}
            </h3>
            <span className="text-xs text-gray-400">{t("comp.aiPredictions")}</span>
          </div>
          <div className={`grid gap-4 ${active.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : active.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {active.map((comp) => {
              const meta = COMP_META[comp.id] || COMP_META['la-liga'];
              return (
                <div key={comp.id} className="flex items-center gap-3">
                  <MiniRing pct={comp.titlePct} color={meta.ring} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-sm font-semibold text-[#1A1A2E] truncate">{comp.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">{t("comp.titleChance")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
    </section>
  );
}
