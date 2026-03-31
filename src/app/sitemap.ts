import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://friendsofbarca.com";

  const [packages, posts, photos, newsArticles, latestNews] = await Promise.all([
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
      select: { slug: true, category: true, updatedAt: true },
    }),
    // Latest news date for index pages that aggregate content
    prisma.newsArticle.findFirst({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const lastPhotoDate = photos[0]?.createdAt || new Date();
  const lastNewsDate = latestNews?.updatedAt || new Date();
  const lastBlogDate = posts.length > 0
    ? posts.reduce((latest, p) => p.updatedAt > latest ? p.updatedAt : latest, posts[0].updatedAt)
    : new Date();

  // Helper: create bilingual entry with hreflang alternates
  function bilingualEntry(
    path: string,
    opts: { lastModified?: Date; changeFrequency?: "daily" | "weekly" | "monthly" | "yearly"; priority?: number }
  ) {
    const enUrl = `${baseUrl}${path}`;
    const esUrl = `${baseUrl}/es${path}`;
    return {
      url: enUrl,
      lastModified: opts.lastModified,
      changeFrequency: opts.changeFrequency,
      priority: opts.priority,
      alternates: {
        languages: {
          en: enUrl,
          es: esUrl,
        },
      },
    };
  }

  const staticPages = [
    bilingualEntry("/", { lastModified: lastNewsDate, changeFrequency: "daily", priority: 1 }),
    bilingualEntry("/competitions", { lastModified: new Date(), changeFrequency: "daily", priority: 0.9 }),
    bilingualEntry("/news", { lastModified: lastNewsDate, changeFrequency: "daily", priority: 0.9 }),
    bilingualEntry("/packages", { lastModified: new Date(), changeFrequency: "daily", priority: 0.9 }),
    bilingualEntry("/calendar", { lastModified: new Date(), changeFrequency: "daily", priority: 0.8 }),
    bilingualEntry("/gallery", { lastModified: lastPhotoDate, changeFrequency: "daily", priority: 0.8 }),
    bilingualEntry("/blog", { lastModified: lastBlogDate, changeFrequency: "weekly", priority: 0.8 }),
    bilingualEntry("/guides", { lastModified: lastBlogDate, changeFrequency: "weekly", priority: 0.8 }),
    bilingualEntry("/about", { changeFrequency: "monthly", priority: 0.5 }),
    bilingualEntry("/contact", { changeFrequency: "monthly", priority: 0.5 }),
    bilingualEntry("/gallery/upload", { changeFrequency: "monthly", priority: 0.4 }),
    bilingualEntry("/faq", { changeFrequency: "monthly", priority: 0.6 }),
    bilingualEntry("/history", { changeFrequency: "monthly", priority: 0.7 }),
    bilingualEntry("/chat", { changeFrequency: "monthly", priority: 0.5 }),
    bilingualEntry("/privacy", { changeFrequency: "yearly", priority: 0.3 }),
    bilingualEntry("/terms", { changeFrequency: "yearly", priority: 0.3 }),
    bilingualEntry("/cookies", { changeFrequency: "yearly", priority: 0.3 }),
  ];

  const packagePages = packages.map((p) =>
    bilingualEntry(`/packages/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.9 })
  );

  const blogPages = posts
    .filter((p) => p.category !== "guide")
    .map((p) => bilingualEntry(`/blog/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.7 }));

  const guidePages = posts
    .filter((p) => p.category === "guide")
    .map((p) => bilingualEntry(`/guides/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.8 }));

  const newsPages = newsArticles.map((n) =>
    bilingualEntry(`/news/${n.slug}`, {
      lastModified: n.updatedAt,
      changeFrequency: "monthly",
      priority: n.category === "chronicle" ? 0.8 : 0.6,
    })
  );

  return [...staticPages, ...packagePages, ...blogPages, ...guidePages, ...newsPages];
}
