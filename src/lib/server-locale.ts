import { headers } from "next/headers";

export type Locale = "en" | "es";

/**
 * Get the locale from the x-locale header set by middleware.
 * Falls back to "en" if not set.
 */
export function getServerLocale(): Locale {
  const h = headers();
  const locale = h.get("x-locale");
  return locale === "es" ? "es" : "en";
}

const BASE = "https://friendsofbarca.com";

/**
 * Generate proper hreflang alternates for a given path.
 * EN version: /path
 * ES version: /es/path
 */
export function localizedAlternates(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const enUrl = `${BASE}${cleanPath}`;
  const esUrl = `${BASE}/es${cleanPath}`;
  return {
    canonical: enUrl,
    languages: {
      "en": enUrl,
      "es": esUrl,
      "x-default": enUrl,
    },
  };
}

/**
 * Generate locale-aware alternates (canonical matches the current locale).
 */
export function localizedAlternatesForLocale(path: string, locale: Locale) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const enUrl = `${BASE}${cleanPath}`;
  const esUrl = `${BASE}/es${cleanPath}`;
  return {
    canonical: locale === "es" ? esUrl : enUrl,
    languages: {
      "en": enUrl,
      "es": esUrl,
      "x-default": enUrl,
    },
  };
}
