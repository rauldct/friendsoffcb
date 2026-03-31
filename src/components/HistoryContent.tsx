"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

interface TimelineSection {
  titleKey: string;
  yearKey: string;
  textKey: string;
  image: string;
  imageAlt: string;
}

const timelineSections: TimelineSection[] = [
  {
    titleKey: "history.origins.title",
    yearKey: "history.origins.year",
    textKey: "history.origins.text",
    image: "/images/history/gamper.jpg",
    imageAlt: "Joan Gamper, founder of FC Barcelona, 1910",
  },
  {
    titleKey: "history.golden.title",
    yearKey: "history.golden.year",
    textKey: "history.golden.text",
    image: "/images/history/kubala.jpg",
    imageAlt: "Statue of László Kubala at Camp Nou",
  },
  {
    titleKey: "history.dream.title",
    yearKey: "history.dream.year",
    textKey: "history.dream.text",
    image: "/images/history/cruyff.jpg",
    imageAlt: "Johan Cruyff, architect of the Dream Team",
  },
  {
    titleKey: "history.messi.title",
    yearKey: "history.messi.year",
    textKey: "history.messi.text",
    image: "/images/history/messi.jpg",
    imageAlt: "Lionel Messi, the greatest player in football history",
  },
  {
    titleKey: "history.present.title",
    yearKey: "history.present.year",
    textKey: "history.present.text",
    image: "/images/history/camp-nou-aerial.jpg",
    imageAlt: "Aerial view of Camp Nou during Espai Barça renovation",
  },
];

function WaitlistModal({ open, onClose, isEs }: { open: boolean; onClose: () => void; isEs: boolean }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [formTs] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "barcaai-history", _hp: hp, _ts: formTs }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-[#A50044] to-[#004D98] px-6 py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">AI</span>
          </div>
          <h3 className="text-2xl font-heading font-bold text-white">
            {isEs ? "BarçaAI est\u00e1 llegando" : "BarçaAI is Coming"}
          </h3>
          <p className="text-white/80 text-sm mt-2">
            {isEs ? "Acceso anticipado por invitaci\u00f3n" : "Early access by invitation only"}
          </p>
        </div>

        <div className="px-6 py-6">
          {status === "success" ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-[#1A1A2E] mb-1">
                {isEs ? "\u00a1Est\u00e1s en la lista!" : "You're on the list!"}
              </h4>
              <p className="text-gray-600 text-sm">
                {isEs
                  ? "Te avisaremos cuando sea tu turno. Los primeros en apuntarse tendr\u00e1n acceso exclusivo."
                  : "We'll notify you when it's your turn. Early sign-ups get exclusive access."}
              </p>
              <button onClick={onClose} className="mt-5 text-sm text-[#004D98] font-medium hover:underline">
                {isEs ? "Cerrar" : "Close"}
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-sm leading-relaxed mb-1">
                {isEs
                  ? "Estamos construyendo el asistente de IA definitivo para los culés. Pregunta sobre historia, leyendas, estad\u00edsticas, partidos, viajes y mucho m\u00e1s."
                  : "We're building the ultimate AI assistant for cul\u00e9s. Ask about history, legends, stats, matches, travel, and much more."}
              </p>
              <p className="text-gray-500 text-xs mb-5">
                {isEs
                  ? "Plazas limitadas. Los primeros en la lista tendr\u00e1n acceso prioritario y funciones exclusivas."
                  : "Limited spots. Early sign-ups get priority access and exclusive features."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Honeypot */}
                <input type="text" name="company" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0,width:0}} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isEs ? "Tu email" : "Your email"}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/20 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-lg bg-gradient-to-r from-[#A50044] to-[#004D98] px-4 py-3 text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-60"
                >
                  {status === "sending"
                    ? (isEs ? "Apuntando..." : "Joining...")
                    : (isEs ? "Quiero acceso anticipado" : "Get Early Access")}
                </button>
                {status === "error" && (
                  <p className="text-red-500 text-xs text-center">
                    {isEs ? "Error. Int\u00e9ntalo de nuevo." : "Something went wrong. Try again."}
                  </p>
                )}
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                {isEs ? "Sin spam. Solo te avisaremos cuando est\u00e9 listo." : "No spam. We'll only notify you when it's ready."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryContent() {
  const { t } = useLanguage();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const isEs = t("history.title") === "La Historia del FC Barcelona";

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/history/camp-nou-panoramic.jpg"
          alt="Camp Nou panoramic view"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/70 via-[#1A1A2E]/50 to-[#1A1A2E]/80" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-4 drop-shadow-lg">
            {t("history.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            {t("history.subtitle")}
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#A50044] via-[#EDBB00] to-[#004D98] hidden md:block" />

          {timelineSections.map((section, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <div key={idx} className="mb-16 md:mb-24 relative">
                {/* Timeline dot (desktop) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-8 w-4 h-4 rounded-full bg-[#A50044] border-4 border-white shadow-lg z-10 hidden md:block" />

                <div className={`md:flex md:items-start md:gap-12 ${isLeft ? "" : "md:flex-row-reverse"}`}>
                  {/* Image side */}
                  <div className={`md:w-1/2 ${isLeft ? "md:pr-12" : "md:pl-12"}`}>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl group">
                      <Image
                        src={section.image}
                        alt={section.imageAlt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  </div>

                  {/* Text side */}
                  <div className={`md:w-1/2 mt-6 md:mt-0 ${isLeft ? "md:pl-12" : "md:pr-12"}`}>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-[#A50044]/10 text-[#A50044] mb-3">
                      {t(section.yearKey)}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#1A1A2E] mb-4">
                      {t(section.titleKey)}
                    </h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {t(section.textKey)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sidebar Sections: Camp Nou & La Masia */}
      <section className="bg-[#F5F5F5] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Camp Nou */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/images/history/camp-nou-aerial.jpg"
                  alt="Camp Nou aerial view"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-heading font-bold text-[#1A1A2E] mb-3">
                  {t("history.campnou.title")}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("history.campnou.text")}
                </p>
              </div>
            </div>

            {/* La Masia */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/images/history/la-masia.jpg"
                  alt="La Masia youth academy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-heading font-bold text-[#1A1A2E] mb-3">
                  {t("history.lamasia.title")}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("history.lamasia.text")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Champions Trophy */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl mb-8 max-w-md mx-auto">
            <Image
              src="/images/history/champions.jpg"
              alt="UEFA Champions League Trophy"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-[#1A1A2E]">
            <span className="bg-[#EDBB00]/20 px-4 py-2 rounded-full">5x Champions League</span>
            <span className="bg-[#A50044]/10 px-4 py-2 rounded-full">27x La Liga</span>
            <span className="bg-[#004D98]/10 px-4 py-2 rounded-full">31x Copa del Rey</span>
            <span className="bg-[#EDBB00]/20 px-4 py-2 rounded-full">3x Club World Cup</span>
          </div>
        </div>
      </section>

      {/* CTA to BarçaAI — now opens waitlist modal */}
      <section className="bg-gradient-to-r from-[#1A1A2E] to-[#004D98] py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
            {t("history.cta")}
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            {isEs
              ? "Pregunta lo que quieras sobre la historia, jugadores, estad\u00edsticas y leyendas del FC Barcelona."
              : "Ask anything about Barcelona's history, players, stats, and legends."}
          </p>
          <button
            onClick={() => setWaitlistOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#EDBB00] px-8 py-3.5 text-base font-semibold text-[#1A1A2E] transition-all hover:bg-[#d4a800] hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            BarçaAI Chat
          </button>
          <p className="text-xs text-white/50 mt-6">
            {t("history.photoCredit")}
          </p>
        </div>
      </section>

      {/* Team Historic Photo */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/history/team-historic.jpg"
              alt="FC Barcelona historic team photo, 1909"
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
          <p className="text-center text-sm text-gray-400 mt-3">
            FC Barcelona, 1909 — Blanco y Negro
          </p>
        </div>
      </section>

      {/* Waitlist Modal */}
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} isEs={isEs} />
    </div>
  );
}
