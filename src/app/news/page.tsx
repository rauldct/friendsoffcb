import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import NewsExplorer from "@/components/NewsExplorer";

export const metadata: Metadata = {
  title: "Latest News",
  description:
    "The latest FC Barcelona news, match chronicles, and weekly digests powered by AI. Stay updated with everything happening at the club.",
  openGraph: {
    title: "FC Barcelona Latest News | Friends of Barça",
    description: "AI-powered news digests and match chronicles for FC Barcelona fans.",
    type: "website",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/news",
  },
};

export const revalidate = 300;

export default async function NewsPage() {
  const heroArticles = await prisma.newsArticle.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-[#A50044]/10 text-[#A50044] uppercase tracking-wide mb-3">
            News &amp; Match Reports
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">
            Latest Barcelona News
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Match chronicles, analysis and all the latest from FC Barcelona.
            Stay up to date with everything happening at the club.
          </p>
        </div>

        {/* Hero Section - Server rendered for SEO */}
        {heroArticles.length > 0 && (
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Hero Article */}
              {heroArticles[0] && (
                <Link
                  href={`/news/${heroArticles[0].slug}`}
                  className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-shadow md:row-span-2 flex flex-col justify-end min-h-[320px]"
                >
                  {heroArticles[0].coverImage ? (
                    <img
                      src={heroArticles[0].coverImage}
                      alt={heroArticles[0].title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                  <div className={`absolute inset-0 ${heroArticles[0].coverImage ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-br from-[#1A1A2E] to-[#004D98]'}`} />
                  <div className="relative p-8">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 w-fit ${
                        heroArticles[0].category === "chronicle"
                          ? "bg-[#EDBB00] text-[#1A1A2E]"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {heroArticles[0].category === "chronicle" ? "Match Report" : "News Digest"}
                    </span>
                    <h2 className="text-2xl font-heading font-bold mb-3 text-white group-hover:text-[#EDBB00] transition-colors">
                      {heroArticles[0].title}
                    </h2>
                    <p className="text-gray-300 text-sm mb-3">{heroArticles[0].excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <time>
                        {new Date(heroArticles[0].publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      {heroArticles[0].matchResult && (
                        <>
                          <span>&middot;</span>
                          <span className="font-medium text-[#EDBB00]">{heroArticles[0].matchResult}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Side Articles */}
              {heroArticles.slice(1, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                >
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${
                      article.category === "chronicle"
                        ? "bg-[#EDBB00]/10 text-[#A50044]"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {article.category === "chronicle" ? "Match Report" : "News Digest"}
                  </span>
                  <h3 className="font-heading font-bold text-[#1A1A2E] mb-2 group-hover:text-[#A50044] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                  <time className="text-xs text-gray-400 mt-3 block">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* News Explorer - Client component with search + pagination */}
        <NewsExplorer />
      </div>
    </div>
  );
}
