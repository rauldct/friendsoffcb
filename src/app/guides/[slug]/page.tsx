import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { renderInline } from "@/lib/renderInline";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "Guide Not Found" };
  const url = `https://friendsofbarca.com/guides/${params.slug}`;
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      locale: "en_US",
      alternateLocale: "es_ES",
      images: [post.coverImage
        ? { url: post.coverImage }
        : { url: `/api/og?title=${encodeURIComponent(post.title)}&type=guide`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.coverImage || `/api/og?title=${encodeURIComponent(post.title)}&type=guide`],
    },
    alternates: {
      canonical: url,
      languages: { "en": url, "es": url.replace("friendsofbarca.com/", "friendsofbarca.com/es/"), "x-default": url },
    },
  };
}

export const revalidate = 300;

export default async function GuidePage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.category !== "guide") notFound();

  const headings = post.content.split("\n\n")
    .filter(p => p.startsWith("## "))
    .map(p => ({ text: p.replace("## ", ""), id: p.replace("## ", "").toLowerCase().replace(/\s+/g, "-") }));

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
    { name: "Guides", url: "https://friendsofbarca.com/guides" },
    { name: post.title, url: `https://friendsofbarca.com/guides/${post.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <article className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Breadcrumbs items={[
              { label: "Home", href: "/" },
              { label: "Guides", href: "/guides" },
              { label: post.title },
            ]} />
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">{post.title}</h1>
            <p className="text-gray-500">{post.excerpt}</p>
          </div>

          {headings.length > 0 && (
            <nav className="bg-[#F5F5F5] rounded-xl p-6 mb-10">
              <h3 className="font-heading font-bold text-sm uppercase text-gray-500 mb-3">Table of Contents</h3>
              <ul className="space-y-2">
                {headings.map(h => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-[#004D98] hover:underline text-sm">{h.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
            {post.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("## ")) {
                const text = paragraph.replace("## ", "");
                const id = text.toLowerCase().replace(/\s+/g, "-");
                return <h2 key={i} id={id} className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8 mb-4">{renderInline(text)}</h2>;
              }
              if (paragraph.startsWith("### ")) return <h3 key={i} className="text-xl font-heading font-bold text-[#1A1A2E] mt-6 mb-3">{renderInline(paragraph.replace("### ", ""))}</h3>;
              return <p key={i}>{renderInline(paragraph)}</p>;
            })}
          </div>
        </div>
      </article>
    </>
  );
}
