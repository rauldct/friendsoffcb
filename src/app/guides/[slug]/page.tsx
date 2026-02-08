import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "Guide Not Found" };
  return { title: post.metaTitle, description: post.metaDescription };
}

export const revalidate = 300;

export default async function GuidePage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || post.category !== "guide") notFound();

  const headings = post.content.split("\n\n")
    .filter(p => p.startsWith("## "))
    .map(p => ({ text: p.replace("## ", ""), id: p.replace("## ", "").toLowerCase().replace(/\s+/g, "-") }));

  return (
    <article className="section-padding">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/guides" className="text-[#004D98] text-sm hover:underline mb-4 inline-block">← Back to Guides</Link>
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
              return <h2 key={i} id={id} className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8 mb-4">{text}</h2>;
            }
            if (paragraph.startsWith("### ")) return <h3 key={i} className="text-xl font-heading font-bold text-[#1A1A2E] mt-6 mb-3">{paragraph.replace("### ", "")}</h3>;
            return <p key={i}>{paragraph}</p>;
          })}
        </div>
      </div>
    </article>
  );
}
