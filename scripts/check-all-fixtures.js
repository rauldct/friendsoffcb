const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const comp = await p.competitionData.findUnique({ where: { id: 'la-liga' } });
  const sd = comp.aiStructuredData;
  const af = sd.allFixtures || [];
  console.log('allFixtures count:', af.length);

  if (af.length > 0) {
    console.log('\nFirst 5 fixtures:');
    af.slice(0, 5).forEach((f, i) => console.log(`  ${i+1}. ${f.h} ${f.hs}-${f.as} ${f.a}`));
    console.log('...');
    console.log(`Last fixture: ${af[af.length-1].h} ${af[af.length-1].hs}-${af[af.length-1].as} ${af[af.length-1].a}`);
  }

  // Check per-team compilation for top 6
  const pp = sd.projectedPoints || [];
  console.log('\nProjected points:', pp.map(p => `${p.team}: ${p.projected}`).join(', '));

  // Compile for Real Madrid as test
  const teams = ['FC Barcelona', 'Real Madrid', 'Atlético', 'Villarreal', 'Betis', 'Espanyol'];
  for (const team of teams) {
    const tn = team.toLowerCase().split(' ')[0];
    const matches = af.filter(f =>
      f.h.toLowerCase().includes(tn) || f.a.toLowerCase().includes(tn)
    );
    const pts = matches.reduce((s, f) => {
      const isHome = f.h.toLowerCase().includes(tn);
      const tg = isHome ? f.hs : f.as;
      const og = isHome ? f.as : f.hs;
      return s + (tg > og ? 3 : tg === og ? 1 : 0);
    }, 0);
    console.log(`${team}: ${matches.length} matches, +${pts} predicted pts`);
  }

  await p.$disconnect();
})();
