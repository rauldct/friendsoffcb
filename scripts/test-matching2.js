function getTeamKey(name) {
  return name.toLowerCase()
    .replace(/\b(fc|cf|ud|cd|rcd|rc|ca|sd|club|de|del|la)\b/g, '')
    .replace(/[^a-záéíóúñü]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function teamsMatch(name1, name2) {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;
  const k1 = getTeamKey(name1);
  const k2 = getTeamKey(name2);
  if (k1 === k2) return true;
  const w1 = k1.split(' ').filter(w => w.length > 2).sort();
  const w2 = k2.split(' ').filter(w => w.length > 2).sort();
  if (w1.length > 0 && w1.length === w2.length && w1.every((w, i) => w === w2[i])) return true;
  return false;
}

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const comp = await p.competitionData.findUnique({ where: { id: 'la-liga' } });
  const sd = comp.aiStructuredData;
  const af = sd.allFixtures || [];
  const pp = sd.projectedPoints || [];

  console.log('allFixtures:', af.length, '\n');

  for (const entry of pp) {
    const matches = af.filter(f => teamsMatch(entry.team, f.h) || teamsMatch(entry.team, f.a))
      .filter(f => !(teamsMatch(entry.team, f.h) && teamsMatch(entry.team, f.a)));
    const pts = matches.reduce((s, f) => {
      const home = teamsMatch(entry.team, f.h);
      const tg = home ? f.hs : f.as;
      const og = home ? f.as : f.hs;
      return s + (tg > og ? 3 : tg === og ? 1 : 0);
    }, 0);
    const standingRow = comp.standings.find(s => teamsMatch(s.teamName, entry.team));
    const currentPts = standingRow ? standingRow.points : '?';
    console.log(`${entry.team} (key: "${getTeamKey(entry.team)}")`);
    console.log(`  ${matches.length} fixtures, +${pts} predicted, current: ${currentPts}, projected: ${entry.projected}`);
  }

  // Cross-check: test some known problem pairs
  console.log('\n--- Cross-checks ---');
  console.log('FC Barcelona vs RCD Espanyol de Barcelona:', teamsMatch('FC Barcelona', 'RCD Espanyol de Barcelona'));
  console.log('Real Madrid CF vs Club Atlético de Madrid:', teamsMatch('Real Madrid CF', 'Club Atlético de Madrid'));
  console.log('FC Barcelona vs FC Barcelona:', teamsMatch('FC Barcelona', 'FC Barcelona'));
  console.log('Real Madrid CF vs Real Madrid:', teamsMatch('Real Madrid CF', 'Real Madrid'));

  await p.$disconnect();
})();
