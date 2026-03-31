import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PackageHero from "@/components/PackageHero";
import PackageDetailContent from "@/components/PackageDetailContent";
import StickyCtaBar from "@/components/StickyCtaBar";
import { TicketOption as TTicket, HotelOption as THotel, ActivityOption as TActivity } from "@/types";
import { getAffiliateIds, injectAffiliateUrls } from "@/lib/affiliates";
import { eventJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = await prisma.matchPackage.findUnique({ where: { slug: params.slug } });
  if (!pkg) return { title: "Package Not Found" };
  const url = `https://friendsofbarca.com/packages/${params.slug}`;
  const title = pkg.metaTitle;
  const description = pkg.metaDescription;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      alternateLocale: "es_ES",
      images: [pkg.heroImage
        ? { url: pkg.heroImage, alt: pkg.matchTitle }
        : { url: `/api/og?title=${encodeURIComponent(pkg.matchTitle)}&type=package&subtitle=${encodeURIComponent(pkg.competition)}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [pkg.heroImage || `/api/og?title=${encodeURIComponent(pkg.matchTitle)}&type=package`],
    },
    alternates: {
      canonical: url,
      languages: { "en": url, "es": url.replace("friendsofbarca.com/", "friendsofbarca.com/es/"), "x-default": url },
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
  const stubhubEventUrl = (pkg as Record<string, unknown>).stubhubEventUrl as string | null | undefined;
  const { tickets, hotels, activities } = injectAffiliateUrls(
    rawTickets, rawHotels, rawActivities, pkg.matchDate, affiliateIds, stubhubEventUrl
  );

  const lowestPrice = tickets.length ? Math.min(...tickets.map(t => t.priceFrom)) : 0;

  const jsonLd = eventJsonLd({
    matchTitle: pkg.matchTitle,
    matchTitleEs: pkg.matchTitleEs,
    slug: pkg.slug,
    matchDate: pkg.matchDate.toISOString(),
    matchTime: pkg.matchTime,
    competition: pkg.competition,
    description: pkg.description,
    heroImage: pkg.heroImage,
    lowestPrice,
  });

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://friendsofbarca.com" },
    { name: "Packages", url: "https://friendsofbarca.com/packages" },
    { name: pkg.matchTitle, url: `https://friendsofbarca.com/packages/${pkg.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PackageHero
        matchTitle={pkg.matchTitle}
        matchTitleEs={pkg.matchTitleEs}
        competition={pkg.competition}
        matchDate={pkg.matchDate.toISOString()}
        matchTime={pkg.matchTime}
        heroImage={pkg.heroImage || undefined}
      />

      <PackageDetailContent
        slug={pkg.slug}
        description={pkg.description}
        descriptionEs={pkg.descriptionEs}
        tickets={tickets}
        hotels={hotels}
        activities={activities}
        tips={pkg.tips}
        tipsEs={pkg.tipsEs}
        meetupInfo={pkg.meetupInfo || undefined}
        meetupInfoEs={pkg.meetupInfoEs}
      />

      <StickyCtaBar matchTitle={pkg.matchTitle} priceFrom={lowestPrice} ctaUrl={tickets[0]?.affiliateUrl || "#"} />
    </>
  );
}
