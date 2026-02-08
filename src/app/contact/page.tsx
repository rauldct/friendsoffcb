"use client";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setStatus("success"); setForm({ name: "", email: "", message: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="section-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4 text-center">Contact Us</h1>
        <p className="text-gray-500 text-center mb-10">Have a question about visiting Camp Nou? Want to collaborate? Drop us a line!</p>

        {status === "success" ? (
          <div className="text-center py-12 bg-green-50 rounded-2xl">
            <span className="text-4xl block mb-4">✉️</span>
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-2">Message Sent!</h2>
            <p className="text-gray-600">We&apos;ll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input type="text" id="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98]" placeholder="Your name"/>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input type="email" id="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98]" placeholder="your@email.com"/>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea id="message" required rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98]" placeholder="Tell us how we can help..."/>
            </div>
            <button type="submit" disabled={status==="sending"} className="btn-primary w-full py-4 disabled:opacity-50">
              {status==="sending"?"Sending...":"Send Message"}
            </button>
            {status==="error"&&<p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
