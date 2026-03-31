"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function HtmlLangSync() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
