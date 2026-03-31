"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);

  const handle = (choice: string) => {
    localStorage.setItem("cookie-consent", choice);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg transition-transform duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {t("cookie.text")}{" "}
          <a href="/cookies" className="text-[#004D98] underline">{t("cookie.policy")}</a>.
        </p>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => handle("declined")} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t("cookie.decline")}</button>
          <button onClick={() => handle("accepted")} className="px-4 py-2 text-sm bg-[#004D98] text-white rounded-lg hover:bg-blue-900 font-medium">{t("cookie.accept")}</button>
        </div>
      </div>
    </div>
  );
}
