import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.tags,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: post.coverImage ? [post.coverImage] : [],
    },
    alternates: {
      canonical: `https://friendsofbarca.com/blog/${params.slug}`,
    },
  };
}

export const revalidate = 300;

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.status !== "published") notFound();

  return (
    <article className="section-padding">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/blog" className="text-[#004D98] text-sm hover:underline mb-4 inline-block">← Back to Blog</Link>
          <span className="inline-block text-xs font-medium px-3 py-1 rounded bg-blue-100 text-blue-800 mb-4 ml-4">{post.category}</span>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>By {post.author}</span>
            <span>·</span>
            <time>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
          </div>
        </div>

        {post.coverImage && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
          {post.content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## ")) return <h2 key={i} className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8 mb-4">{paragraph.replace("## ", "")}</h2>;
            if (paragraph.startsWith("### ")) return <h3 key={i} className="text-xl font-heading font-bold text-[#1A1A2E] mt-6 mb-3">{paragraph.replace("### ", "")}</h3>;
            return <p key={i}>{paragraph}</p>;
          })}
        </div>

        {post.relatedPackageSlug && (
          <div className="mt-12 p-6 bg-gradient-to-r from-[#A50044] to-[#004D98] rounded-2xl text-white text-center">
            <h3 className="font-heading font-bold text-xl mb-2">Going to this match?</h3>
            <p className="text-gray-200 mb-4">Check out our complete matchday package with tickets, hotels, and tours.</p>
            <Link href={`/packages/${post.relatedPackageSlug}`} className="btn-gold">View Package</Link>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
