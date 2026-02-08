"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  matchTitle: string;
  competition: string;
  matchDate: string;
  matchTime: string;
  heroImage?: string;
}

export default function PackageHero({ matchTitle, competition, matchDate, matchTime, heroImage }: Props) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const update = () => {
      const diff = new Date(matchDate).getTime() - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0 }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [matchDate]);

  return (
    <section className="relative py-20 bg-gradient-to-br from-[#1A1A2E] via-[#004D98] to-[#A50044] overflow-hidden">
      {heroImage && (
        <>
          <Image src={heroImage} alt={matchTitle} fill className="object-cover opacity-30" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/60 to-transparent" />
        </>
      )}
      <div className="container-custom text-center text-white relative z-10">
        <span className="inline-block bg-[#EDBB00] text-[#1A1A2E] text-xs font-bold px-4 py-1 rounded-full mb-4">{competition}</span>
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold mb-4">{matchTitle}</h1>
        <p className="text-gray-300 mb-2">
          {new Date(matchDate).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})} · {matchTime}
        </p>
        <p className="text-gray-400 mb-8">Spotify Camp Nou, Barcelona</p>
        <div className="flex justify-center gap-6">
          {[{v:countdown.days,l:"Days"},{v:countdown.hours,l:"Hours"},{v:countdown.minutes,l:"Min"}].map(c=>(
            <div key={c.l} className="bg-white/10 backdrop-blur rounded-xl px-6 py-4 min-w-[80px]">
              <div className="text-3xl font-heading font-bold text-[#EDBB00]">{c.v}</div>
              <div className="text-xs text-gray-400 uppercase">{c.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
