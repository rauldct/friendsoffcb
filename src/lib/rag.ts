import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// ============== CONFIG ==============

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const EMBEDDING_MODEL = "all-minilm";
const EMBEDDING_DIM = 384;
const MAX_CHUNK_LENGTH = 800;
const PENYA_PREFIX = "FC Barcelona fan club (peña barcelonista): ";

// ============== HELPERS ==============

async function getAnthropicKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

// ============== TABLE SETUP ==============

let tableEnsured = false;
let knowledgeTableEnsured = false;

async function ensureRAGTable(): Promise<void> {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS penya_chunks (
        id SERIAL PRIMARY KEY,
        penya_id UUID NOT NULL,
        chunk_type VARCHAR(50) NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(384) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_penya_chunks_penya_id ON penya_chunks (penya_id)
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("[RAG] ensureRAGTable error:", err);
  }
}

async function ensureKnowledgeTable(): Promise<void> {
  if (knowledgeTableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id SERIAL PRIMARY KEY,
        article_id UUID NOT NULL,
        chunk_type VARCHAR(50) NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(${EMBEDDING_DIM}) NOT NULL,
        metadata JSONB DEFAULT '{}',
        source_name VARCHAR(200) DEFAULT '',
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_article_id ON knowledge_chunks (article_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_type ON knowledge_chunks (chunk_type)
    `);
    knowledgeTableEnsured = true;
  } catch (err) {
    console.error("[RAG] ensureKnowledgeTable error:", err);
  }
}

// ============== EMBEDDINGS ==============

async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.slice(0, 2000); // Limit input length for all-minilm context window
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

// ============== CHUNKING ==============

interface PenyaData {
  id: string;
  name: string;
  city: string;
  province: string;
  country: string;
  region: string;
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: Record<string, string> | null;
  president: string | null;
  foundedYear: number | null;
  memberCount: number | null;
  description: string | null;
  notes: string | null;
  websiteValidation: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrapedContent: any;
  enrichmentStatus: string;
}

interface Chunk {
  type: string;
  text: string;
  metadata: Record<string, string>;
}

function cleanHtmlResidual(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function chunkPenya(penya: PenyaData): Chunk[] {
  const chunks: Chunk[] = [];
  const { name, city, country } = penya;
  const base = { penyaName: name, city, country };

  // 0. Summary chunk — dense single sentence for fast matching
  const summaryParts = [
    `${PENYA_PREFIX}${name} is a supporter club in ${city}, ${country}.`,
    penya.foundedYear ? `Founded ${penya.foundedYear}.` : null,
    penya.memberCount ? `Members: ${penya.memberCount}.` : null,
    penya.description ? penya.description.split(".").slice(0, 2).join(".") + "." : null,
    penya.email ? `Email: ${penya.email}.` : null,
    penya.website ? `Web: ${penya.website}.` : null,
    penya.phone ? `Phone: ${penya.phone}.` : null,
  ].filter(Boolean).join(" ");
  chunks.push({ type: "summary", text: summaryParts, metadata: base });

  // 1. Basic info chunk
  const basicParts = [
    `${PENYA_PREFIX}${name}`,
    `Ciudad: ${city}`,
    penya.province ? `Provincia: ${penya.province}` : null,
    `País: ${country}`,
    `Región: ${penya.region === "cataluna" ? "Catalunya" : penya.region === "spain" ? "España" : "Internacional"}`,
    penya.address ? `Dirección: ${penya.address}` : null,
    penya.postalCode ? `Código postal: ${penya.postalCode}` : null,
    penya.foundedYear ? `Año fundación: ${penya.foundedYear}` : null,
    penya.memberCount ? `Miembros: ${penya.memberCount}` : null,
    penya.president ? `Presidente: ${penya.president}` : null,
  ].filter(Boolean);
  chunks.push({ type: "basic_info", text: basicParts.join("\n"), metadata: base });

  // 2. Contact chunk (if has any contact info)
  const contactParts = [
    `${PENYA_PREFIX}${name} (${city}, ${country})`,
    penya.email ? `Email: ${penya.email}` : null,
    penya.phone ? `Teléfono: ${penya.phone}` : null,
    penya.website ? `Web: ${penya.website}` : null,
  ].filter(Boolean);
  if (penya.email || penya.phone || penya.website) {
    const sm = penya.socialMedia;
    if (sm) {
      if (sm.facebook) contactParts.push(`Facebook: ${sm.facebook}`);
      if (sm.twitter) contactParts.push(`Twitter/X: ${sm.twitter}`);
      if (sm.instagram) contactParts.push(`Instagram: ${sm.instagram}`);
      if (sm.tiktok) contactParts.push(`TikTok: ${sm.tiktok}`);
    }
    chunks.push({ type: "contact", text: contactParts.join("\n"), metadata: base });
  }

  // 3. Description chunk
  if (penya.description) {
    const descText = `${PENYA_PREFIX}${name} (${city}, ${country})\nDescripción: ${penya.description}`;
    if (descText.length > MAX_CHUNK_LENGTH) {
      const parts = splitText(descText, MAX_CHUNK_LENGTH);
      parts.forEach((part, i) => {
        chunks.push({ type: "description", text: part, metadata: { ...base, part: String(i + 1) } });
      });
    } else {
      chunks.push({ type: "description", text: descText, metadata: base });
    }
  }

  // 4. Scraped content chunks (RAG from website) — cleaned + 800 char limit
  if (penya.scrapedContent) {
    const scraped = Array.isArray(penya.scrapedContent) ? penya.scrapedContent : [penya.scrapedContent];
    for (const page of scraped) {
      if (!page || typeof page !== "object") continue;
      const bodyClean = page.bodyText ? cleanHtmlResidual(page.bodyText) : "";
      const pageText = [
        `${PENYA_PREFIX}${name} (${city}, ${country})`,
        page.url ? `Fuente: ${page.url}` : null,
        page.title ? `Título web: ${cleanHtmlResidual(page.title)}` : null,
        page.description ? `Meta descripción: ${cleanHtmlResidual(page.description)}` : null,
        bodyClean ? `Contenido web: ${bodyClean}` : null,
      ].filter(Boolean).join("\n");

      if (pageText.length > MAX_CHUNK_LENGTH) {
        const parts = splitText(pageText, MAX_CHUNK_LENGTH);
        parts.forEach((part, i) => {
          chunks.push({ type: "scraped_content", text: part, metadata: { ...base, url: page.url || "", part: String(i + 1) } });
        });
      } else {
        chunks.push({ type: "scraped_content", text: pageText, metadata: { ...base, url: page.url || "" } });
      }
    }
  }

  // 5. Website validation chunk
  if (penya.websiteValidation) {
    chunks.push({
      type: "website_validation",
      text: `${PENYA_PREFIX}${name} (${city}, ${country})\nValidación de website: ${penya.websiteValidation}`,
      metadata: base,
    });
  }

  // 6. Notes chunk
  if (penya.notes) {
    chunks.push({
      type: "notes",
      text: `${PENYA_PREFIX}${name} (${city}, ${country})\nNotas: ${penya.notes}`,
      metadata: base,
    });
  }

  return chunks;
}

function splitText(text: string, maxLen: number): string[] {
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    // Find last sentence break or newline before maxLen
    let cutAt = remaining.lastIndexOf("\n", maxLen);
    if (cutAt < maxLen * 0.3) cutAt = remaining.lastIndexOf(". ", maxLen);
    if (cutAt < maxLen * 0.3) cutAt = maxLen;
    parts.push(remaining.slice(0, cutAt + 1).trim());
    remaining = remaining.slice(cutAt + 1).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

// ============== INDEXING ==============

export async function indexPenya(penyaId: string): Promise<{ chunksCreated: number }> {
  await ensureRAGTable();
  const penya = await prisma.penya.findUnique({ where: { id: penyaId } });
  if (!penya) throw new Error("Penya not found");

  // Delete existing chunks for this penya
  await prisma.$executeRawUnsafe(`DELETE FROM penya_chunks WHERE penya_id = $1::uuid`, penyaId);

  const chunks = chunkPenya(penya as unknown as PenyaData);
  if (chunks.length === 0) return { chunksCreated: 0 };

  // Generate embeddings and insert
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);
    const embStr = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO penya_chunks (penya_id, chunk_type, chunk_text, embedding, metadata)
       VALUES ($1::uuid, $2, $3, $4::vector, $5::jsonb)`,
      penyaId,
      chunk.type,
      chunk.text,
      embStr,
      JSON.stringify(chunk.metadata)
    );
  }

  console.log(`[RAG] Indexed penya ${penya.name}: ${chunks.length} chunks`);
  return { chunksCreated: chunks.length };
}

export async function reindexAllPenyes(): Promise<{ total: number; indexed: number; chunks: number; errors: number }> {
  // Get all enriched or manually edited peñas
  const penyes = await prisma.penya.findMany({
    where: { enrichmentStatus: { in: ["enriched", "manual"] } },
    select: { id: true, name: true },
  });

  let indexed = 0;
  let totalChunks = 0;
  let errors = 0;

  for (const p of penyes) {
    try {
      const result = await indexPenya(p.id);
      totalChunks += result.chunksCreated;
      indexed++;
    } catch (err) {
      console.error(`[RAG] Error indexing ${p.name}:`, err);
      errors++;
    }
  }

  // Rebuild IVFFlat index for better recall after bulk insert
  try {
    await prisma.$executeRawUnsafe(`REINDEX INDEX idx_penya_chunks_embedding`);
  } catch {
    // Index might not need rebuild
  }

  console.log(`[RAG] Reindex complete: ${indexed}/${penyes.length} peñas, ${totalChunks} chunks, ${errors} errors`);
  return { total: penyes.length, indexed, chunks: totalChunks, errors };
}

// ============== NEWS ARTICLE INDEXING ==============

interface ArticleData {
  id: string;
  slug: string;
  title: string;
  titleEs: string | null;
  excerpt: string;
  excerptEs: string | null;
  content: string;
  contentEs: string | null;
  category: string;
  sources: unknown; // JSON array of { name, url }
  matchDate: Date | null;
  matchResult: string | null;
  author: string;
  publishedAt: Date;
}

function chunkNewsArticle(article: ArticleData): Chunk[] {
  const chunks: Chunk[] = [];
  const sourcesArr = Array.isArray(article.sources) ? article.sources as Array<{ name?: string; url?: string }> : [];
  const sourceNames = sourcesArr.map(s => s.name || "").filter(Boolean).join(", ");
  const publishedStr = article.publishedAt.toISOString().slice(0, 10);

  const base: Record<string, string> = {
    articleId: article.id,
    slug: article.slug,
    category: article.category,
    publishedAt: publishedStr,
    source: sourceNames || article.author,
  };

  // 1. Header/summary chunk (always created)
  const headerParts = [
    `Artículo: ${article.title}`,
    article.titleEs ? `Título ES: ${article.titleEs}` : null,
    `Categoría: ${article.category}`,
    `Fecha: ${publishedStr}`,
    `Autor: ${article.author}`,
    sourceNames ? `Fuentes: ${sourceNames}` : null,
    article.matchResult ? `Resultado: ${article.matchResult}` : null,
    article.matchDate ? `Fecha partido: ${article.matchDate.toISOString().slice(0, 10)}` : null,
    `\nResumen: ${article.excerpt}`,
    article.excerptEs ? `Resumen ES: ${article.excerptEs}` : null,
  ].filter(Boolean).join("\n");
  chunks.push({ type: "news_summary", text: headerParts, metadata: base });

  // 2. RSS source details chunk (for digests with sources)
  if (sourcesArr.length > 0) {
    const sourcesText = [
      `Fuentes del artículo "${article.title}" (${publishedStr}):`,
      ...sourcesArr.map((s, i) => `${i + 1}. ${s.name || "?"} - ${s.url || ""}`),
    ].join("\n");
    chunks.push({ type: "news_sources", text: sourcesText, metadata: base });
  }

  // 3. Content chunks (English) - split into segments
  if (article.content) {
    const contentText = `FC Barcelona - ${article.title} (${publishedStr})\n\n${article.content}`;
    if (contentText.length > MAX_CHUNK_LENGTH) {
      const parts = splitText(contentText, MAX_CHUNK_LENGTH);
      parts.forEach((part, i) => {
        chunks.push({ type: "news_content", text: part, metadata: { ...base, lang: "en", part: String(i + 1) } });
      });
    } else {
      chunks.push({ type: "news_content", text: contentText, metadata: { ...base, lang: "en" } });
    }
  }

  // 4. Content chunks (Spanish)
  if (article.contentEs) {
    const contentEsText = `FC Barcelona - ${article.titleEs || article.title} (${publishedStr})\n\n${article.contentEs}`;
    if (contentEsText.length > MAX_CHUNK_LENGTH) {
      const parts = splitText(contentEsText, MAX_CHUNK_LENGTH);
      parts.forEach((part, i) => {
        chunks.push({ type: "news_content_es", text: part, metadata: { ...base, lang: "es", part: String(i + 1) } });
      });
    } else {
      chunks.push({ type: "news_content_es", text: contentEsText, metadata: { ...base, lang: "es" } });
    }
  }

  return chunks;
}

export async function indexNewsArticle(articleId: string): Promise<{ chunksCreated: number }> {
  await ensureKnowledgeTable();
  const article = await prisma.newsArticle.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");

  // Delete existing chunks for this article
  await prisma.$executeRawUnsafe(`DELETE FROM knowledge_chunks WHERE article_id = $1::uuid`, articleId);

  const chunks = chunkNewsArticle(article as unknown as ArticleData);
  if (chunks.length === 0) return { chunksCreated: 0 };

  const sourcesArr = Array.isArray(article.sources) ? article.sources as Array<{ name?: string }> : [];
  const sourceNames = [...new Set(sourcesArr.map(s => s.name || "").filter(Boolean))];
  const sourceName = (sourceNames.join(", ") || article.author).slice(0, 200);

  let created = 0;
  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.text);
      const embStr = `[${embedding.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO knowledge_chunks (article_id, chunk_type, chunk_text, embedding, metadata, source_name, published_at)
         VALUES ($1::uuid, $2, $3, $4::vector, $5::jsonb, $6, $7)`,
        articleId,
        chunk.type,
        chunk.text,
        embStr,
        JSON.stringify(chunk.metadata),
        sourceName,
        article.publishedAt
      );
      created++;
    } catch (e) {
      console.error(`[RAG] Chunk error (${chunk.type}, ${chunk.text.length} chars): ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`[RAG] Indexed article "${article.title}": ${created}/${chunks.length} chunks`);
  return { chunksCreated: created };
}

export async function indexAllNews(): Promise<{ total: number; indexed: number; chunks: number; errors: number }> {
  await ensureKnowledgeTable();
  const articles = await prisma.newsArticle.findMany({
    where: { status: "published" },
    select: { id: true, title: true },
    orderBy: { publishedAt: "desc" },
  });

  let indexed = 0;
  let totalChunks = 0;
  let errors = 0;

  for (const a of articles) {
    try {
      const result = await indexNewsArticle(a.id);
      totalChunks += result.chunksCreated;
      indexed++;
    } catch (err) {
      console.error(`[RAG] Error indexing article "${a.title}":`, err);
      errors++;
    }
  }

  console.log(`[RAG] News reindex complete: ${indexed}/${articles.length} articles, ${totalChunks} chunks, ${errors} errors`);
  return { total: articles.length, indexed, chunks: totalChunks, errors };
}

// ============== SEARCH ==============

interface SearchResult {
  penyaId: string;
  chunkType: string;
  chunkText: string;
  metadata: Record<string, string>;
  similarity: number;
}

export async function searchSimilar(query: string, limit: number = 10): Promise<SearchResult[]> {
  await ensureRAGTable();
  const embedding = await generateEmbedding(query);
  const embStr = `[${embedding.join(",")}]`;

  const results: Array<{
    penya_id: string;
    chunk_type: string;
    chunk_text: string;
    metadata: Record<string, string>;
    similarity: number;
  }> = await prisma.$queryRawUnsafe(
    `SELECT penya_id, chunk_type, chunk_text, metadata,
            1 - (embedding <=> $1::vector) as similarity
     FROM penya_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    embStr,
    limit
  );

  return results.map(r => ({
    penyaId: r.penya_id,
    chunkType: r.chunk_type,
    chunkText: r.chunk_text,
    metadata: r.metadata,
    similarity: Number(r.similarity),
  }));
}

interface KnowledgeResult {
  articleId: string;
  chunkType: string;
  chunkText: string;
  metadata: Record<string, string>;
  sourceName: string;
  publishedAt: Date | null;
  similarity: number;
}

export async function searchKnowledge(query: string, limit: number = 10): Promise<KnowledgeResult[]> {
  await ensureKnowledgeTable();
  const embedding = await generateEmbedding(query);
  const embStr = `[${embedding.join(",")}]`;

  const results: Array<{
    article_id: string;
    chunk_type: string;
    chunk_text: string;
    metadata: Record<string, string>;
    source_name: string;
    published_at: Date | null;
    similarity: number;
  }> = await prisma.$queryRawUnsafe(
    `SELECT article_id, chunk_type, chunk_text, metadata, source_name, published_at,
            1 - (embedding <=> $1::vector) as similarity
     FROM knowledge_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    embStr,
    limit
  );

  return results.map(r => ({
    articleId: r.article_id,
    chunkType: r.chunk_type,
    chunkText: r.chunk_text,
    metadata: r.metadata,
    sourceName: r.source_name,
    publishedAt: r.published_at,
    similarity: Number(r.similarity),
  }));
}

// ============== CHAT ==============

export interface ChatSource {
  name: string;
  type: string; // "penya" | "news"
  detail: string;
  chunkType: string;
  similarity: number;
}

export async function chatWithRAG(question: string): Promise<{
  answer: string;
  sources: ChatSource[];
}> {
  const apiKey = await getAnthropicKey();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Search both peñas and knowledge tables in parallel
  const [penyaResults, knowledgeResults] = await Promise.all([
    searchSimilar(question, 10).catch(() => [] as SearchResult[]),
    searchKnowledge(question, 10).catch(() => [] as KnowledgeResult[]),
  ]);

  const contextParts: string[] = [];
  const seenTexts = new Set<string>();
  const sourcesMap = new Map<string, ChatSource>();

  // Add penya results
  for (const r of penyaResults) {
    if (r.similarity < 0.2) continue;
    const key = r.chunkText.slice(0, 200);
    if (seenTexts.has(key)) continue;
    seenTexts.add(key);
    contextParts.push(`[PEÑA: ${r.metadata.penyaName || "?"} - ${r.chunkType}]\n${r.chunkText}`);
    const sourceKey = `penya-${r.metadata.penyaName}-${r.metadata.city}`;
    if (!sourcesMap.has(sourceKey)) {
      sourcesMap.set(sourceKey, {
        name: r.metadata.penyaName || "?",
        type: "penya",
        detail: `${r.metadata.city || "?"}, ${r.metadata.country || "?"}`,
        chunkType: r.chunkType,
        similarity: r.similarity,
      });
    }
  }

  // Add knowledge/news results
  for (const r of knowledgeResults) {
    if (r.similarity < 0.2) continue;
    const key = r.chunkText.slice(0, 200);
    if (seenTexts.has(key)) continue;
    seenTexts.add(key);
    const dateStr = r.publishedAt ? new Date(r.publishedAt).toISOString().slice(0, 10) : "";
    contextParts.push(`[NOTICIA: ${r.metadata.category || "?"} - ${dateStr} - Fuente: ${r.sourceName}]\n${r.chunkText}`);
    const sourceKey = `news-${r.articleId}`;
    if (!sourcesMap.has(sourceKey)) {
      sourcesMap.set(sourceKey, {
        name: r.metadata.slug || r.sourceName || "Artículo",
        type: "news",
        detail: `${r.metadata.category || "?"} - ${dateStr} - ${r.sourceName}`,
        chunkType: r.chunkType,
        similarity: r.similarity,
      });
    }
  }

  if (contextParts.length === 0) {
    return {
      answer: "No encontré información relevante en la base de datos. Intenta reformular la pregunta.",
      sources: [],
    };
  }

  const context = contextParts.join("\n\n---\n\n");

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2500,
    messages: [{
      role: "user",
      content: `Eres un asistente experto en FC Barcelona. Tienes acceso a una base de datos completa que incluye:
- Información de peñas barcelonistas (contacto, ubicación, actividades)
- Noticias, crónicas de partidos, previews y digests del FC Barcelona
- Datos de fuentes como FCB Official, Marca, Sport, Mundo Deportivo, ESPN, BBC

Responde basándote EXCLUSIVAMENTE en la información del contexto proporcionado.
Si la información no está en el contexto, dilo claramente.
Responde en español. Sé específico, cita fuentes y fechas cuando sea relevante.
Si citas una noticia, menciona la fecha y la fuente.

CONTEXTO (base de conocimiento FC Barcelona):
${context}

PREGUNTA: ${question}`,
    }],
  });

  const answer = msg.content[0].type === "text" ? msg.content[0].text : "";

  return {
    answer,
    sources: Array.from(sourcesMap.values()),
  };
}

// ============== STATS ==============

export async function getRAGStats(): Promise<{
  totalChunks: number;
  indexedPenyes: number;
  totalPenyes: number;
  enrichedPenyes: number;
  chunksByType: Record<string, number>;
  // Knowledge stats
  knowledgeChunks: number;
  indexedArticles: number;
  totalArticles: number;
  knowledgeByType: Record<string, number>;
}> {
  await ensureRAGTable();
  await ensureKnowledgeTable();

  const [chunkCount] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM penya_chunks`
  );
  const [indexedCount] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(DISTINCT penya_id) as count FROM penya_chunks`
  );
  const totalPenyes = await prisma.penya.count();
  const enrichedPenyes = await prisma.penya.count({
    where: { enrichmentStatus: { in: ["enriched", "manual"] } },
  });

  const typeRows: Array<{ chunk_type: string; count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT chunk_type, COUNT(*) as count FROM penya_chunks GROUP BY chunk_type`
  );
  const chunksByType: Record<string, number> = {};
  for (const r of typeRows) {
    chunksByType[r.chunk_type] = Number(r.count);
  }

  // Knowledge stats
  const [knowledgeCount] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM knowledge_chunks`
  );
  const [indexedArticlesCount] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(DISTINCT article_id) as count FROM knowledge_chunks`
  );
  const totalArticles = await prisma.newsArticle.count({ where: { status: "published" } });

  const knowledgeTypeRows: Array<{ chunk_type: string; count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT chunk_type, COUNT(*) as count FROM knowledge_chunks GROUP BY chunk_type`
  );
  const knowledgeByType: Record<string, number> = {};
  for (const r of knowledgeTypeRows) {
    knowledgeByType[r.chunk_type] = Number(r.count);
  }

  return {
    totalChunks: Number(chunkCount.count),
    indexedPenyes: Number(indexedCount.count),
    totalPenyes,
    enrichedPenyes,
    chunksByType,
    knowledgeChunks: Number(knowledgeCount.count),
    indexedArticles: Number(indexedArticlesCount.count),
    totalArticles,
    knowledgeByType,
  };
}
