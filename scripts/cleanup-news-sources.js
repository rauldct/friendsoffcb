const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.newsArticle.findMany();
  let updated = 0;
  for (const article of articles) {
    const sources = article.sources || [];
    if (!Array.isArray(sources)) continue;
    const filtered = sources.filter(
      (s) => !['api-football.com', 'football-data.org'].includes(s.name)
    );
    if (filtered.length !== sources.length) {
      await prisma.newsArticle.update({
        where: { id: article.id },
        data: { sources: filtered },
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} articles (removed api-football.com/football-data.org sources)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
