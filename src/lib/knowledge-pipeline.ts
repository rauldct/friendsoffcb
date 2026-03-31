import prisma from "@/lib/prisma";

// ============== CONFIG ==============

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const EMBEDDING_MODEL = "all-minilm";
const EMBEDDING_DIM = 384;
const MAX_CHUNK_LENGTH = 1000;

// ============== TABLE SETUP ==============

let tableEnsured = false;

export async function ensureBarcaKnowledgeTable(): Promise<void> {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS barca_knowledge_chunks (
        id SERIAL PRIMARY KEY,
        source_type VARCHAR(50) NOT NULL,
        source_id VARCHAR(200) NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(${EMBEDDING_DIM}) NOT NULL,
        language VARCHAR(5) DEFAULT 'en',
        freshness_date TIMESTAMP DEFAULT NOW(),
        ttl_hours INT DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_bkc_source_type ON barca_knowledge_chunks (source_type)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_bkc_source_id ON barca_knowledge_chunks (source_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_bkc_language ON barca_knowledge_chunks (language)
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("[Knowledge] ensureBarcaKnowledgeTable error:", err);
  }
}

// ============== EMBEDDING ==============

async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.slice(0, 2000);
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: trimmed, options: { num_ctx: 4096 } }),
  });
  if (!res.ok) {
    throw new Error(`Ollama embedding error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding as number[];
}

// ============== CHUNKING HELPERS ==============

interface KnowledgeChunk {
  sourceType: string;
  sourceId: string;
  text: string;
  language: string;
  freshnessDate: Date;
  ttlHours: number;
  metadata: Record<string, string>;
}

function splitText(text: string, maxLen: number): string[] {
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cutAt = remaining.lastIndexOf("\n", maxLen);
    if (cutAt < maxLen * 0.3) cutAt = remaining.lastIndexOf(". ", maxLen);
    if (cutAt < maxLen * 0.3) cutAt = maxLen;
    parts.push(remaining.slice(0, cutAt + 1).trim());
    remaining = remaining.slice(cutAt + 1).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function createChunks(
  text: string,
  sourceType: string,
  sourceId: string,
  language: string,
  freshnessDate: Date,
  ttlHours: number,
  metadata: Record<string, string>
): KnowledgeChunk[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [{ sourceType, sourceId, text, language, freshnessDate, ttlHours, metadata }];
  }
  return splitText(text, MAX_CHUNK_LENGTH).map((part, i) => ({
    sourceType,
    sourceId,
    text: part,
    language,
    freshnessDate,
    ttlHours,
    metadata: { ...metadata, part: String(i + 1) },
  }));
}

// ============== INGESTION ==============

export async function ingestChunks(chunks: KnowledgeChunk[]): Promise<number> {
  await ensureBarcaKnowledgeTable();
  let created = 0;
  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.text);
      const embStr = `[${embedding.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO barca_knowledge_chunks (source_type, source_id, chunk_text, embedding, language, freshness_date, ttl_hours, metadata)
         VALUES ($1, $2, $3, $4::vector, $5, $6, $7, $8::jsonb)`,
        chunk.sourceType,
        chunk.sourceId,
        chunk.text,
        embStr,
        chunk.language,
        chunk.freshnessDate,
        chunk.ttlHours,
        JSON.stringify(chunk.metadata)
      );
      created++;
    } catch (e) {
      console.error(`[Knowledge] Ingest error (${chunk.sourceType}/${chunk.sourceId}): ${e instanceof Error ? e.message : e}`);
    }
  }
  return created;
}

export async function deleteChunksBySource(sourceType: string, sourceId: string): Promise<void> {
  await ensureBarcaKnowledgeTable();
  await prisma.$executeRawUnsafe(
    `DELETE FROM barca_knowledge_chunks WHERE source_type = $1 AND source_id = $2`,
    sourceType,
    sourceId
  );
}

// ============== INDEX EXISTING CONTENT ==============

export async function indexBlogPosts(): Promise<{ indexed: number; chunks: number }> {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    select: { id: true, slug: true, title: true, titleEs: true, excerpt: true, excerptEs: true, content: true, contentEs: true, category: true, tags: true, publishedAt: true },
  });

  let totalChunks = 0;
  for (const post of posts) {
    await deleteChunksBySource("blog", post.id);

    const chunks: KnowledgeChunk[] = [];
    const meta = { slug: post.slug, category: post.category, tags: post.tags.join(",") };

    // English content
    const enText = `Blog: ${post.title}\nCategory: ${post.category}\nTags: ${post.tags.join(", ")}\n\n${post.excerpt}\n\n${post.content}`;
    chunks.push(...createChunks(enText, "blog", post.id, "en", post.publishedAt, 0, meta));

    // Spanish content
    if (post.contentEs) {
      const esText = `Blog: ${post.titleEs || post.title}\nCategoría: ${post.category}\n\n${post.excerptEs || post.excerpt}\n\n${post.contentEs}`;
      chunks.push(...createChunks(esText, "blog", post.id, "es", post.publishedAt, 0, meta));
    }

    totalChunks += await ingestChunks(chunks);
  }

  return { indexed: posts.length, chunks: totalChunks };
}

export async function indexMatchPackages(): Promise<{ indexed: number; chunks: number }> {
  const packages = await prisma.matchPackage.findMany({
    select: {
      id: true, slug: true, matchTitle: true, matchTitleEs: true,
      competition: true, matchDate: true, opponent: true,
      description: true, descriptionEs: true,
      tickets: true, hotels: true, activities: true,
      tips: true, tipsEs: true, meetupInfo: true, meetupInfoEs: true,
      status: true,
    },
  });

  let totalChunks = 0;
  for (const pkg of packages) {
    await deleteChunksBySource("package", pkg.id);

    const chunks: KnowledgeChunk[] = [];
    const meta = { slug: pkg.slug, opponent: pkg.opponent, competition: pkg.competition, status: pkg.status };

    // English
    const ticketsStr = Array.isArray(pkg.tickets) ? (pkg.tickets as Array<{ name?: string; price?: string }>).map(t => `${t.name}: ${t.price}`).join(", ") : "";
    const hotelsStr = Array.isArray(pkg.hotels) ? (pkg.hotels as Array<{ name?: string; priceRange?: string }>).map(h => `${h.name}: ${h.priceRange}`).join(", ") : "";
    const enText = [
      `Match Package: ${pkg.matchTitle}`,
      `Opponent: ${pkg.opponent}`,
      `Competition: ${pkg.competition}`,
      `Date: ${pkg.matchDate.toISOString().slice(0, 10)}`,
      `Status: ${pkg.status}`,
      `\nDescription: ${pkg.description}`,
      ticketsStr ? `\nTickets: ${ticketsStr}` : "",
      hotelsStr ? `\nHotels: ${hotelsStr}` : "",
      pkg.tips.length > 0 ? `\nTips: ${pkg.tips.join("; ")}` : "",
      pkg.meetupInfo ? `\nMeetup: ${pkg.meetupInfo}` : "",
    ].filter(Boolean).join("\n");
    chunks.push(...createChunks(enText, "package", pkg.id, "en", pkg.matchDate, 0, meta));

    // Spanish
    if (pkg.descriptionEs) {
      const esText = [
        `Paquete de partido: ${pkg.matchTitleEs || pkg.matchTitle}`,
        `Rival: ${pkg.opponent}`,
        `Competición: ${pkg.competition}`,
        `Fecha: ${pkg.matchDate.toISOString().slice(0, 10)}`,
        `\nDescripción: ${pkg.descriptionEs}`,
        pkg.tipsEs.length > 0 ? `\nConsejos: ${pkg.tipsEs.join("; ")}` : "",
        pkg.meetupInfoEs ? `\nQuedada: ${pkg.meetupInfoEs}` : "",
      ].filter(Boolean).join("\n");
      chunks.push(...createChunks(esText, "package", pkg.id, "es", pkg.matchDate, 0, meta));
    }

    totalChunks += await ingestChunks(chunks);
  }

  return { indexed: packages.length, chunks: totalChunks };
}

export async function indexCompetitions(): Promise<{ indexed: number; chunks: number }> {
  const competitions = await prisma.competitionData.findMany();

  let totalChunks = 0;
  for (const comp of competitions) {
    await deleteChunksBySource("competition", comp.id);

    const chunks: KnowledgeChunk[] = [];
    const meta = { competitionId: comp.id, season: comp.season };

    // Standings summary
    const standings = Array.isArray(comp.standings) ? comp.standings as Array<{ position?: number; team?: { name?: string }; points?: number }> : [];
    const top5 = standings.slice(0, 5).map(s => `${s.position}. ${s.team?.name} (${s.points} pts)`).join(", ");

    const enText = [
      `Competition: ${comp.name} - Season ${comp.season}`,
      `Barça position: ${comp.barcaPosition}, ${comp.barcaPoints} points`,
      `Record: ${comp.barcaWon}W ${comp.barcaDraw}D ${comp.barcaLost}L (${comp.barcaGoalsFor}-${comp.barcaGoalsAgainst})`,
      top5 ? `Top 5: ${top5}` : "",
      comp.aiPrediction ? `\nAI Prediction: ${comp.aiPrediction}` : "",
      comp.seasonForecast ? `\nSeason Forecast: ${comp.seasonForecast}` : "",
    ].filter(Boolean).join("\n");
    chunks.push(...createChunks(enText, "competition", comp.id, "en", comp.updatedAt, 24, meta));

    if (comp.aiPredictionEs) {
      const esText = [
        `Competición: ${comp.name} - Temporada ${comp.season}`,
        `Posición Barça: ${comp.barcaPosition}, ${comp.barcaPoints} puntos`,
        `Balance: ${comp.barcaWon}V ${comp.barcaDraw}E ${comp.barcaLost}D (${comp.barcaGoalsFor}-${comp.barcaGoalsAgainst})`,
        top5 ? `Top 5: ${top5}` : "",
        `\nPredicción IA: ${comp.aiPredictionEs}`,
        comp.seasonForecastEs ? `\nPronóstico temporada: ${comp.seasonForecastEs}` : "",
      ].filter(Boolean).join("\n");
      chunks.push(...createChunks(esText, "competition", comp.id, "es", comp.updatedAt, 24, meta));
    }

    totalChunks += await ingestChunks(chunks);
  }

  return { indexed: competitions.length, chunks: totalChunks };
}

export async function indexFaqs(): Promise<{ indexed: number; chunks: number }> {
  const faqs = await prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  let totalChunks = 0;
  for (const faq of faqs) {
    await deleteChunksBySource("faq", faq.id);

    const chunks: KnowledgeChunk[] = [];
    const meta = { sortOrder: String(faq.sortOrder) };

    const enText = `FAQ: ${faq.question}\nAnswer: ${faq.answer}`;
    chunks.push(...createChunks(enText, "faq", faq.id, "en", faq.updatedAt, 0, meta));

    if (faq.questionEs && faq.answerEs) {
      const esText = `Pregunta frecuente: ${faq.questionEs}\nRespuesta: ${faq.answerEs}`;
      chunks.push(...createChunks(esText, "faq", faq.id, "es", faq.updatedAt, 0, meta));
    }

    totalChunks += await ingestChunks(chunks);
  }

  return { indexed: faqs.length, chunks: totalChunks };
}

export async function indexMatches(): Promise<{ indexed: number; chunks: number }> {
  const matches = await prisma.match.findMany({ orderBy: { date: "asc" } });

  let totalChunks = 0;
  for (const match of matches) {
    await deleteChunksBySource("match", match.id);

    const chunks: KnowledgeChunk[] = [];
    const dateStr = match.date.toISOString().slice(0, 10);
    const meta = { opponent: match.opponent, competition: match.competition, venue: match.venue };

    const enText = `Upcoming Match: FC Barcelona vs ${match.opponent}\nDate: ${dateStr} at ${match.time}\nCompetition: ${match.competition}\nVenue: ${match.venue}`;
    chunks.push({ sourceType: "match", sourceId: match.id, text: enText, language: "en", freshnessDate: match.date, ttlHours: 0, metadata: meta });

    const esText = `Próximo partido: FC Barcelona vs ${match.opponent}\nFecha: ${dateStr} a las ${match.time}\nCompetición: ${match.competition}\nEstadio: ${match.venue}`;
    chunks.push({ sourceType: "match", sourceId: match.id, text: esText, language: "es", freshnessDate: match.date, ttlHours: 0, metadata: meta });

    totalChunks += await ingestChunks(chunks);
  }

  return { indexed: matches.length, chunks: totalChunks };
}

export async function indexNewsArticles(): Promise<{ indexed: number; chunks: number }> {
  const articles = await prisma.newsArticle.findMany({
    where: { status: "published" },
    select: {
      id: true, slug: true, title: true, titleEs: true,
      excerpt: true, excerptEs: true, content: true, contentEs: true,
      category: true, author: true, publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  let totalChunks = 0;
  for (const article of articles) {
    await deleteChunksBySource("news", article.id);

    const chunks: KnowledgeChunk[] = [];
    const meta = { slug: article.slug, category: article.category || "news", author: article.author || "" };

    // English
    const enText = [
      `News: ${article.title}`,
      article.category ? `Category: ${article.category}` : "",
      article.publishedAt ? `Date: ${article.publishedAt.toISOString().slice(0, 10)}` : "",
      `\n${article.excerpt || ""}`,
      `\n${article.content}`,
    ].filter(Boolean).join("\n");
    chunks.push(...createChunks(enText, "news", article.id, "en", article.publishedAt || new Date(), 0, meta));

    // Spanish
    if (article.contentEs) {
      const esText = [
        `Noticia: ${article.titleEs || article.title}`,
        article.category ? `Categoría: ${article.category}` : "",
        article.publishedAt ? `Fecha: ${article.publishedAt.toISOString().slice(0, 10)}` : "",
        `\n${article.excerptEs || article.excerpt || ""}`,
        `\n${article.contentEs}`,
      ].filter(Boolean).join("\n");
      chunks.push(...createChunks(esText, "news", article.id, "es", article.publishedAt || new Date(), 0, meta));
    }

    totalChunks += await ingestChunks(chunks);
  }

  return { indexed: articles.length, chunks: totalChunks };
}

// ============== INDEX ALL ==============

export async function indexAllExistingContent(): Promise<{
  blogs: { indexed: number; chunks: number };
  packages: { indexed: number; chunks: number };
  competitions: { indexed: number; chunks: number };
  faqs: { indexed: number; chunks: number };
  matches: { indexed: number; chunks: number };
  news: { indexed: number; chunks: number };
  totalChunks: number;
}> {
  console.log("[Knowledge] Starting full reindex of existing content...");

  const blogs = await indexBlogPosts();
  console.log(`[Knowledge] Blog posts: ${blogs.indexed} indexed, ${blogs.chunks} chunks`);

  const packages = await indexMatchPackages();
  console.log(`[Knowledge] Packages: ${packages.indexed} indexed, ${packages.chunks} chunks`);

  const competitions = await indexCompetitions();
  console.log(`[Knowledge] Competitions: ${competitions.indexed} indexed, ${competitions.chunks} chunks`);

  const faqs = await indexFaqs();
  console.log(`[Knowledge] FAQs: ${faqs.indexed} indexed, ${faqs.chunks} chunks`);

  const matches = await indexMatches();
  console.log(`[Knowledge] Matches: ${matches.indexed} indexed, ${matches.chunks} chunks`);

  const news = await indexNewsArticles();
  console.log(`[Knowledge] News articles: ${news.indexed} indexed, ${news.chunks} chunks`);

  const totalChunks = blogs.chunks + packages.chunks + competitions.chunks + faqs.chunks + matches.chunks + news.chunks;
  console.log(`[Knowledge] Full reindex complete: ${totalChunks} total chunks`);

  return { blogs, packages, competitions, faqs, matches, news, totalChunks };
}

// ============== SEARCH ==============

export interface BarcaKnowledgeResult {
  sourceType: string;
  sourceId: string;
  chunkText: string;
  language: string;
  metadata: Record<string, string>;
  similarity: number;
  freshnessDate: Date | null;
}

export async function searchBarcaKnowledge(
  query: string,
  limit: number = 10,
  languageFilter?: string
): Promise<BarcaKnowledgeResult[]> {
  await ensureBarcaKnowledgeTable();
  const embedding = await generateEmbedding(query);
  const embStr = `[${embedding.join(",")}]`;

  let sql = `
    SELECT source_type, source_id, chunk_text, language, metadata, freshness_date,
           1 - (embedding <=> $1::vector) as similarity
    FROM barca_knowledge_chunks
  `;
  const params: (string | number)[] = [embStr];

  if (languageFilter) {
    sql += ` WHERE language = $2`;
    params.push(languageFilter);
    sql += ` ORDER BY embedding <=> $1::vector LIMIT $3`;
    params.push(limit);
  } else {
    sql += ` ORDER BY embedding <=> $1::vector LIMIT $2`;
    params.push(limit);
  }

  const results: Array<{
    source_type: string;
    source_id: string;
    chunk_text: string;
    language: string;
    metadata: Record<string, string>;
    freshness_date: Date | null;
    similarity: number;
  }> = await prisma.$queryRawUnsafe(sql, ...params);

  return results.map(r => ({
    sourceType: r.source_type,
    sourceId: r.source_id,
    chunkText: r.chunk_text,
    language: r.language,
    metadata: r.metadata,
    similarity: Number(r.similarity),
    freshnessDate: r.freshness_date,
  }));
}

// ============== EXPIRATION ==============

export async function expireStaleChunks(): Promise<number> {
  await ensureBarcaKnowledgeTable();
  const result: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(`
    DELETE FROM barca_knowledge_chunks
    WHERE ttl_hours > 0
      AND created_at + (ttl_hours || ' hours')::interval < NOW()
    RETURNING 1
  `);
  const deleted = result.length;
  if (deleted > 0) {
    console.log(`[Knowledge] Expired ${deleted} stale chunks`);
  }
  return deleted;
}

// ============== STATS ==============

export async function getKnowledgeStats(): Promise<{
  totalChunks: number;
  bySourceType: Record<string, number>;
  byLanguage: Record<string, number>;
}> {
  await ensureBarcaKnowledgeTable();

  const [countRow] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM barca_knowledge_chunks`
  );

  const typeRows: Array<{ source_type: string; count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT source_type, COUNT(*) as count FROM barca_knowledge_chunks GROUP BY source_type`
  );

  const langRows: Array<{ language: string; count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT language, COUNT(*) as count FROM barca_knowledge_chunks GROUP BY language`
  );

  const bySourceType: Record<string, number> = {};
  for (const r of typeRows) bySourceType[r.source_type] = Number(r.count);

  const byLanguage: Record<string, number> = {};
  for (const r of langRows) byLanguage[r.language] = Number(r.count);

  return {
    totalChunks: Number(countRow?.count || 0),
    bySourceType,
    byLanguage,
  };
}
