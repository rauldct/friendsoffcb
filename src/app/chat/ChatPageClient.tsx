"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { getAllCountries } from "@/lib/broadcast-data";

const texts = {
  en: {
    hero_title: "BarçaAI",
    hero_subtitle: "Your intelligent FC Barcelona assistant, powered by AI",
    hero_desc: "Get instant answers about matches, travel tips, fan clubs worldwide, news and everything Barça. Join the waitlist for early access.",
    feat_news_title: "AI Daily News",
    feat_news_desc: "Automated daily digests and match chronicles powered by artificial intelligence.",
    feat_penyas_title: "Fan Club Search",
    feat_penyas_desc: "Find your nearest penya from 1,200+ official fan clubs across 60+ countries.",
    feat_live_title: "Live Match Info",
    feat_live_desc: "Real-time scores, AI commentary and match predictions for every Barça game.",
    feat_travel_title: "Travel Guides",
    feat_travel_desc: "Personalized tips for visiting Camp Nou, local recommendations and match day guides.",
    form_title: "Get Early Access",
    form_desc: "Be among the first to chat with BarçaAI. We'll send you an invite when it's your turn.",
    form_email: "Your email",
    form_country: "Your country",
    form_country_placeholder: "Select your country",
    form_country_other: "Other",
    form_submit: "Join the Waitlist",
    form_submitting: "Joining...",
    form_success: "You're on the list! We'll notify you soon.",
    form_already: "You're already on the waitlist! We'll be in touch.",
    form_error: "Something went wrong. Please try again.",
    social_proof: "fans already on the waitlist",
    coming_soon: "Coming Soon",
  },
  es: {
    hero_title: "BarçaAI",
    hero_subtitle: "Tu asistente inteligente del FC Barcelona, impulsado por IA",
    hero_desc: "Obtén respuestas instantáneas sobre partidos, consejos de viaje, peñas en todo el mundo, noticias y todo sobre el Barça. Únete a la lista de espera para acceso anticipado.",
    feat_news_title: "Noticias IA Diarias",
    feat_news_desc: "Resúmenes diarios y crónicas de partidos generados automáticamente con inteligencia artificial.",
    feat_penyas_title: "Buscar Peñas",
    feat_penyas_desc: "Encuentra tu peña más cercana entre más de 1.200 peñas oficiales en más de 60 países.",
    feat_live_title: "Info en Directo",
    feat_live_desc: "Resultados en tiempo real, comentarios IA y predicciones para cada partido del Barça.",
    feat_travel_title: "Guías de Viaje",
    feat_travel_desc: "Consejos personalizados para visitar el Camp Nou, recomendaciones locales y guías de día de partido.",
    form_title: "Acceso Anticipado",
    form_desc: "Sé de los primeros en chatear con BarçaAI. Te enviaremos una invitación cuando sea tu turno.",
    form_email: "Tu email",
    form_country: "Tu país",
    form_country_placeholder: "Selecciona tu país",
    form_country_other: "Otro",
    form_submit: "Unirme a la Lista",
    form_submitting: "Uniéndose...",
    form_success: "¡Estás en la lista! Te avisaremos pronto.",
    form_already: "¡Ya estás en la lista de espera! Te contactaremos pronto.",
    form_error: "Algo salió mal. Inténtalo de nuevo.",
    social_proof: "fans ya en la lista de espera",
    coming_soon: "Próximamente",
  },
};

const features = [
  { key: "news" as const, icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { key: "penyas" as const, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { key: "live" as const, icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { key: "travel" as const, icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function ChatPageClient() {
  const { locale } = useLanguage();
  const t = texts[locale] || texts.en;
  const countries = getAllCountries();

  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [formTs] = useState(() => Date.now());
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "already" | "error">("idle");
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => { if (d.count) setWaitlistCount(d.count); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, country: country || null, source: "barcaai-landing", _hp: hp, _ts: formTs }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(data.message === "already_registered" ? "already" : "success");
        if (data.message === "registered") setWaitlistCount((c) => c + 1);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const featureKeys = {
    news: { title: t.feat_news_title, desc: t.feat_news_desc },
    penyas: { title: t.feat_penyas_title, desc: t.feat_penyas_desc },
    live: { title: t.feat_live_title, desc: t.feat_live_desc },
    travel: { title: t.feat_travel_title, desc: t.feat_travel_desc },
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#A50044] via-[#6B0030] to-[#004D98] text-white py-16 sm:py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#EDBB00] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <span className="text-2xl font-bold">AI</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">
            {t.hero_title}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-3 font-medium">
            {t.hero_subtitle}
          </p>
          <p className="text-base text-white/70 max-w-2xl mx-auto mb-8">
            {t.hero_desc}
          </p>
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full border border-white/20">
            {t.coming_soon}
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feat) => {
            const info = featureKeys[feat.key];
            return (
              <div
                key={feat.key}
                className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#004D98]/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A50044]/10 to-[#004D98]/10 flex items-center justify-center mb-4 group-hover:from-[#A50044]/20 group-hover:to-[#004D98]/20 transition-colors">
                  <svg className="w-6 h-6 text-[#004D98]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feat.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{info.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="max-w-xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{t.form_title}</h2>
          <p className="text-sm text-gray-500 text-center mb-6">{t.form_desc}</p>

          {status === "success" || status === "already" ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">
                {status === "success" ? t.form_success : t.form_already}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <input type="text" name="company" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0,width:0}} />
              <div>
                <label htmlFor="wl-email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.form_email}
                </label>
                <input
                  id="wl-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="culer@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-[#004D98] focus:border-[#004D98] outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="wl-country" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.form_country}
                </label>
                <select
                  id="wl-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-[#004D98] focus:border-[#004D98] outline-none transition-all bg-white"
                >
                  <option value="">{t.form_country_placeholder}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {locale === "es" ? c.name.es : c.name.en}
                    </option>
                  ))}
                  <option value="OTHER">{t.form_country_other}</option>
                </select>
              </div>
              {status === "error" && (
                <p className="text-red-600 text-sm">{t.form_error}</p>
              )}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-xl bg-gradient-to-r from-[#A50044] to-[#004D98] text-white font-semibold py-3 text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {status === "submitting" ? t.form_submitting : t.form_submit}
              </button>
            </form>
          )}

          {waitlistCount >= 10 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-[#004D98]">{waitlistCount.toLocaleString()}</span>{" "}
                {t.social_proof}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
