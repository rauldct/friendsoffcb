import { Metadata } from "next";
import prisma from "@/lib/prisma";
import MatchCalendarClient from "./MatchCalendarClient";

export const metadata: Metadata = {
  title: "Match Calendar 2025-26",
  description: "FC Barcelona match calendar 2025-26. See all upcoming La Liga, Champions League, and Copa del Rey matches with dates and matchday packages.",
  openGraph: {
    title: "FC Barcelona Match Calendar 2025-26",
    description: "All upcoming FC Barcelona matches. La Liga, Champions League & Copa del Rey schedule.",
    images: ["/images/packages/camp-nou-night.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FC Barcelona Match Calendar 2025-26",
    description: "Complete schedule of Barcelona matches this season.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/calendar",
  },
};

export const revalidate = 300;

export default async function CalendarPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
  });

  const serialized = matches.map(m => ({
    ...m,
    date: m.date.toISOString(),
  }));

  return <MatchCalendarClient matches={serialized} />;
}
