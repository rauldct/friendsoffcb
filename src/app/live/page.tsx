import type { Metadata } from "next";
import LiveMatchClient from "./LiveMatchClient";

export const metadata: Metadata = {
  title: "Live Match - FC Barcelona",
  description: "Follow FC Barcelona's match live with real-time score updates, events, and commentary.",
  alternates: {
    canonical: "https://friendsofbarca.com/live",
    languages: {
      en: "https://friendsofbarca.com/live",
      es: "https://friendsofbarca.com/live",
      "x-default": "https://friendsofbarca.com/live",
    },
  },
  openGraph: {
    title: "Live Match - FC Barcelona",
    description: "Real-time FC Barcelona match updates, events and commentary.",
    url: "https://friendsofbarca.com/live",
  },
  robots: { index: false, follow: true },
};

export default function LivePage() {
  return <LiveMatchClient />;
}
