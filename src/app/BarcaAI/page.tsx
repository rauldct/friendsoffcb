import type { Metadata } from "next";
import BarcaAIClient from "./BarcaAIClient";

export const metadata: Metadata = {
  title: "BarçaAI - FC Barcelona AI Assistant",
  robots: { index: false, follow: false },
};

export default function BarcaAIPage() {
  return <BarcaAIClient />;
}
