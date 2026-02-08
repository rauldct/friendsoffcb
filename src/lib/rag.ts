import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// ============== CONFIG ==============

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const EMBEDDING_MODEL = "all-minilm";
const EMBEDDING_DIM = 384;
const MAX_CHUNK_LENGTH = 1500;

// ============== HELPERS ==============

async function getAnthropicKey(): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

// ============== EMBEDDINGS ==============

async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.slice(0, 8000); // Limit input length
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: trimmed }),
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

function chunkPenya(penya: PenyaData): Chunk[] {
  const chunks: Chunk[] = [];
  const { name, city, country } = penya;
  const base = { penyaName: name, city, country };

  // 1. Basic info chunk
  const basicParts = [
    `Peña: ${name}`,
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
    `Peña: ${name} (${city}, ${country})`,
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
    const descText = `Peña: ${name} (${city}, ${country})\nDescripción: ${penya.description}`;
    // Split long descriptions
    if (descText.length > MAX_CHUNK_LENGTH) {
      const parts = splitText(descText, MAX_CHUNK_LENGTH);
      parts.forEach((part, i) => {
        chunks.push({ type: "description", text: part, metadata: { ...base, part: String(i + 1) } });
      });
    } else {
      chunks.push({ type: "description", text: descText, metadata: base });
    }
  }

  // 4. Scraped content chunks (RAG from website)
  if (penya.scrapedContent) {
    const scraped = Array.isArray(penya.scrapedContent) ? penya.scrapedContent : [penya.scrapedContent];
    for (const page of scraped) {
      if (!page || typeof page !== "object") continue;
      const pageText = [
        `Peña: ${name} (${city}, ${country})`,
        page.url ? `Fuente: ${page.url}` : null,
        page.title ? `Título web: ${page.title}` : null,
        page.description ? `Meta descripción: ${page.description}` : null,
        page.bodyText ? `Contenido web: ${page.bodyText}` : null,
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
      text: `Peña: ${name} (${city}, ${country})\nValidación de website: ${penya.websiteValidation}`,
      metadata: base,
    });
  }

  // 6. Notes chunk
  if (penya.notes) {
    chunks.push({
      type: "notes",
      text: `Peña: ${name} (${city}, ${country})\nNotas: ${penya.notes}`,
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
  const penya = await prisma.penya.findUnique({ where: { id: penyaId } });
  if (!penya) throw new Error("Penya not found");

  // Delete existing chunks for this penya
  await prisma.$executeRawUnsafe(`DELETE FROM penya_chunks WHERE penya_id = $1`, penyaId);

  const chunks = chunkPenya(penya as unknown as PenyaData);
  if (chunks.length === 0) return { chunksCreated: 0 };

  // Generate embeddings and insert
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);
    const embStr = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO penya_chunks (penya_id, chunk_type, chunk_text, embedding, metadata)
       VALUES ($1, $2, $3, $4::vector, $5::jsonb)`,
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

// ============== SEARCH ==============

interface SearchResult {
  penyaId: string;
  chunkType: string;
  chunkText: string;
  metadata: Record<string, string>;
  similarity: number;
}

export async function searchSimilar(query: string, limit: number = 10): Promise<SearchResult[]> {
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

// ============== CHAT ==============

export async function chatWithRAG(question: string): Promise<{
  answer: string;
  sources: Array<{ penyaName: string; city: string; country: string; chunkType: string; similarity: number }>;
}> {
  const apiKey = await getAnthropicKey();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Search for relevant chunks
  const results = await searchSimilar(question, 15);

  if (results.length === 0) {
    return {
      answer: "No hay información indexada en el RAG. Primero enriquece algunas peñas con 'Search with AI' y luego vuelve a preguntar.",
      sources: [],
    };
  }

  // Deduplicate and build context
  const contextParts: string[] = [];
  const seenTexts = new Set<string>();
  const sourcesMap = new Map<string, { penyaName: string; city: string; country: string; chunkType: string; similarity: number }>();

  for (const r of results) {
    if (r.similarity < 0.2) continue; // Filter low relevance
    const key = r.chunkText.slice(0, 200);
    if (seenTexts.has(key)) continue;
    seenTexts.add(key);
    contextParts.push(`[${r.metadata.penyaName || "?"} - ${r.chunkType}]\n${r.chunkText}`);
    const sourceKey = `${r.metadata.penyaName}-${r.metadata.city}`;
    if (!sourcesMap.has(sourceKey)) {
      sourcesMap.set(sourceKey, {
        penyaName: r.metadata.penyaName || "?",
        city: r.metadata.city || "?",
        country: r.metadata.country || "?",
        chunkType: r.chunkType,
        similarity: r.similarity,
      });
    }
  }

  if (contextParts.length === 0) {
    return {
      answer: "No encontré información suficientemente relevante para responder a esa pregunta. Intenta reformular o enriquece más peñas.",
      sources: [],
    };
  }

  const context = contextParts.join("\n\n---\n\n");

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Eres un asistente experto en peñas del FC Barcelona. Responde basándote EXCLUSIVAMENTE en la información del contexto proporcionado.
Si la información no está en el contexto, dilo claramente. Responde en español.
Sé específico y cita nombres de peñas cuando sea relevante.

CONTEXTO (información de la base de datos de peñas):
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
}> {
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

  return {
    totalChunks: Number(chunkCount.count),
    indexedPenyes: Number(indexedCount.count),
    totalPenyes,
    enrichedPenyes,
    chunksByType,
  };
}
