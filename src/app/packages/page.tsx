import { Metadata } from "next";
import PackageCard from "@/components/PackageCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Match Packages",
  description: "Browse all FC Barcelona match packages. Tickets, hotels & tours for every home game at Spotify Camp Nou. Complete matchday experiences curated by local fans.",
  openGraph: {
    title: "FC Barcelona Match Packages | Tickets, Hotels & Tours",
    description: "Complete matchday packages for every FC Barcelona home game. Tickets, hotels & tours curated by locals.",
    locale: "en_US",
    alternateLocale: "es_ES",
    images: ["/images/packages/camp-nou-match.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FC Barcelona Match Packages",
    description: "Complete matchday packages: tickets, hotels & tours for Camp Nou.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/packages",
    languages: { "en": "https://friendsofbarca.com/packages", "es": "https://friendsofbarca.com/es/packages", "x-default": "https://friendsofbarca.com/packages" },
  },
};

export const revalidate = 300;

export default async function PackagesPage() {
  const packages = await prisma.matchPackage.findMany({
    where: { status: "upcoming" },
    orderBy: { matchDate: "asc" },
  });

  const serialized = packages.map(p => ({
    ...p,
    matchDate: p.matchDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lastSyncedAt: p.lastSyncedAt?.toISOString() || null,
    tickets: p.tickets as any[],
    hotels: p.hotels as any[],
    activities: p.activities as any[],
  }));

  return (
    <div className="section-padding">
      <div className="container-custom">
        <PageHeader titleKey="packages.title" descKey="packages.desc" />
        {serialized.length === 0 ? (
          <EmptyState icon="⚽" titleKey="packages.empty" descKey="packages.emptyDesc" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
