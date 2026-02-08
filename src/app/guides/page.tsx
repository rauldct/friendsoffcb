import { Metadata } from "next";
import PostCard from "@/components/PostCard";
import prisma from "@/lib/prisma";

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

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4">Travel Guides</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Everything you need to know before visiting the Spotify Camp Nou. Written by locals, for fans.</p>
        </div>
        {serialized.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">📚</span>
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-2">Guides Coming Soon</h2>
            <p className="text-gray-500">We&apos;re writing comprehensive guides for your Camp Nou visit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map(guide => <PostCard key={guide.id} post={guide} />)}
          </div>
        )}
      </div>
    </div>
  );
}
