"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { locale } = useLanguage();

  useEffect(() => {
    if (window.location.pathname.startsWith("/manualpet")) return;
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
    // Enable GA if it was deferred
    window.dispatchEvent(new Event("cookie_consent_accepted"));
  };

  const reject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
    // Disable GA cookies
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>)["ga-disable-G-X3V9WEQCXC"] = true;
    }
  };

  if (!visible) return null;

  const isEs = locale === "es";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-[#1A1A2E] text-white rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-300">
          <p>
            {isEs
              ? "Usamos cookies para analytics y mejorar tu experiencia. "
              : "We use cookies for analytics and to improve your experience. "}
            <Link href="/cookies" className="text-[#EDBB00] underline hover:text-yellow-300">
              {isEs ? "Política de cookies" : "Cookie Policy"}
            </Link>
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
          >
            {isEs ? "Rechazar" : "Reject"}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-semibold bg-[#EDBB00] text-[#1A1A2E] rounded-lg hover:bg-yellow-400 transition-colors"
          >
            {isEs ? "Aceptar" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
