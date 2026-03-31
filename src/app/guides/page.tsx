import { Metadata } from "next";
import PostCard from "@/components/PostCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import prisma from "@/lib/prisma";
import { collectionPageJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Travel Guides",
  description: "Complete travel guides for FC Barcelona fans visiting Barcelona. Camp Nou guide, best bars near the stadium, how to get there, ticket prices, and insider tips from locals.",
  openGraph: {
    title: "Barcelona Travel Guides for Barça Fans",
    description: "Everything you need to know before visiting Camp Nou. Written by locals, for fans.",
    images: ["/images/blog/barcelona-rambla.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Barcelona Travel Guides for Barça Fans",
    description: "Camp Nou guides, best bars, transport tips & more. Written by locals.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/guides",
    languages: { "en": "https://friendsofbarca.com/guides", "es": "https://friendsofbarca.com/es/guides", "x-default": "https://friendsofbarca.com/guides" },
  },
};

export const revalidate = 300;

export default async function GuidesPage() {
  const guides = await prisma.blogPost.findMany({
    where: { status: "published", category: "guide" },
    orderBy: { publishedAt: "desc" },
  });

  const serialized = guides.map(p => ({
    ...p,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const jsonLd = collectionPageJsonLd({
    name: "Barcelona Travel Guides for Barça Fans",
    description: "Complete travel guides for FC Barcelona fans visiting Barcelona and Camp Nou.",
    url: "https://friendsofbarca.com/guides",
    items: guides.map(g => ({ name: g.title, url: `https://friendsofbarca.com/guides/${g.slug}` })),
  });

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="section-padding">
      <div className="container-custom">
        <PageHeader titleKey="guides.title" descKey="guides.desc" />
        {serialized.length === 0 ? (
          <EmptyState icon="📚" titleKey="guides.empty" descKey="guides.emptyDesc" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map(guide => <PostCard key={guide.id} post={guide} />)}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
