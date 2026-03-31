import { Metadata } from "next";
import CookiesContent from "@/components/CookiesContent";

export const metadata: Metadata = {
  title: "Cookie Policy | Friends of Barça",
  description: "Cookie Policy for friendsofbarca.com operated by DCT BUSINESS CORP Inc.",
  alternates: {
    canonical: "https://friendsofbarca.com/cookies",
    languages: { "en": "https://friendsofbarca.com/cookies", "es": "https://friendsofbarca.com/es/cookies", "x-default": "https://friendsofbarca.com/cookies" },
  },
};

export default function CookiePolicyPage() {
  return <CookiesContent />;
}
