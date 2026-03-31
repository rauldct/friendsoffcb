"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Breadcrumbs from "./Breadcrumbs";

interface FaqItem {
  q: string;
  qEs: string;
  a: string;
  aEs: string;
}

export default function FaqContent({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { locale } = useLanguage();
  const isEs = locale === "es";

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#004D98] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: isEs ? "Inicio" : "Home", href: "/" },
              { label: "FAQ" },
            ]}
          />
          <h1 className="text-3xl sm:text-4xl font-heading font-bold mt-4">
            {isEs ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
          </h1>
          <p className="mt-2 text-gray-300 text-lg">
            {isEs
              ? "Todo lo que necesitas saber sobre entradas, Camp Nou y tu viaje a Barcelona"
              : "Everything you need to know about tickets, Camp Nou, and your trip to Barcelona"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 text-base sm:text-lg">
                    {isEs ? faq.qEs : faq.q}
                  </span>
                  <svg
                    className={`w-5 h-5 shrink-0 text-[#004D98] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96" : "max-h-0"}`}
                >
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                    {isEs ? faq.aEs : faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#004D98] to-[#A50044] rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-heading font-bold mb-2">
            {isEs ? "¿No encuentras lo que buscas?" : "Can't find what you're looking for?"}
          </h2>
          <p className="text-white/80 mb-4">
            {isEs
              ? "Contáctanos y te ayudaremos con cualquier pregunta sobre tu viaje a Barcelona"
              : "Get in touch and we'll help you with any questions about your Barcelona trip"}
          </p>
          <a
            href="/contact"
            className="inline-block bg-[#EDBB00] text-[#1A1A2E] px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
          >
            {isEs ? "Contáctanos" : "Contact Us"}
          </a>
        </div>
      </div>
    </div>
  );
}
