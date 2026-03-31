"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [formTs] = useState(() => Date.now()); // form load timestamp
  const [status, setStatus] = useState<"idle"|"success"|"error">("idle");
  const { locale, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: locale, source: "newsletter_section", _hp: hp, _ts: formTs }),
      });
      if (res.ok) { setStatus("success"); setEmail(""); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-[#A50044] to-[#004D98]">
      <div className="container-custom text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">{t("section.newsletter")}</h2>
        <p className="text-gray-200 mb-8 max-w-xl mx-auto">{t("section.newsletterDesc")}</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          {/* Honeypot */}
          <input type="text" name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0,width:0}} />
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("form.yourEmail")} className="flex-1 px-4 py-3 rounded-lg text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#EDBB00]"/>
          <button type="submit" className="btn-gold py-3 px-8">{t("form.subscribe")}</button>
        </form>
        {status==="success"&&<p className="text-green-300 mt-3 text-sm">{t("form.subscribed")}</p>}
        {status==="error"&&<p className="text-red-300 mt-3 text-sm">{t("form.error")}</p>}
      </div>
    </section>
  );
}
