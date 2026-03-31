import { Metadata } from "next";
import HistoryContent from "@/components/HistoryContent";

export const metadata: Metadata = {
  title: "History of FC Barcelona — 125+ Years of Legends",
  description: "Explore the rich history of FC Barcelona from its founding in 1899 by Joan Gamper to the Messi era, the Dream Team, Camp Nou, La Masia, and the future of the club.",
  openGraph: {
    title: "The History of FC Barcelona",
    description: "More than 125 years of passion, triumphs, and legends. From Joan Gamper to Messi and beyond.",
    images: ["/images/history/camp-nou-aerial.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The History of FC Barcelona",
    description: "More than 125 years of passion, triumphs, and legends.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/history",
    languages: {
      en: "https://friendsofbarca.com/history",
      es: "https://friendsofbarca.com/history",
      "x-default": "https://friendsofbarca.com/history",
    },
  },
};

export default function HistoryPage() {
  return <HistoryContent />;
}
