const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const comp = await p.competitionData.findUnique({ where: { id: 'la-liga' } });
  const all = comp.nextMatches;
  const upcoming = all.filter(m => m.type === 'upcoming' || !m.type);
  const results = all.filter(m => m.type === 'result');
  console.log('Total nextMatches:', all.length);
  console.log('Upcoming:', upcoming.length, '| Results:', results.length);
  console.log('Played:', comp.barcaPlayed, '| Should remain:', 38 - comp.barcaPlayed);
  console.log('matchByMatch count:', (comp.aiStructuredData.matchByMatch || []).length);
  await p.$disconnect();
})();
