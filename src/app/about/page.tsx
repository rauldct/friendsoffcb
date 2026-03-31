import { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "About Us",
  description: "We're a group of local Barcelona fans helping international visitors experience the magic of FC Barcelona at Spotify Camp Nou. Learn about our mission.",
  openGraph: {
    title: "About Friends of Barça",
    description: "Local Barcelona fans helping international visitors experience FC Barcelona like locals.",
    images: ["/images/packages/camp-nou-exterior.jpg"],
  },
  twitter: {
    card: "summary",
    title: "About Friends of Barça",
    description: "Local Barcelona fans helping international visitors experience FC Barcelona like locals.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/about",
    languages: { "en": "https://friendsofbarca.com/about", "es": "https://friendsofbarca.com/es/about", "x-default": "https://friendsofbarca.com/about" },
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
