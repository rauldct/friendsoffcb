import { Metadata } from "next";
import TermsContent from "@/components/TermsContent";

export const metadata: Metadata = {
  title: "Terms of Use | Friends of Barça",
  description: "Terms of Use for friendsofbarca.com operated by DCT BUSINESS CORP Inc.",
  alternates: {
    canonical: "https://friendsofbarca.com/terms",
    languages: { "en": "https://friendsofbarca.com/terms", "es": "https://friendsofbarca.com/es/terms", "x-default": "https://friendsofbarca.com/terms" },
  },
};

export default function TermsOfUsePage() {
  return <TermsContent />;
}
