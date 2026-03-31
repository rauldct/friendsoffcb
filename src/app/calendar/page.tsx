import { Metadata } from "next";
import prisma from "@/lib/prisma";
import MatchCalendarClient from "./MatchCalendarClient";
import { eventsListJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Match Calendar 2025-26",
  description: "FC Barcelona match calendar 2025-26. See all upcoming La Liga, Champions League, and Copa del Rey matches with dates and matchday packages.",
  openGraph: {
    title: "FC Barcelona Match Calendar 2025-26",
    description: "All upcoming FC Barcelona matches. La Liga, Champions League & Copa del Rey schedule.",
    locale: "en_US",
    alternateLocale: "es_ES",
    images: ["/images/packages/camp-nou-night.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FC Barcelona Match Calendar 2025-26",
    description: "Complete schedule of Barcelona matches this season.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/calendar",
    languages: { "en": "https://friendsofbarca.com/calendar", "es": "https://friendsofbarca.com/es/calendar", "x-default": "https://friendsofbarca.com/calendar" },
  },
};

export const revalidate = 300;

export default async function CalendarPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    where: { date: { gte: new Date() } },
  });

  const serialized = matches.map(m => ({
    ...m,
    date: m.date.toISOString(),
  }));

  const jsonLd = eventsListJsonLd(
    matches.map(m => ({
      opponent: m.opponent,
      date: m.date.toISOString(),
      time: m.time,
      competition: m.competition,
      venue: m.venue,
    }))
  );

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://friendsofbarca.com" },
    { name: "Match Calendar", url: "https://friendsofbarca.com/calendar" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <MatchCalendarClient matches={serialized} />
    </>
  );
}
