import { Metadata } from "next";
import PostCard from "@/components/PostCard";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Blog",
  description: "FC Barcelona fan blog with match analysis, transfer rumours, travel guides, and insider tips. Written by fans, for fans.",
  openGraph: {
    title: "FC Barcelona Blog | Friends of Barça",
    description: "Match analysis, transfer updates, and travel guides for international FC Barcelona fans.",
    images: ["/images/packages/camp-nou-match2.jpg"],
  },
  alternates: {
    canonical: "https://friendsofbarca.com/blog",
  },
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  });

  const serialized = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4">Blog</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Match analysis, travel guides, and insider tips for FC Barcelona fans around the world.</p>
        </div>
        {serialized.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">📰</span>
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-2">Coming Soon</h2>
            <p className="text-gray-500">Our first articles are on the way. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}
