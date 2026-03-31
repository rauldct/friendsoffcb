/**
 * Static broadcast data for FC Barcelona matches by competition and country.
 * TV rights change per season, not per match. Updated for 2025/26 season.
 */

export interface BroadcastEntry {
  countryCode: string;
  countryName: { en: string; es: string };
  flag: string;
  channels: string[];
}

export interface CompetitionBroadcasts {
  competition: string;
  broadcasts: BroadcastEntry[];
}

const LA_LIGA: BroadcastEntry[] = [
  { countryCode: "ES", countryName: { en: "Spain", es: "España" }, flag: "🇪🇸", channels: ["Movistar+", "DAZN"] },
  { countryCode: "US", countryName: { en: "United States", es: "Estados Unidos" }, flag: "🇺🇸", channels: ["ESPN+", "ESPN Deportes"] },
  { countryCode: "GB", countryName: { en: "United Kingdom", es: "Reino Unido" }, flag: "🇬🇧", channels: ["Premier Sports", "LaLigaTV"] },
  { countryCode: "DE", countryName: { en: "Germany", es: "Alemania" }, flag: "🇩🇪", channels: ["DAZN"] },
  { countryCode: "FR", countryName: { en: "France", es: "Francia" }, flag: "🇫🇷", channels: ["beIN Sports"] },
  { countryCode: "IT", countryName: { en: "Italy", es: "Italia" }, flag: "🇮🇹", channels: ["DAZN"] },
  { countryCode: "PT", countryName: { en: "Portugal", es: "Portugal" }, flag: "🇵🇹", channels: ["Eleven Sports"] },
  { countryCode: "NL", countryName: { en: "Netherlands", es: "Países Bajos" }, flag: "🇳🇱", channels: ["Ziggo Sport"] },
  { countryCode: "BR", countryName: { en: "Brazil", es: "Brasil" }, flag: "🇧🇷", channels: ["ESPN Brasil", "Star+"] },
  { countryCode: "AR", countryName: { en: "Argentina", es: "Argentina" }, flag: "🇦🇷", channels: ["ESPN", "Star+"] },
  { countryCode: "MX", countryName: { en: "Mexico", es: "México" }, flag: "🇲🇽", channels: ["SKY Sports"] },
  { countryCode: "CO", countryName: { en: "Colombia", es: "Colombia" }, flag: "🇨🇴", channels: ["ESPN", "Star+"] },
  { countryCode: "CL", countryName: { en: "Chile", es: "Chile" }, flag: "🇨🇱", channels: ["ESPN", "Star+"] },
  { countryCode: "JP", countryName: { en: "Japan", es: "Japón" }, flag: "🇯🇵", channels: ["WOWOW", "DAZN"] },
  { countryCode: "KR", countryName: { en: "South Korea", es: "Corea del Sur" }, flag: "🇰🇷", channels: ["SPOTV"] },
  { countryCode: "CN", countryName: { en: "China", es: "China" }, flag: "🇨🇳", channels: ["iQIYI Sports"] },
  { countryCode: "IN", countryName: { en: "India", es: "India" }, flag: "🇮🇳", channels: ["Viacom18", "JioCinema"] },
  { countryCode: "AU", countryName: { en: "Australia", es: "Australia" }, flag: "🇦🇺", channels: ["beIN Sports"] },
  { countryCode: "CA", countryName: { en: "Canada", es: "Canadá" }, flag: "🇨🇦", channels: ["TSN", "RDS"] },
  { countryCode: "SA", countryName: { en: "Saudi Arabia", es: "Arabia Saudí" }, flag: "🇸🇦", channels: ["SSC Sports"] },
  { countryCode: "AE", countryName: { en: "UAE", es: "EAU" }, flag: "🇦🇪", channels: ["beIN Sports"] },
  { countryCode: "TR", countryName: { en: "Turkey", es: "Turquía" }, flag: "🇹🇷", channels: ["Smart Spor"] },
  { countryCode: "PL", countryName: { en: "Poland", es: "Polonia" }, flag: "🇵🇱", channels: ["Eleven Sports"] },
  { countryCode: "SE", countryName: { en: "Sweden", es: "Suecia" }, flag: "🇸🇪", channels: ["C More"] },
  { countryCode: "NO", countryName: { en: "Norway", es: "Noruega" }, flag: "🇳🇴", channels: ["TV 2 Sport"] },
];

const CHAMPIONS_LEAGUE: BroadcastEntry[] = [
  { countryCode: "ES", countryName: { en: "Spain", es: "España" }, flag: "🇪🇸", channels: ["Movistar+"] },
  { countryCode: "US", countryName: { en: "United States", es: "Estados Unidos" }, flag: "🇺🇸", channels: ["CBS Sports", "Paramount+"] },
  { countryCode: "GB", countryName: { en: "United Kingdom", es: "Reino Unido" }, flag: "🇬🇧", channels: ["TNT Sports", "Discovery+"] },
  { countryCode: "DE", countryName: { en: "Germany", es: "Alemania" }, flag: "🇩🇪", channels: ["DAZN", "Amazon Prime"] },
  { countryCode: "FR", countryName: { en: "France", es: "Francia" }, flag: "🇫🇷", channels: ["Canal+"] },
  { countryCode: "IT", countryName: { en: "Italy", es: "Italia" }, flag: "🇮🇹", channels: ["Amazon Prime", "Sky Sport"] },
  { countryCode: "PT", countryName: { en: "Portugal", es: "Portugal" }, flag: "🇵🇹", channels: ["Eleven Sports"] },
  { countryCode: "NL", countryName: { en: "Netherlands", es: "Países Bajos" }, flag: "🇳🇱", channels: ["Ziggo Sport"] },
  { countryCode: "BR", countryName: { en: "Brazil", es: "Brasil" }, flag: "🇧🇷", channels: ["TNT Sports", "HBO Max"] },
  { countryCode: "AR", countryName: { en: "Argentina", es: "Argentina" }, flag: "🇦🇷", channels: ["ESPN", "Star+"] },
  { countryCode: "MX", countryName: { en: "Mexico", es: "México" }, flag: "🇲🇽", channels: ["TNT Sports", "HBO Max"] },
  { countryCode: "CO", countryName: { en: "Colombia", es: "Colombia" }, flag: "🇨🇴", channels: ["ESPN", "Star+"] },
  { countryCode: "CL", countryName: { en: "Chile", es: "Chile" }, flag: "🇨🇱", channels: ["ESPN", "Star+"] },
  { countryCode: "JP", countryName: { en: "Japan", es: "Japón" }, flag: "🇯🇵", channels: ["WOWOW"] },
  { countryCode: "KR", countryName: { en: "South Korea", es: "Corea del Sur" }, flag: "🇰🇷", channels: ["SPOTV"] },
  { countryCode: "CN", countryName: { en: "China", es: "China" }, flag: "🇨🇳", channels: ["Migu Sports"] },
  { countryCode: "IN", countryName: { en: "India", es: "India" }, flag: "🇮🇳", channels: ["Sony Sports", "JioCinema"] },
  { countryCode: "AU", countryName: { en: "Australia", es: "Australia" }, flag: "🇦🇺", channels: ["Stan Sport"] },
  { countryCode: "CA", countryName: { en: "Canada", es: "Canadá" }, flag: "🇨🇦", channels: ["DAZN"] },
  { countryCode: "SA", countryName: { en: "Saudi Arabia", es: "Arabia Saudí" }, flag: "🇸🇦", channels: ["SSC Sports"] },
  { countryCode: "AE", countryName: { en: "UAE", es: "EAU" }, flag: "🇦🇪", channels: ["beIN Sports"] },
  { countryCode: "TR", countryName: { en: "Turkey", es: "Turquía" }, flag: "🇹🇷", channels: ["beIN Sports"] },
  { countryCode: "PL", countryName: { en: "Poland", es: "Polonia" }, flag: "🇵🇱", channels: ["Polsat Sport"] },
  { countryCode: "SE", countryName: { en: "Sweden", es: "Suecia" }, flag: "🇸🇪", channels: ["Telia", "TV4"] },
  { countryCode: "NO", countryName: { en: "Norway", es: "Noruega" }, flag: "🇳🇴", channels: ["Viaplay"] },
];

const COPA_DEL_REY: BroadcastEntry[] = [
  { countryCode: "ES", countryName: { en: "Spain", es: "España" }, flag: "🇪🇸", channels: ["RTVE", "DAZN"] },
  { countryCode: "US", countryName: { en: "United States", es: "Estados Unidos" }, flag: "🇺🇸", channels: ["ESPN+"] },
  { countryCode: "GB", countryName: { en: "United Kingdom", es: "Reino Unido" }, flag: "🇬🇧", channels: ["Premier Sports"] },
  { countryCode: "DE", countryName: { en: "Germany", es: "Alemania" }, flag: "🇩🇪", channels: ["DAZN"] },
  { countryCode: "FR", countryName: { en: "France", es: "Francia" }, flag: "🇫🇷", channels: ["beIN Sports"] },
  { countryCode: "IT", countryName: { en: "Italy", es: "Italia" }, flag: "🇮🇹", channels: ["DAZN"] },
  { countryCode: "BR", countryName: { en: "Brazil", es: "Brasil" }, flag: "🇧🇷", channels: ["ESPN Brasil"] },
  { countryCode: "AR", countryName: { en: "Argentina", es: "Argentina" }, flag: "🇦🇷", channels: ["ESPN"] },
  { countryCode: "MX", countryName: { en: "Mexico", es: "México" }, flag: "🇲🇽", channels: ["SKY Sports"] },
  { countryCode: "IN", countryName: { en: "India", es: "India" }, flag: "🇮🇳", channels: ["Viacom18"] },
  { countryCode: "AU", countryName: { en: "Australia", es: "Australia" }, flag: "🇦🇺", channels: ["beIN Sports"] },
  { countryCode: "CA", countryName: { en: "Canada", es: "Canadá" }, flag: "🇨🇦", channels: ["TSN"] },
];

const SUPERCOPA: BroadcastEntry[] = [
  { countryCode: "ES", countryName: { en: "Spain", es: "España" }, flag: "🇪🇸", channels: ["Movistar+"] },
  { countryCode: "US", countryName: { en: "United States", es: "Estados Unidos" }, flag: "🇺🇸", channels: ["ESPN+"] },
  { countryCode: "GB", countryName: { en: "United Kingdom", es: "Reino Unido" }, flag: "🇬🇧", channels: ["Premier Sports"] },
];

const BROADCAST_MAP: Record<string, BroadcastEntry[]> = {
  // La Liga variants
  "La Liga": LA_LIGA,
  "Primera Division": LA_LIGA,
  "PD": LA_LIGA,
  "LaLiga": LA_LIGA,
  // Champions League variants
  "Champions League": CHAMPIONS_LEAGUE,
  "UEFA Champions League": CHAMPIONS_LEAGUE,
  "CL": CHAMPIONS_LEAGUE,
  // Copa del Rey variants
  "Copa del Rey": COPA_DEL_REY,
  "CDR": COPA_DEL_REY,
  // Supercopa
  "Supercopa de España": SUPERCOPA,
  "Spanish Super Cup": SUPERCOPA,
};

export function getBroadcasts(competition: string): BroadcastEntry[] {
  return BROADCAST_MAP[competition] || [];
}

export function getBroadcastsForCountry(competition: string, countryCode: string): BroadcastEntry | undefined {
  const entries = getBroadcasts(competition);
  return entries.find((e) => e.countryCode === countryCode);
}

/** Get unique list of all countries across all competitions */
export function getAllCountries(): { code: string; name: { en: string; es: string }; flag: string }[] {
  const seen = new Set<string>();
  const countries: { code: string; name: { en: string; es: string }; flag: string }[] = [];

  for (const entries of Object.values(BROADCAST_MAP)) {
    for (const entry of entries) {
      if (!seen.has(entry.countryCode)) {
        seen.add(entry.countryCode);
        countries.push({ code: entry.countryCode, name: entry.countryName, flag: entry.flag });
      }
    }
  }
  return countries.sort((a, b) => a.name.en.localeCompare(b.name.en));
}

/** Map common timezones to country codes for auto-detection */
const TZ_TO_COUNTRY: Record<string, string> = {
  "Europe/Madrid": "ES", "Europe/Barcelona": "ES", "Atlantic/Canary": "ES",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US",
  "Europe/London": "GB",
  "Europe/Berlin": "DE", "Europe/Munich": "DE",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL",
  "America/Sao_Paulo": "BR", "America/Rio_Branco": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Mexico_City": "MX", "America/Cancun": "MX",
  "America/Bogota": "CO",
  "America/Santiago": "CL",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN", "Asia/Hong_Kong": "CN",
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU",
  "America/Toronto": "CA", "America/Vancouver": "CA",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Europe/Istanbul": "TR",
  "Europe/Warsaw": "PL",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
};

export function detectCountryFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_COUNTRY[tz] || "US";
  } catch {
    return "US";
  }
}
