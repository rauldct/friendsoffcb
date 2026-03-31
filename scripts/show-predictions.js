const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const comp = await p.competitionData.findUnique({ where: { id: 'la-liga' } });
  const sd = comp.aiStructuredData;
  const mm = sd.matchByMatch || [];
  console.log(`Played: ${comp.barcaPlayed} | Remaining: ${38 - comp.barcaPlayed} | matchByMatch: ${mm.length}\n`);
  let totalPts = 0;
  mm.forEach((m, i) => {
    totalPts += m.points;
    const venue = m.venue === 'H' ? 'Casa ' : 'Fuera';
    console.log(`${String(i+1).padStart(2)}. [${m.prediction}] ${venue} vs ${m.opponent.padEnd(30)} ${m.score}  +${m.points}  ${m.reason}`);
  });
  console.log(`\nTotal: ${comp.barcaPoints} + ${totalPts} = ${comp.barcaPoints + totalPts} pts`);
  console.log(`Projected in data: ${sd.projectedPoints?.find(p => p.team.includes('Barcelona'))?.projected}`);
  await p.$disconnect();
})();
