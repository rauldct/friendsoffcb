import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PackageHero from "@/components/PackageHero";
import TicketOption from "@/components/TicketOption";
import HotelOption from "@/components/HotelOption";
import ActivityOption from "@/components/ActivityOption";
import LocalTips from "@/components/LocalTips";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import StickyCtaBar from "@/components/StickyCtaBar";
import { TicketOption as TTicket, HotelOption as THotel, ActivityOption as TActivity } from "@/types";
import { getAffiliateIds, injectAffiliateUrls } from "@/lib/affiliates";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = await prisma.matchPackage.findUnique({ where: { slug: params.slug } });
  if (!pkg) return { title: "Package Not Found" };
  return {
    title: pkg.metaTitle,
    description: pkg.metaDescription,
    openGraph: {
      title: pkg.metaTitle,
      description: pkg.metaDescription,
      type: "website",
      images: pkg.heroImage ? [{ url: pkg.heroImage, alt: pkg.matchTitle }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: pkg.metaTitle,
      description: pkg.metaDescription,
      images: pkg.heroImage ? [pkg.heroImage] : [],
    },
    alternates: {
      canonical: `https://friendsofbarca.com/packages/${params.slug}`,
    },
  };
}

export const revalidate = 300;

export default async function PackageDetailPage({ params }: Props) {
  const pkg = await prisma.matchPackage.findUnique({ where: { slug: params.slug } });
  if (!pkg) notFound();

  const rawTickets = pkg.tickets as unknown as TTicket[];
  const rawHotels = pkg.hotels as unknown as THotel[];
  const rawActivities = pkg.activities as unknown as TActivity[];

  // Inject affiliate URLs automatically
  const affiliateIds = await getAffiliateIds();
  const { tickets, hotels, activities } = injectAffiliateUrls(
    rawTickets, rawHotels, rawActivities, pkg.matchDate, affiliateIds
  );

  const lowestPrice = tickets.length ? Math.min(...tickets.map(t => t.priceFrom)) : 0;

  return (
    <>
      <PackageHero
        matchTitle={pkg.matchTitle}
        competition={pkg.competition}
        matchDate={pkg.matchDate.toISOString()}
        matchTime={pkg.matchTime}
        heroImage={pkg.heroImage || undefined}
      />

      <div className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">About This Match</h2>
                <p className="text-gray-600 leading-relaxed">{pkg.description}</p>
              </div>

              {tickets.length > 0 && (
                <div>
                  <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">🎫 Tickets</h2>
                  <div className="space-y-4">
                    {tickets.map((t, i) => <TicketOption key={i} {...t} />)}
                  </div>
                </div>
              )}

              {hotels.length > 0 && (
                <div>
                  <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">🏨 Hotels</h2>
                  <div className="space-y-4">
                    {hotels.map((h, i) => <HotelOption key={i} {...h} />)}
                  </div>
                </div>
              )}

              {activities.length > 0 && (
                <div>
                  <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">🎯 Activities & Tours</h2>
                  <div className="space-y-4">
                    {activities.map((a, i) => <ActivityOption key={i} {...a} />)}
                  </div>
                </div>
              )}

              {pkg.tips.length > 0 && (
                <LocalTips tips={pkg.tips} meetupInfo={pkg.meetupInfo || undefined} />
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <LeadCaptureForm matchSlug={pkg.slug} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <StickyCtaBar matchTitle={pkg.matchTitle} priceFrom={lowestPrice} ctaUrl={tickets[0]?.affiliateUrl || "#"} />
    </>
  );
}
