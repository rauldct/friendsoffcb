import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://friendsofbarca.com";

  const [packages, posts, photos, newsArticles] = await Promise.all([
    prisma.matchPackage.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, category: true, updatedAt: true },
    }),
    prisma.photo.findMany({
      where: { status: "approved" },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    prisma.newsArticle.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const lastPhotoDate = photos[0]?.createdAt || new Date();

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/competitions`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/packages`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/calendar`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/gallery`, lastModified: lastPhotoDate, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/gallery/upload`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/guides`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  const packagePages = packages.map((p) => ({
    url: `${baseUrl}/packages/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const blogPages = posts
    .filter((p) => p.category !== "guide")
    .map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const guidePages = posts
    .filter((p) => p.category === "guide")
    .map((p) => ({
      url: `${baseUrl}/guides/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  const newsPages = newsArticles.map((n) => ({
    url: `${baseUrl}/news/${n.slug}`,
    lastModified: n.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...packagePages, ...blogPages, ...guidePages, ...newsPages];
}
