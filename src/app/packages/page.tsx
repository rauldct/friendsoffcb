import { Metadata } from "next";
import PackageCard from "@/components/PackageCard";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Match Packages",
  description: "Browse all FC Barcelona match packages. Tickets, hotels & tours for every home game at Spotify Camp Nou. Complete matchday experiences curated by local fans.",
  openGraph: {
    title: "FC Barcelona Match Packages | Tickets, Hotels & Tours",
    description: "Complete matchday packages for every FC Barcelona home game. Tickets, hotels & tours curated by locals.",
    images: ["/images/packages/camp-nou-match.jpg"],
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
    tickets: p.tickets as any[],
    hotels: p.hotels as any[],
    activities: p.activities as any[],
  }));

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4">Match Packages</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Complete matchday experiences including tickets, hotels, and tours. Everything you need to enjoy FC Barcelona at the Spotify Camp Nou.
          </p>
        </div>
        {serialized.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">⚽</span>
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-2">New Packages Coming Soon</h2>
            <p className="text-gray-500">We&apos;re preparing exciting new matchday packages. Check back soon!</p>
          </div>
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
