import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";

const URLS = {
  cataluna: "https://penyes.fcbarcelona.com/ca/les-nostres-penyes/llistat-de-penyes/catalunya",
  spain: "https://penyes.fcbarcelona.com/ca/les-nostres-penyes/llistat-de-penyes/resta-despanya",
  world: "https://penyes.fcbarcelona.com/ca/les-nostres-penyes/llistat-de-penyes/mon",
};

interface PenyaData {
  name: string;
  city: string;
  province: string;
  country: string;
  region: string;
}

const HEADER_WORDS = ["nom de la penya", "localitat", "name", "penya", "nom"];

function isHeader(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return HEADER_WORDS.some(h => lower === h);
}

// Extract city and province from "CITY (PROVINCE)" format
function parseCityProvince(raw: string): { city: string; province: string } {
  const match = raw.match(/^(.+?)\s*\((.+?)\)\s*$/);
  return match ? { city: match[1].trim(), province: match[2].trim() } : { city: raw.trim(), province: "" };
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ca,es;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function parseSpanishPage(html: string, region: "cataluna" | "spain"): PenyaData[] {
  const $ = cheerio.load(html);
  const penyes: PenyaData[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 2) {
      const name = $(cells[0]).text().trim();
      const locationRaw = $(cells[1]).text().trim();
      if (name && locationRaw && !isHeader(name)) {
        const { city, province } = parseCityProvince(locationRaw);
        penyes.push({ name, city, province, country: "España", region });
      }
    }
  });

  return penyes;
}

function parseWorld(html: string): PenyaData[] {
  const $ = cheerio.load(html);
  const penyes: PenyaData[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 2) {
      const name = $(cells[0]).text().trim();
      const locationRaw = $(cells[1]).text().trim();
      if (name && locationRaw && !isHeader(name)) {
        // World format: "CITY (COUNTRY)"
        const match = locationRaw.match(/^(.+?)\s*\((.+?)\)\s*$/);
        const city = match ? match[1].trim() : locationRaw;
        const country = match ? match[2].trim() : locationRaw;
        penyes.push({ name, city, province: "", country, region: "world" });
      }
    }
  });

  return penyes;
}

export async function scrapePenyes(): Promise<{ total: number; cataluna: number; spain: number; world: number }> {
  const [htmlCat, htmlSpain, htmlWorld] = await Promise.all([
    fetchPage(URLS.cataluna),
    fetchPage(URLS.spain),
    fetchPage(URLS.world),
  ]);

  const catPenyes = parseSpanishPage(htmlCat, "cataluna");
  const spainPenyes = parseSpanishPage(htmlSpain, "spain");
  const worldPenyes = parseWorld(htmlWorld);

  const all = [...catPenyes, ...spainPenyes, ...worldPenyes];

  for (const p of all) {
    await prisma.penya.upsert({
      where: {
        name_city_country: { name: p.name, city: p.city, country: p.country },
      },
      create: p,
      update: { province: p.province, region: p.region },
    });
  }

  return {
    total: all.length,
    cataluna: catPenyes.length,
    spain: spainPenyes.length,
    world: worldPenyes.length,
  };
}
