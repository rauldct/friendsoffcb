"use client";
import { useEffect, useState } from "react";

interface Props {
  matchTitle: string;
  priceFrom: number;
  ctaUrl: string;
}

export default function StickyCtaBar({ matchTitle, priceFrom, ctaUrl }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A2E]/95 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-white">
          <p className="font-heading font-bold text-sm sm:text-base">{matchTitle}</p>
          <p className="text-xs text-gray-400">From €{priceFrom}</p>
        </div>
        <a href={ctaUrl} className="btn-gold text-sm py-2 px-6">Book Now</a>
      </div>
    </div>
  );
}
