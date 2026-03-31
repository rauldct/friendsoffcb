"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [hp, setHp] = useState(""); // honeypot
  const [formTs] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, _hp: hp, _ts: formTs }),
      });
      if (res.ok) { setStatus("success"); setForm({ name: "", email: "", message: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="section-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4 text-center">{t("contact.title")}</h1>
        <p className="text-gray-500 text-center mb-10">{t("contact.desc")}</p>

        {status === "success" ? (
          <div className="text-center py-12 bg-green-50 rounded-2xl">
            <span className="text-4xl block mb-4">✉️</span>
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-2">{t("contact.success")}</h2>
            <p className="text-gray-600">{t("contact.successDesc")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot */}
            <input type="text" name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0,width:0}} />
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">{t("contact.name")}</label>
              <input type="text" id="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98]" placeholder={t("form.yourName")}/>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t("contact.email")} *</label>
              <input type="email" id="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98]" placeholder={t("form.yourEmail")}/>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">{t("contact.message")} *</label>
              <textarea id="message" required rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98]"/>
            </div>
            <button type="submit" disabled={status==="sending"} className="btn-primary w-full py-4 disabled:opacity-50">
              {status==="sending"?t("contact.sending"):t("contact.send")}
            </button>
            {status==="error"&&<p className="text-red-500 text-sm text-center">{t("form.error")}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
