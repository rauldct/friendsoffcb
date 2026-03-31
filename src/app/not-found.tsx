import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Browse our FC Barcelona match packages, news, and travel guides.",
};

const suggestions = [
  { href: "/packages", label: "Match Packages", desc: "Find tickets, hotels & activities for upcoming matches" },
  { href: "/news", label: "Latest News", desc: "Match chronicles and weekly digests" },
  { href: "/competitions", label: "Competitions", desc: "Standings and AI predictions" },
  { href: "/guides", label: "Travel Guides", desc: "Everything you need for visiting Camp Nou" },
  { href: "/calendar", label: "Match Calendar", desc: "Upcoming FC Barcelona fixtures" },
  { href: "/gallery", label: "Fan Gallery", desc: "Photos from matchday experiences" },
];

export default function NotFound() {
  return (
    <div className="section-padding">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl font-heading font-extrabold text-[#A50044] mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A1A2E] mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Try one of these instead:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10">
          {suggestions.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="block p-4 rounded-xl border border-gray-200 hover:border-[#004D98] hover:shadow-md transition-all group"
            >
              <h3 className="font-heading font-bold text-[#1A1A2E] group-hover:text-[#004D98] transition-colors">
                {s.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="inline-block bg-[#EDBB00] text-[#1A1A2E] font-semibold px-8 py-3 rounded-lg hover:bg-[#d4a800] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
