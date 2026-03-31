import { Metadata } from "next";
import PostCard from "@/components/PostCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import prisma from "@/lib/prisma";
import { collectionPageJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Blog",
  description: "FC Barcelona fan blog with match analysis, transfer rumours, travel guides, and insider tips. Written by fans, for fans.",
  openGraph: {
    title: "FC Barcelona Blog | Friends of Barça",
    description: "Match analysis, transfer updates, and travel guides for international FC Barcelona fans.",
    locale: "en_US",
    alternateLocale: "es_ES",
    images: ["/images/packages/camp-nou-match2.jpg"],
  },
  alternates: {
    canonical: "https://friendsofbarca.com/blog",
    languages: { "en": "https://friendsofbarca.com/blog", "es": "https://friendsofbarca.com/es/blog", "x-default": "https://friendsofbarca.com/blog" },
  },
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published", category: { not: "guide" } },
    orderBy: { publishedAt: "desc" },
  });

  const serialized = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const jsonLd = collectionPageJsonLd({
    name: "FC Barcelona Blog",
    description: "Match analysis, transfer updates, and articles for FC Barcelona fans.",
    url: "https://friendsofbarca.com/blog",
    items: posts.map(p => ({ name: p.title, url: `https://friendsofbarca.com/blog/${p.slug}` })),
  });

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="section-padding">
      <div className="container-custom">
        <PageHeader titleKey="blog.title" descKey="blog.desc" />
        {serialized.length === 0 ? (
          <EmptyState icon="📰" titleKey="blog.empty" descKey="blog.emptyDesc" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
