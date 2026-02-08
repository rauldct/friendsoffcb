import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#004D98] to-[#A50044]" />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-20">
        <span className="inline-block bg-[#EDBB00] text-[#1A1A2E] text-sm font-bold px-4 py-1 rounded-full mb-6">
          #1 Fan Experience Platform
        </span>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-6 leading-tight">
          Experience FC Barcelona{" "}
          <span className="text-[#EDBB00]">Like a Local</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Match tickets, hotels, tours & insider tips — your complete Barça matchday package curated by local fans.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/packages" className="btn-gold text-lg py-4 px-8">Explore Packages</Link>
          <Link href="/guides" className="btn-secondary text-lg py-4 px-8">Read Our Guides</Link>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[{n:"10K+",l:"Happy Fans"},{n:"50+",l:"Packages"},{n:"4.9★",l:"Rating"}].map(s=>(
            <div key={s.l} className="text-center">
              <div className="text-3xl font-heading font-bold text-[#EDBB00]">{s.n}</div>
              <div className="text-sm text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
