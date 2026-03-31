"use client";
import Link from "next/link";
import { useState } from "react";
import FeedbackModal from "./FeedbackModal";
import { useLanguage, useLocalePath } from "@/lib/LanguageContext";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [formTs] = useState(() => Date.now()); // form load timestamp
  const [status, setStatus] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const { locale, t } = useLanguage();
  const lp = useLocalePath();
  const [language, setLanguage] = useState<string>(locale);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language, source: "footer", _hp: hp, _ts: formTs }),
      });
      if (res.ok) { setStatus("success"); setEmail(""); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  const quickLinks = [
    { href: lp("/"), label: t("nav.home") },
    { href: lp("/competitions"), label: t("nav.competitions") },
    { href: lp("/packages"), label: t("nav.packages") },
    { href: lp("/news"), label: t("nav.news") },
    { href: lp("/blog"), label: t("nav.blog") },
    { href: lp("/guides"), label: t("nav.guides") },
    { href: lp("/about"), label: t("nav.about") },
    { href: lp("/faq"), label: "FAQ" },
    { href: lp("/contact"), label: t("misc.contact") },
  ];

  return (
    <footer className="bg-[#1A1A2E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">&#9917; Friends of <span className="text-[#EDBB00]">Barça</span></h3>
            <p className="text-gray-400 text-sm mb-4">{t("footer.desc")}</p>
          </div>
          <div>
            <h4 className="font-heading font-bold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {quickLinks.map(l=>(
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold mb-4">{t("footer.popularGuides")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/guides/first-time-camp-nou" className="hover:text-white">{t("footer.guide1")}</Link></li>
              <li><Link href="/guides/best-bars-camp-nou" className="hover:text-white">{t("footer.guide2")}</Link></li>
              <li><Link href="/guides/getting-to-camp-nou" className="hover:text-white">{t("footer.guide3")}</Link></li>
              <li><Link href="/guides/barca-ticket-prices" className="hover:text-white">{t("footer.guide4")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold mb-4">{t("footer.newsletter")}</h4>
            <p className="text-sm text-gray-400 mb-3">{t("footer.newsletterDesc")}</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              {/* Honeypot - hidden from humans, visible to bots */}
              <input type="text" name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0,width:0}} />
              <div className="flex gap-2">
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("form.yourEmail")} className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#EDBB00]"/>
                <select value={language} onChange={e=>setLanguage(e.target.value)} className="px-2 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-[#EDBB00] appearance-none cursor-pointer" title="Newsletter language">
                  <option value="en" className="bg-[#1A1A2E]">EN</option>
                  <option value="es" className="bg-[#1A1A2E]">ES</option>
                </select>
                <button type="submit" className="bg-[#EDBB00] text-[#1A1A2E] px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-500">Go</button>
              </div>
            </form>
            {status==="success"&&<p className="text-green-400 text-xs mt-2">{t("footer.subscribed")}</p>}
            {status==="error"&&<p className="text-red-400 text-xs mt-2">{t("form.error")}</p>}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>{t("footer.rights")}</p>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setShowFeedback(true)}
                className="text-[#EDBB00] hover:text-yellow-300 font-medium transition-colors"
              >
                {t("footer.sendFeedback")}
              </button>
              <Link href="/privacy" className="hover:text-white">{t("footer.privacyPolicy")}</Link>
              <Link href="/terms" className="hover:text-white">{t("footer.termsOfUse")}</Link>
              <Link href="/cookies" className="hover:text-white">{t("footer.cookiePolicy")}</Link>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <p>{t("footer.disclaimer")}</p>
            <p>{t("footer.affiliate")}</p>
          </div>
        </div>
      </div>
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </footer>
  );
}
