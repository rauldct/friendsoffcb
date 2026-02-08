"use client";
import { useState } from "react";

export default function LeadCaptureForm({ matchSlug }: { matchSlug?: string }) {
  const [form, setForm] = useState({ name: "", email: "", groupSize: "", country: "", message: "" });
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");

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
        <h3 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">Thank You!</h3>
        <p className="text-gray-600">We&apos;ll get back to you within 24 hours with a custom package.</p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h3 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">Want Us to Plan Everything?</h3>
      <p className="text-gray-500 text-sm mb-6">Leave your details and our team will create a custom package for you.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" placeholder="Your Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
          <input type="email" required placeholder="Email *" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select value={form.groupSize} onChange={e=>setForm({...form,groupSize:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] text-gray-600">
            <option value="">Group Size</option>
            {[1,2,3,4,5,6,7,8,9].map(n=><option key={n} value={n}>{n}</option>)}
            <option value="10">10+</option>
          </select>
          <input type="text" placeholder="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
        </div>
        <textarea placeholder="Tell us about your ideal experience..." rows={3} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98]"/>
        <button type="submit" disabled={status==="sending"} className="btn-primary w-full py-4 disabled:opacity-50">
          {status==="sending"?"Sending...":"Get My Custom Package"}
        </button>
      </form>
      {status==="error"&&<p className="text-red-500 text-sm mt-3">Something went wrong. Please try again.</p>}
    </div>
  );
}
