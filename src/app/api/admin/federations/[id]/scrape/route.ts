import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scrapePage } from "@/lib/penya-enrichment";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const federation = await prisma.penyaFederation.findUnique({
      where: { id: params.id },
    });
    if (!federation) {
      return NextResponse.json(
        { error: "Federation not found" },
        { status: 404 }
      );
    }
    if (!federation.website) {
      return NextResponse.json(
        { error: "Federation has no website configured" },
        { status: 400 }
      );
    }

    console.log(
      `[Federation Scrape] Scraping ${federation.name}: ${federation.website}`
    );

    const mainPage = await scrapePage(federation.website);
    if (!mainPage) {
      return NextResponse.json(
        { error: "Failed to scrape website - site may be down or blocking requests" },
        { status: 422 }
      );
    }

    // Try to find a "peñas" or "listado" subpage
    const subPages: { url: string; title: string; bodyText: string; emails: string[]; phones: string[] }[] = [];
    const bodyLower = mainPage.bodyText.toLowerCase();
    const htmlContent = mainPage.bodyText; // already extracted text

    // Look for links in the scraped content that might lead to peña lists
    const penyaKeywords = ["peñas", "penyes", "listado", "miembros", "asociadas", "nuestras"];
    const baseUrl = new URL(federation.website);

    // Re-scrape to find links (we need the HTML, not just text)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(federation.website, {
        headers: {
          "User-Agent": "CuleBot/1.0 (https://friendsofbarca.com; rauloasys@gmail.com)",
          Accept: "text/html",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (res.ok) {
        const cheerio = await import("cheerio");
        const html = await res.text();
        const $ = cheerio.load(html);

        const subLinks: string[] = [];
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href") || "";
          const text = $(el).text().toLowerCase();
          const hasKeyword = penyaKeywords.some(
            (k) => text.includes(k) || href.toLowerCase().includes(k)
          );
          if (hasKeyword && href) {
            try {
              const fullUrl = new URL(href, baseUrl.origin).href;
              if (fullUrl.startsWith("http") && !subLinks.includes(fullUrl)) {
                subLinks.push(fullUrl);
              }
            } catch { /* invalid URL */ }
          }
        });

        // Scrape up to 3 subpages
        for (const link of subLinks.slice(0, 3)) {
          console.log(`[Federation Scrape] Scraping subpage: ${link}`);
          const subPage = await scrapePage(link);
          if (subPage) {
            subPages.push({
              url: subPage.url,
              title: subPage.title,
              bodyText: subPage.bodyText,
              emails: subPage.emails,
              phones: subPage.phones,
            });
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch (err) {
      console.error("[Federation Scrape] Subpage scraping error:", err);
    }

    // Extract peña names from scraped content
    const allText = [mainPage.bodyText, ...subPages.map((p) => p.bodyText)].join("\n");
    const penyaNames = extractPenyaNames(allText);

    const scrapedData = {
      mainPage: {
        url: mainPage.url,
        title: mainPage.title,
        description: mainPage.description,
        emails: mainPage.emails,
        phones: mainPage.phones,
        socialLinks: mainPage.socialLinks,
        bodyText: mainPage.bodyText,
      },
      subPages,
      extractedPenyaNames: penyaNames,
      scrapedAt: new Date().toISOString(),
    };

    // Update federation with scraped data
    const updated = await prisma.penyaFederation.update({
      where: { id: params.id },
      data: {
        scrapedData,
        lastScrapedAt: new Date(),
        // Update contact info if found and not already set
        email: federation.email || mainPage.emails[0] || null,
        phone: federation.phone || mainPage.phones[0] || null,
        socialMedia: federation.socialMedia || (
          Object.keys(mainPage.socialLinks).length > 0
            ? mainPage.socialLinks
            : undefined
        ),
      },
    });

    return NextResponse.json({
      success: true,
      scrapedData: {
        title: mainPage.title,
        emails: mainPage.emails,
        phones: mainPage.phones,
        socialLinks: mainPage.socialLinks,
        subPagesScraped: subPages.length,
        penyaNamesFound: penyaNames.length,
      },
      federation: {
        ...updated,
        lastScrapedAt: updated.lastScrapedAt?.toISOString() || null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[Federation Scrape] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scrape failed" },
      { status: 500 }
    );
  }
}

function extractPenyaNames(text: string): string[] {
  const names: string[] = [];
  // Match patterns like "Peña Barcelonista X" or "P.B. X" or "Penya Blaugrana X"
  const patterns = [
    /Peña\s+(?:Barcelonista\s+)?(?:de\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñüA-ZÁÉÍÓÚÑ\s-]{2,40})/g,
    /Penya\s+(?:Blaugrana\s+)?(?:de\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñüA-ZÁÉÍÓÚÑ\s-]{2,40})/g,
    /P\.?\s?B\.?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñüA-ZÁÉÍÓÚÑ\s-]{2,40})/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[0].trim().replace(/\s+/g, " ");
      if (name.length > 5 && !names.includes(name)) {
        names.push(name);
      }
    }
  }
  return [...new Set(names)].slice(0, 100);
}
