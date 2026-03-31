import { Metadata } from "next";
import PrivacyContent from "@/components/PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | Friends of Barça",
  description: "Privacy Policy for friendsofbarca.com operated by DCT BUSINESS CORP Inc.",
  alternates: {
    canonical: "https://friendsofbarca.com/privacy",
    languages: { "en": "https://friendsofbarca.com/privacy", "es": "https://friendsofbarca.com/es/privacy", "x-default": "https://friendsofbarca.com/privacy" },
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyContent />;
}
