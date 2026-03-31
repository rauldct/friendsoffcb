"use client";

import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";
import { localized } from "@/lib/i18n";

const categoryColors: Record<string, string> = {
  news: "bg-blue-100 text-blue-800",
  analysis: "bg-purple-100 text-purple-800",
  transfers: "bg-orange-100 text-orange-800",
  guide: "bg-green-100 text-green-800",
  matchday: "bg-red-100 text-red-800",
};

export default function PostCard({ post }: { post: BlogPost }) {
  const { t, locale } = useLanguage();
  const title = localized(locale, post.title, post.titleEs);
  const excerpt = localized(locale, post.excerpt, post.excerptEs);
  const basePath = post.category === "guide" ? "/guides" : "/blog";
  return (
    <Link href={`${basePath}/${post.slug}`} className="card group block">
      <div className="relative h-44 bg-gradient-to-br from-[#1A1A2E] to-[#004D98] overflow-hidden">
        {post.coverImage ? (
          <Image src={post.coverImage} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-20">📰</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <span className={`inline-block text-xs font-medium px-2 py-1 rounded mb-3 ${categoryColors[post.category] || "bg-gray-100 text-gray-800"}`}>
          {post.category}
        </span>
        <h3 className="font-heading font-bold text-[#1A1A2E] group-hover:text-[#A50044] transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{excerpt}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{post.author}</span>
          <span>{new Date(post.publishedAt).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>
    </Link>
  );
}
