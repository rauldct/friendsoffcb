"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function LeadCaptureForm({ matchSlug }: { matchSlug?: string }) {
  const [form, setForm] = useState({ name: "", email: "", groupSize: "", country: "", message: "" });
  const [hp, setHp] = useState(""); // honeypot
  const [formTs] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          groupSize: form.groupSize ? parseInt(form.groupSize) : undefined,
          matchInterested: matchSlug,
          source: typeof window !== "undefined" ? window.location.pathname : "",
          _hp: hp,
          _ts: formTs,
        }),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  if (status === "success") {
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl mb-4 block">🎉</span>
        <h3 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">{t("lead.success")}</h3>
        <p className="text-gray-600">{t("lead.successDesc")}</p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h3 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">{t("lead.title")}</h3>
      <p className="text-gray-500 text-sm mb-6">{t("lead.desc")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot */}
        <input type="text" name="company" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0,width:0}} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" placeholder={t("form.yourName")} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
          <input type="email" required placeholder={t("form.yourEmail") + " *"} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select value={form.groupSize} onChange={e=>setForm({...form,groupSize:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] text-gray-600">
            <option value="">{t("form.groupSize")}</option>
            {[1,2,3,4,5,6,7,8,9].map(n=><option key={n} value={n}>{n}</option>)}
            <option value="10">10+</option>
          </select>
          <input type="text" placeholder={t("form.country")} value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
        </div>
        <textarea placeholder={t("lead.placeholder")} rows={3} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
        <button type="submit" disabled={status==="sending"} className="btn-primary w-full py-4 disabled:opacity-50">
          {status==="sending"?t("lead.sending"):t("lead.submit")}
        </button>
      </form>
      {status==="error"&&<p className="text-red-500 text-sm mt-3">{t("form.error")}</p>}
    </div>
  );
}
