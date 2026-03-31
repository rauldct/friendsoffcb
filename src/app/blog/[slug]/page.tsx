import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BlogPostContent from "@/components/BlogPostContent";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.category === "guide") return { title: "Post Not Found" };
  const url = `https://friendsofbarca.com/blog/${params.slug}`;
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: [
      ...post.tags,
      ...(post.metaTitleEs ? [post.metaTitleEs] : []),
    ],
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
      locale: "en_US",
      alternateLocale: "es_ES",
      images: [post.coverImage
        ? { url: post.coverImage, alt: post.title }
        : { url: `/api/og?title=${encodeURIComponent(post.title)}&type=blog`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.coverImage || `/api/og?title=${encodeURIComponent(post.title)}&type=blog`],
    },
    alternates: {
      canonical: url,
      languages: { "en": url, "es": url.replace("friendsofbarca.com/", "friendsofbarca.com/es/"), "x-default": url },
    },
  };
}

export const revalidate = 300;

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.status !== "published" || post.category === "guide") notFound();

  const relatedPosts = await prisma.blogPost.findMany({
    where: { status: "published", category: { not: "guide" }, slug: { not: post.slug } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true, titleEs: true, coverImage: true, category: true, publishedAt: true },
  });

  const jsonLd = blogPostingJsonLd({
    title: post.title,
    titleEs: post.titleEs,
    excerpt: post.excerpt,
    slug: post.slug,
    author: post.author,
    publishedAt: post.publishedAt.toISOString(),
    coverImage: post.coverImage,
    tags: post.tags,
    category: post.category,
  });

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://friendsofbarca.com" },
    { name: "Blog", url: "https://friendsofbarca.com/blog" },
    { name: post.title, url: `https://friendsofbarca.com/blog/${post.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BlogPostContent
        title={post.title}
        titleEs={post.titleEs}
        category={post.category}
        author={post.author}
        publishedAt={post.publishedAt.toISOString()}
        coverImage={post.coverImage}
        content={post.content}
        contentEs={post.contentEs}
        tags={post.tags}
        relatedPackageSlug={post.relatedPackageSlug}
        relatedPosts={relatedPosts.map(rp => ({
          slug: rp.slug,
          title: rp.title,
          titleEs: rp.titleEs,
          coverImage: rp.coverImage,
          publishedAt: rp.publishedAt.toISOString(),
        }))}
      />
    </>
  );
}
