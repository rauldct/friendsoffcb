"use client";
import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"success"|"error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter_section" }),
      });
      if (res.ok) { setStatus("success"); setEmail(""); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-[#A50044] to-[#004D98]">
      <div className="container-custom text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">Never Miss a Match</h2>
        <p className="text-gray-200 mb-8 max-w-xl mx-auto">Get exclusive deals, matchday tips, and the latest Barça news straight to your inbox.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-lg text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#EDBB00]"/>
          <button type="submit" className="btn-gold py-3 px-8">Subscribe</button>
        </form>
        {status==="success"&&<p className="text-green-300 mt-3 text-sm">You&apos;re subscribed! Welcome to the family.</p>}
        {status==="error"&&<p className="text-red-300 mt-3 text-sm">Something went wrong. Please try again.</p>}
      </div>
    </section>
  );
}
