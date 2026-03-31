const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const id = '981b15f9-e2e4-49c3-848c-90a5c35bee83';
  const nl = await prisma.newsletter.findUnique({ where: { id } });
  if (!nl) { console.log('NOT FOUND'); return; }

  let raw = nl.htmlContent;

  // Find CTA button that marks end of AI content
  const ctaIdx = raw.indexOf('<p style="text-align: center; margin-top: 24px;">');
  let afterAI = '';
  if (ctaIdx > 0) {
    afterAI = raw.substring(ctaIdx);
    raw = raw.substring(0, ctaIdx).trim();
  }

  // Strip ```json wrapper
  raw = raw.replace(/^\s*```(?:json)?\s*\n?/, '').trim();

  // Extract EN content: find "en": " then extract until ",\n  "es"
  const enStartMarker = '"en": "';
  const enStart = raw.indexOf(enStartMarker);
  if (enStart < 0) {
    console.error('Cannot find "en" key');
    await prisma.$disconnect();
    return;
  }

  const enContentStart = enStart + enStartMarker.length;

  // Find where EN value ends: look for ",\n  "es" pattern
  // The JSON structure is: {"en": "...html...", "es": "...html..."}
  // We need to find the boundary between en and es values
  // Look for '",\n  "es": "' pattern
  const esKeyPattern = /",\s*"es":\s*"/;
  const esMatch = raw.substring(enContentStart).match(esKeyPattern);

  let enHtml, esHtml;

  if (esMatch) {
    const boundary = enContentStart + esMatch.index;
    enHtml = raw.substring(enContentStart, boundary);
    const esContentStart = boundary + esMatch[0].length;
    // ES content goes to the end (may be truncated)
    esHtml = raw.substring(esContentStart);
    // Remove trailing "} if present
    esHtml = esHtml.replace(/"\s*}\s*$/, '');
    // If truncated, close any open tags
    console.log('Found both EN and ES content');
  } else {
    // No ES found, treat all as EN
    enHtml = raw.substring(enContentStart);
    enHtml = enHtml.replace(/"\s*}\s*$/, '');
    esHtml = '';
    console.log('Only EN content found');
  }

  // Unescape JSON string escapes
  const unescapeJson = (s) => s
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t');

  enHtml = unescapeJson(enHtml).trim();
  esHtml = unescapeJson(esHtml).trim();

  console.log('EN length:', enHtml.length);
  console.log('ES length:', esHtml.length);
  console.log('EN starts:', enHtml.substring(0, 80));
  console.log('EN ends:', enHtml.substring(enHtml.length - 80));
  console.log('ES ends:', esHtml.substring(esHtml.length - 80));

  // Check if ES is truncated (doesn't end with </p> or similar closing tag)
  const esIsTruncated = esHtml.length > 0 && !esHtml.match(/<\/(p|div|ul|strong|a|h[23])>\s*$/);
  if (esIsTruncated) {
    console.log('\nES content is truncated, will close it cleanly');
    // Close the last open paragraph
    esHtml += '...</p>';
  }

  const SITE_URL = 'https://friendsofbarca.com';

  // Extract news cards + package banner from the after-AI suffix
  const newsCardsIdx = afterAI.indexOf('<h2 style="margin-top:32px;');
  let newsAndPackage = '';
  if (newsCardsIdx >= 0) {
    newsAndPackage = afterAI.substring(newsCardsIdx);
  }

  // Build final htmlContent (EN)
  const htmlContent = `${enHtml}
        <p style="text-align: center; margin-top: 24px;">
          <a href="${SITE_URL}/news" class="cta-button">Read All News</a>
        </p>
      ${newsAndPackage}`;

  // Build htmlContentEs
  const htmlContentEs = esHtml ? `${esHtml}
          <p style="text-align: center; margin-top: 24px;">
            <a href="${SITE_URL}/news" class="cta-button">Leer Todas las Noticias</a>
          </p>
        ${newsAndPackage}` : null;

  // Plain text
  const stripHtml = (html) =>
    html
      .replace(/<h2[^>]*>/g, '\n\n## ')
      .replace(/<\/h2>/g, '\n')
      .replace(/<h3[^>]*>/g, '\n### ')
      .replace(/<\/h3>/g, '\n')
      .replace(/<li>/g, '- ')
      .replace(/<\/li>/g, '\n')
      .replace(/<img[^>]*>/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  await prisma.newsletter.update({
    where: { id },
    data: {
      htmlContent,
      htmlContentEs,
      textContent: stripHtml(enHtml),
      textContentEs: esHtml ? stripHtml(esHtml) : null,
    },
  });

  console.log('\nNewsletter updated successfully');
  console.log('htmlContent length:', htmlContent.length);
  if (htmlContentEs) console.log('htmlContentEs length:', htmlContentEs.length);

  await prisma.$disconnect();
})();
