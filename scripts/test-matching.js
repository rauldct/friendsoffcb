// Simulate the matching logic from PredictionInfo.tsx
function getTeamKey(name) {
  return name.toLowerCase()
    .replace(/\b(fc|cf|ud|cd|rcd|rc|ca|sd|club|real|de|del|la)\b/g, '')
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
  const k1words = k1.split(' ').filter(w => w.length > 3);
  const k2words = k2.split(' ').filter(w => w.length > 3);
  return k1words.some(w => k2words.includes(w)) || k2words.some(w => k1words.includes(w));
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
    const standingRow = comp.standings.find(s =>
      teamsMatch(s.teamName, entry.team)
    );
    const currentPts = standingRow ? standingRow.points : '?';
    console.log(`${entry.team} (key: "${getTeamKey(entry.team)}")`);
    console.log(`  ${matches.length} fixtures, +${pts} predicted, current: ${currentPts}, total: ${Number(currentPts) + pts}, AI projected: ${entry.projected}`);
    if (matches.length <= 20) {
      matches.forEach(f => {
        const home = teamsMatch(entry.team, f.h);
        const opp = home ? f.a : f.h;
        const r = (home ? f.hs : f.as) > (home ? f.as : f.hs) ? 'W' : (home ? f.hs : f.as) === (home ? f.as : f.hs) ? 'D' : 'L';
        console.log(`    [${r}] ${home ? 'H' : 'A'} vs ${opp} (${f.hs}-${f.as})`);
      });
    }
    console.log('');
  }

  await p.$disconnect();
})();
