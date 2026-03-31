import * as cheerio from "cheerio";
import { ingestChunks, deleteChunksBySource } from "@/lib/knowledge-pipeline";
import prisma from "@/lib/prisma";

// ============== CONFIG ==============

const USER_AGENT = "CuleBot/1.0 (https://friendsofbarca.com; rauloasys@gmail.com)";
const DELAY_MS = 2000; // 2 seconds between requests (Wikipedia is generous but be polite)

// Pages to scrape, grouped by language
// Use readable titles (not URL-encoded) - URLSearchParams handles encoding
const WIKIPEDIA_PAGES = {
  en: [
    // Main articles
    { slug: "FC Barcelona", sourceType: "history", label: "FC Barcelona" },
    { slug: "El Clásico", sourceType: "history", label: "El Clásico" },
    { slug: "FC Barcelona in international football", sourceType: "history", label: "Barça in Europe" },
    // Infrastructure
    { slug: "Camp Nou", sourceType: "stadium", label: "Camp Nou" },
    { slug: "La Masia", sourceType: "academy", label: "La Masia" },
    // Records & Stats
    { slug: "List of FC Barcelona records and statistics", sourceType: "records", label: "Records & Stats" },
    { slug: "List of FC Barcelona players", sourceType: "history", label: "Notable Players" },
  ],
  es: [
    // Historia principal
    { slug: "Fútbol Club Barcelona", sourceType: "history", label: "FC Barcelona" },
    { slug: "Historia del Fútbol Club Barcelona", sourceType: "history", label: "Historia del Barça" },
    { slug: "El Clásico", sourceType: "history", label: "El Clásico" },
    { slug: "Més que un club", sourceType: "history", label: "Més que un club" },
    { slug: "Cant del Barça", sourceType: "history", label: "Cant del Barça (himno)" },
    // Infraestructuras
    { slug: "Camp Nou", sourceType: "stadium", label: "Camp Nou" },
    { slug: "La Masía", sourceType: "academy", label: "La Masía" },
    { slug: "Espai Barça", sourceType: "stadium", label: "Espai Barça" },
    { slug: "Estadi Johan Cruyff", sourceType: "stadium", label: "Estadi Johan Cruyff" },
    { slug: "Estadio Olímpico Lluís Companys", sourceType: "stadium", label: "Estadi Olímpic Lluís Companys" },
    { slug: "Palau Blaugrana", sourceType: "stadium", label: "Palau Blaugrana" },
    { slug: "Ciutat Esportiva Joan Gamper", sourceType: "stadium", label: "Ciutat Esportiva Joan Gamper" },
    { slug: "Museo del FC Barcelona", sourceType: "stadium", label: "Museo del FC Barcelona" },
    // Secciones del club
    { slug: "FC Barcelona Atlètic", sourceType: "history", label: "Barça Atlètic (filial)" },
    { slug: "Fútbol Club Barcelona Femení", sourceType: "history", label: "Barça Femenino" },
    // Leyendas y figuras clave
    { slug: "Joan Gamper", sourceType: "legend", label: "Joan Gamper (fundador)" },
    { slug: "Johan Cruyff", sourceType: "legend", label: "Johan Cruyff" },
    { slug: "Lionel Messi", sourceType: "legend", label: "Lionel Messi" },
    { slug: "Ronaldinho", sourceType: "legend", label: "Ronaldinho" },
    { slug: "Xavi Hernández", sourceType: "legend", label: "Xavi Hernández" },
    { slug: "Andrés Iniesta", sourceType: "legend", label: "Andrés Iniesta" },
    { slug: "Pep Guardiola", sourceType: "legend", label: "Pep Guardiola" },
    { slug: "Neymar", sourceType: "legend", label: "Neymar" },
    { slug: "Diego Maradona", sourceType: "legend", label: "Diego Maradona" },
    { slug: "Rivaldo", sourceType: "legend", label: "Rivaldo" },
    { slug: "Romário", sourceType: "legend", label: "Romário" },
    { slug: "Luis Enrique", sourceType: "legend", label: "Luis Enrique" },
    { slug: "Frank Rijkaard", sourceType: "legend", label: "Frank Rijkaard" },
    // Presidentes
    { slug: "Josep Lluís Núñez", sourceType: "history", label: "Josep Lluís Núñez (presidente)" },
    { slug: "Joan Laporta", sourceType: "history", label: "Joan Laporta (presidente)" },
    { slug: "Sandro Rosell", sourceType: "history", label: "Sandro Rosell (presidente)" },
    { slug: "Josep Maria Bartomeu", sourceType: "history", label: "Josep Maria Bartomeu (presidente)" },
    // Anexos (datos detallados)
    { slug: "Anexo:Temporadas del Fútbol Club Barcelona", sourceType: "records", label: "Temporadas del Barça" },
    { slug: "Anexo:Palmarés del Fútbol Club Barcelona", sourceType: "records", label: "Palmarés del Barça" },
    { slug: "Anexo:Jugadores del Fútbol Club Barcelona", sourceType: "records", label: "Jugadores históricos del Barça" },
    { slug: "Anexo:Entrenadores del Fútbol Club Barcelona", sourceType: "records", label: "Entrenadores del Barça" },
    { slug: "Anexo:Presidentes del Fútbol Club Barcelona", sourceType: "records", label: "Presidentes del Barça" },
    { slug: "Anexo:Estadísticas del Fútbol Club Barcelona", sourceType: "records", label: "Estadísticas del Barça" },
    { slug: "Anexo:Máximos goleadores del Fútbol Club Barcelona", sourceType: "records", label: "Máximos goleadores del Barça" },
  ],
};

// ============== HELPERS ==============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch a Wikipedia article using the MediaWiki action=parse API.
 * Returns parsed HTML which we extract structured sections from.
 */
async function fetchWikipediaArticle(
  slug: string,
  lang: string
): Promise<{ title: string; sections: Array<{ heading: string; content: string }> } | null> {
  // Use action=parse to get fully rendered HTML with section structure
  const url = `https://${lang}.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action: "parse",
      page: slug,
      prop: "text|sections",
      format: "json",
      disabletoc: "1",
      redirects: "1",
    }).toString();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
    });

    if (!res.ok) {
      console.error(`[Wikipedia] HTTP ${res.status} for ${slug} (${lang})`);
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.error(`[Wikipedia] API error for ${slug}: ${data.error.info}`);
      return null;
    }

    const parse = data.parse;
    if (!parse?.text?.["*"]) return null;

    const html = parse.text["*"];
    const title = parse.title || slug;

    // Parse HTML with cheerio to extract sections
    const sections = extractSectionsFromHtml(html, lang);

    return { title, sections };
  } catch (err) {
    console.error(`[Wikipedia] Error fetching ${slug}:`, err);
    return null;
  }
}

// Sections to skip (not useful for knowledge base)
const SKIP_SECTIONS_EN = new Set([
  "see also", "references", "external links", "notes", "further reading",
  "bibliography", "sources", "footnotes", "citations",
]);
const SKIP_SECTIONS_ES = new Set([
  "véase también", "referencias", "enlaces externos", "notas", "bibliografía",
  "fuentes", "lecturas adicionales",
]);

/**
 * Extract structured sections from Wikipedia HTML using cheerio.
 */
function extractSectionsFromHtml(
  html: string,
  lang: string
): Array<{ heading: string; content: string }> {
  const $ = cheerio.load(html);
  const skipSet = lang === "es" ? SKIP_SECTIONS_ES : SKIP_SECTIONS_EN;

  // Remove unwanted elements
  $(".mw-editsection, .reference, .reflist, .navbox, .sistersitebox, .metadata, .noprint, .mw-empty-elt, table.infobox, .thumb, .gallery, sup.reference, .hatnote").remove();

  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = "Introduction";
  let currentParagraphs: string[] = [];

  // Walk through direct children of mw-parser-output
  const container = $(".mw-parser-output");
  if (!container.length) return [];

  container.children().each((_, el) => {
    const tag = (el as unknown as { tagName?: string }).tagName?.toLowerCase();

    if (tag === "h2" || tag === "h3") {
      // Save previous section
      const content = currentParagraphs.join("\n\n").trim();
      if (content.length > 80) {
        sections.push({ heading: currentHeading, content });
      }
      currentHeading = $(el).text().replace(/\[edit\]/g, "").trim();
      currentParagraphs = [];
    } else if (tag === "p") {
      const text = $(el).text().trim();
      if (text.length > 20) {
        currentParagraphs.push(text);
      }
    } else if (tag === "ul" || tag === "ol") {
      const items: string[] = [];
      $(el).find("li").each((_, li) => {
        const text = $(li).text().trim();
        if (text.length > 10 && text.length < 500) {
          items.push(`- ${text}`);
        }
      });
      if (items.length > 0 && items.length < 50) {
        currentParagraphs.push(items.join("\n"));
      }
    }
  });

  // Last section
  const content = currentParagraphs.join("\n\n").trim();
  if (content.length > 80) {
    sections.push({ heading: currentHeading, content });
  }

  // Filter out skip sections
  return sections.filter(s => !skipSet.has(s.heading.toLowerCase()));
}

// ============== MAIN SCRAPE FUNCTION ==============

export interface WikipediaScrapeResult {
  pagesScraped: number;
  chunksCreated: number;
  errors: string[];
  details: Array<{ page: string; lang: string; sections: number; chunks: number }>;
}

export async function scrapeWikipedia(): Promise<WikipediaScrapeResult> {
  const result: WikipediaScrapeResult = {
    pagesScraped: 0,
    chunksCreated: 0,
    errors: [],
    details: [],
  };

  console.log("[Wikipedia] Starting FC Barcelona knowledge scrape...");

  for (const [lang, pages] of Object.entries(WIKIPEDIA_PAGES)) {
    for (const page of pages) {
      console.log(`[Wikipedia] Fetching ${page.slug} (${lang})...`);

      const article = await fetchWikipediaArticle(page.slug, lang);
      if (!article || article.sections.length === 0) {
        result.errors.push(`Failed to fetch ${page.slug} (${lang})`);
        await sleep(DELAY_MS);
        continue;
      }

      // Delete previous chunks for this page
      const sourceId = `wiki-${lang}-${page.slug}`;
      await deleteChunksBySource(page.sourceType, sourceId);

      // Create chunks from sections - split long sections
      const allChunks: Array<{
        sourceType: string;
        sourceId: string;
        text: string;
        language: string;
        freshnessDate: Date;
        ttlHours: number;
        metadata: Record<string, string>;
      }> = [];

      for (const section of article.sections) {
        const fullText = `${page.label} - ${section.heading}\n\n${section.content}`;
        // Split text into ~1000 char chunks if needed
        const MAX_CHUNK = 1000;
        if (fullText.length <= MAX_CHUNK) {
          allChunks.push({
            sourceType: page.sourceType,
            sourceId,
            text: fullText,
            language: lang,
            freshnessDate: new Date(),
            ttlHours: 0,
            metadata: { source: "wikipedia", page: page.slug, section: section.heading, label: page.label },
          });
        } else {
          // Split by paragraphs
          const paragraphs = section.content.split("\n\n");
          let current = `${page.label} - ${section.heading}\n\n`;
          let partNum = 1;
          for (const para of paragraphs) {
            if ((current + para).length > MAX_CHUNK && current.length > 50) {
              allChunks.push({
                sourceType: page.sourceType,
                sourceId,
                text: current.trim(),
                language: lang,
                freshnessDate: new Date(),
                ttlHours: 0,
                metadata: { source: "wikipedia", page: page.slug, section: section.heading, label: page.label, part: String(partNum) },
              });
              partNum++;
              current = `${page.label} - ${section.heading} (cont.)\n\n${para}\n\n`;
            } else {
              current += para + "\n\n";
            }
          }
          if (current.trim().length > 50) {
            allChunks.push({
              sourceType: page.sourceType,
              sourceId,
              text: current.trim(),
              language: lang,
              freshnessDate: new Date(),
              ttlHours: 0,
              metadata: { source: "wikipedia", page: page.slug, section: section.heading, label: page.label, part: String(partNum) },
            });
          }
        }
      }

      if (allChunks.length > 0) {
        const created = await ingestChunks(allChunks);
        result.chunksCreated += created;
        result.details.push({
          page: page.slug,
          lang,
          sections: article.sections.length,
          chunks: created,
        });
      }

      result.pagesScraped++;
      console.log(`[Wikipedia] ${page.slug} (${lang}): ${article.sections.length} sections, ${allChunks.length} chunks`);

      await sleep(DELAY_MS);
    }
  }

  // Track last scrape time
  await prisma.setting.upsert({
    where: { key: "WIKIPEDIA_LAST_SCRAPE" },
    update: { value: new Date().toISOString() },
    create: { key: "WIKIPEDIA_LAST_SCRAPE", value: new Date().toISOString() },
  });

  console.log(`[Wikipedia] Done: ${result.pagesScraped} pages, ${result.chunksCreated} chunks`);
  return result;
}

/**
 * Check if we should scrape (e.g., not scraped in last 7 days).
 */
export async function shouldScrapeWikipedia(minDaysInterval: number = 7): Promise<boolean> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: "WIKIPEDIA_LAST_SCRAPE" } });
    if (!s?.value) return true;
    const lastScrape = new Date(s.value);
    const daysSince = (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= minDaysInterval;
  } catch {
    return true;
  }
}
