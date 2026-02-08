import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Friends of Barça. Questions about visiting Camp Nou, matchday packages, or collaborations? We're here to help.",
  openGraph: {
    title: "Contact Friends of Barça",
    description: "Get in touch with us. Questions about Camp Nou, matchday packages, or collaborations?",
  },
  twitter: {
    card: "summary",
    title: "Contact Friends of Barça",
    description: "Questions about Camp Nou visits or matchday packages? We're here to help.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
