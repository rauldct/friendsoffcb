import type { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

export const metadata: Metadata = {
  title: "BarçaAI - Your FC Barcelona AI Assistant | Friends of Barça",
  description: "Join the waitlist for BarçaAI, the intelligent assistant for FC Barcelona fans. Get AI-powered news, fan club search, live match info and personalized travel guides.",
  openGraph: {
    title: "BarçaAI - FC Barcelona AI Assistant",
    description: "Join the waitlist for BarçaAI. AI-powered news, fan club search, live match info and travel guides for culés worldwide.",
    url: "https://friendsofbarca.com/chat",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/chat",
    languages: {
      en: "https://friendsofbarca.com/chat",
      es: "https://friendsofbarca.com/chat",
      "x-default": "https://friendsofbarca.com/chat",
    },
  },
};

export default function ChatPage() {
  return <ChatPageClient />;
}
