import Link from "next/link";
import Image from "next/image";

interface NewsArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  matchResult: string | null;
  publishedAt: string;
}

const categoryStyles: Record<string, { bg: string; label: string }> = {
  chronicle: { bg: "bg-[#EDBB00]/10 text-[#A50044]", label: "Match Report" },
  digest: { bg: "bg-blue-50 text-blue-700", label: "News Digest" },
};

export default function LatestNews({ articles }: { articles: NewsArticleSummary[] }) {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">Latest News</h2>
          <p className="text-gray-500">Stay up to date with everything FC Barcelona.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(0, 6).map(article => {
            const style = categoryStyles[article.category] || categoryStyles.digest;
            return (
              <Link key={article.id} href={`/news/${article.slug}`} className="card group block">
                <div className="relative h-44 bg-gradient-to-br from-[#1A1A2E] to-[#004D98] overflow-hidden">
                  {article.coverImage ? (
                    <Image src={article.coverImage} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl opacity-20">{article.category === "chronicle" ? "&#9917;" : "&#128240;"}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${style.bg}`}>
                      {style.label}
                    </span>
                    {article.matchResult && (
                      <span className="text-xs font-bold text-[#A50044]">{article.matchResult}</span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-[#1A1A2E] group-hover:text-[#A50044] transition-colors mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{article.author}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/news" className="btn-secondary">Read More News</Link>
        </div>
      </div>
    </section>
  );
}
