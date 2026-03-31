import { MetadataRoute } from "next";

const publicPaths = [
  "/",
  "/packages/",
  "/news/",
  "/blog/",
  "/guides/",
  "/competitions/",
  "/calendar/",
  "/gallery/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/cookies/",
  "/faq/",
];

const blockedPaths = ["/api/", "/admin/", "/unsubscribe/", "/_next/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all public pages
      {
        userAgent: "*",
        allow: "/",
        disallow: blockedPaths,
      },
      // Google
      {
        userAgent: "Googlebot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Bing
      {
        userAgent: "Bingbot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // OpenAI crawlers
      {
        userAgent: "GPTBot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      {
        userAgent: "ChatGPT-User",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Anthropic / Claude
      {
        userAgent: "Claude-Web",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Perplexity
      {
        userAgent: "PerplexityBot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Google AI (Gemini)
      {
        userAgent: "Google-Extended",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Apple (Siri, Spotlight)
      {
        userAgent: "Applebot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Meta
      {
        userAgent: "FacebookBot",
        allow: publicPaths,
        disallow: blockedPaths,
      },
      // Common AI crawlers
      {
        userAgent: "cohere-ai",
        allow: publicPaths,
        disallow: blockedPaths,
      },
    ],
    sitemap: "https://friendsofbarca.com/sitemap.xml",
  };
}
