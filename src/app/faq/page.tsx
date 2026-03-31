import { Metadata } from "next";
import prisma from "@/lib/prisma";
import FaqContent from "@/components/FaqContent";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Answers to common questions about FC Barcelona tickets, Camp Nou stadium, travel to Barcelona, match packages, and more.",
  openGraph: {
    title: "FAQ | Friends of Barça",
    description: "Everything you need to know about attending an FC Barcelona match at Spotify Camp Nou.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/faq",
    languages: { "en": "https://friendsofbarca.com/faq", "es": "https://friendsofbarca.com/es/faq", "x-default": "https://friendsofbarca.com/faq" },
  },
};

export const revalidate = 300;

export default async function FaqPage() {
  const dbFaqs = await prisma.faq.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const faqs = dbFaqs.map((f) => ({
    q: f.question,
    qEs: f.questionEs || f.question,
    a: f.answer,
    aEs: f.answerEs || f.answer,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://friendsofbarca.com" },
    { name: "FAQ", url: "https://friendsofbarca.com/faq" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <FaqContent faqs={faqs} />
    </>
  );
}
