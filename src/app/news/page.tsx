import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";

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
  const articles = await prisma.newsArticle.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  const chronicles = articles.filter((a) => a.category === "chronicle");
  const digests = articles.filter((a) => a.category === "digest");
  const latest = articles.slice(0, 6);

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

        {articles.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl max-w-2xl mx-auto">
            <div className="text-5xl mb-4">&#128240;</div>
            <h2 className="text-xl font-heading font-bold text-[#1A1A2E] mb-2">No News Yet</h2>
            <p className="text-gray-500">
              News content will be generated automatically. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Featured / Latest */}
            {latest.length > 0 && (
              <div className="mb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Hero Article */}
                  {latest[0] && (
                    <Link
                      href={`/news/${latest[0].slug}`}
                      className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-shadow md:row-span-2 flex flex-col justify-end min-h-[320px]"
                    >
                      {latest[0].coverImage ? (
                        <img
                          src={latest[0].coverImage}
                          alt={latest[0].title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : null}
                      <div className={`absolute inset-0 ${latest[0].coverImage ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-br from-[#1A1A2E] to-[#004D98]'}`} />
                      <div className="relative p-8">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 w-fit ${
                            latest[0].category === "chronicle"
                              ? "bg-[#EDBB00] text-[#1A1A2E]"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          {latest[0].category === "chronicle" ? "Match Report" : "News Digest"}
                        </span>
                        <h2 className="text-2xl font-heading font-bold mb-3 text-white group-hover:text-[#EDBB00] transition-colors">
                          {latest[0].title}
                        </h2>
                        <p className="text-gray-300 text-sm mb-3">{latest[0].excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <time>
                            {new Date(latest[0].publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                          {latest[0].matchResult && (
                            <>
                              <span>&middot;</span>
                              <span className="font-medium text-[#EDBB00]">{latest[0].matchResult}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Side Articles */}
                  {latest.slice(1, 3).map((article) => (
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

            {/* Match Chronicles */}
            {chronicles.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
                  <span>&#9917;</span> Match Chronicles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chronicles.slice(0, 9).map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {article.coverImage && (
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-[#EDBB00]/10 text-[#A50044]">
                            Match Report
                          </span>
                          {article.matchResult && (
                            <span className="text-sm font-bold text-[#1A1A2E]">{article.matchResult}</span>
                          )}
                        </div>
                        <h3 className="font-heading font-bold text-[#1A1A2E] mb-2 group-hover:text-[#A50044] transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
                        <time className="text-xs text-gray-400">
                          {new Date(article.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* News Digests */}
            {digests.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
                  <span>&#128240;</span> News Digests
                </h2>
                <div className="space-y-4">
                  {digests.slice(0, 12).map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-[#004D98] to-[#A50044] rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                        &#128240;
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-bold text-[#1A1A2E] group-hover:text-[#A50044] transition-colors truncate">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{article.excerpt}</p>
                      </div>
                      <time className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
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
          </>
        )}
      </div>
    </div>
  );
}
