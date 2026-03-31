"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, t as translate } from "./i18n";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Synchronous detection: check URL path first (works on client)
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p.startsWith("/es/") || p === "/es") return "es";
      // Fallback: cookie
      const cm = document.cookie.match(/(?:^|; )locale=(en|es)/);
      if (cm) return cm[1] as Locale;
    }
    return "en";
  });

  useEffect(() => {
    // Persist locale to cookie + localStorage
    localStorage.setItem("locale", locale);
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  };

  const t = (key: string) => translate(locale, key);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Returns a function that prefixes paths with /es when locale is Spanish.
 * Usage: const lp = useLocalePath(); <Link href={lp("/news/slug")}>
 */
export function useLocalePath() {
  const { locale } = useContext(LanguageContext);
  return (path: string) => locale === "es" ? `/es${path}` : path;
}
