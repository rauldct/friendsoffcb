const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const subs = await prisma.subscriber.findMany({ orderBy: { subscribedAt: 'desc' } });
  const opens = await prisma.newsletterOpen.groupBy({
    by: ['subscriberId'],
    _count: { id: true },
  });
  const openMap = new Map(opens.map(o => [o.subscriberId, o._count.id]));

  console.log(`Total: ${subs.length} subscribers\n`);
  console.log('EMAIL'.padEnd(45), 'OPENS', 'DAYS', 'SRC'.padEnd(20), 'LANG', 'ACTIVE');
  console.log('-'.repeat(110));

  for (const s of subs) {
    const totalOpens = openMap.get(s.id) || 0;
    const days = Math.floor((Date.now() - new Date(s.subscribedAt).getTime()) / 86400000);
    console.log(
      s.email.padEnd(45),
      String(totalOpens).padStart(5),
      String(days).padStart(4) + 'd',
      s.source.padEnd(20),
      s.language.padEnd(4),
      s.active ? 'yes' : 'NO'
    );
  }

  await prisma.$disconnect();
})();
