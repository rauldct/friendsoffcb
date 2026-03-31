const BASE_URL = "https://friendsofbarca.com";

const publisher = {
  "@type": "Organization",
  name: "Friends of Barça",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/images/packages/camp-nou-aerial.jpg`,
  },
};

export function blogPostingJsonLd(post: {
  title: string;
  titleEs?: string | null;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  tags: string[];
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": post.category === "guide" ? "Article" : "BlogPosting",
    headline: post.title,
    alternativeHeadline: post.titleEs || undefined,
    description: post.excerpt,
    url: `${BASE_URL}/${post.category === "guide" ? "guides" : "blog"}/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher,
    inLanguage: ["en", ...(post.titleEs ? ["es"] : [])],
    ...(post.coverImage
      ? { image: { "@type": "ImageObject", url: `${BASE_URL}${post.coverImage}` } }
      : {}),
    keywords: post.tags.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/${post.category === "guide" ? "guides" : "blog"}/${post.slug}`,
    },
  };
}

export function newsArticleJsonLd(article: {
  title: string;
  titleEs?: string | null;
  excerpt: string | null;
  slug: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  category: string;
  matchResult?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": article.category === "chronicle" ? "NewsArticle" : "Article",
    headline: article.title,
    alternativeHeadline: article.titleEs || undefined,
    description: article.excerpt || article.title,
    url: `${BASE_URL}/news/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { "@type": "Organization", name: "Friends of Barça" },
    publisher,
    inLanguage: ["en", ...(article.titleEs ? ["es"] : [])],
    ...(article.coverImage
      ? { image: { "@type": "ImageObject", url: `${BASE_URL}${article.coverImage}` } }
      : {}),
    articleSection: article.category === "chronicle" ? "Match Reports" : "News Digest",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/news/${article.slug}`,
    },
  };
}

export function eventJsonLd(pkg: {
  matchTitle: string;
  matchTitleEs?: string | null;
  slug: string;
  matchDate: string;
  matchTime: string;
  competition: string;
  description: string;
  heroImage: string | null;
  lowestPrice?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: pkg.matchTitle,
    alternateName: pkg.matchTitleEs || undefined,
    description: pkg.description.substring(0, 200),
    url: `${BASE_URL}/packages/${pkg.slug}`,
    startDate: pkg.matchDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "StadiumOrArena",
      name: "Spotify Camp Nou",
      address: {
        "@type": "PostalAddress",
        streetAddress: "C. d'Arístides Maillol, s/n",
        addressLocality: "Barcelona",
        postalCode: "08028",
        addressCountry: "ES",
      },
    },
    organizer: {
      "@type": "SportsTeam",
      name: "FC Barcelona",
      url: "https://www.fcbarcelona.com",
    },
    performer: {
      "@type": "SportsTeam",
      name: "FC Barcelona",
    },
    ...(pkg.heroImage
      ? { image: `${BASE_URL}${pkg.heroImage}` }
      : {}),
    ...(pkg.lowestPrice && pkg.lowestPrice > 0
      ? {
          offers: {
            "@type": "Offer",
            price: pkg.lowestPrice,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: `${BASE_URL}/packages/${pkg.slug}`,
            validFrom: new Date().toISOString(),
          },
        }
      : {}),
    inLanguage: ["en", ...(pkg.matchTitleEs ? ["es"] : [])],
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}

export function eventsListJsonLd(
  matches: Array<{
    opponent: string;
    date: string;
    time: string;
    competition: string;
    venue: string;
  }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "FC Barcelona Upcoming Matches",
    itemListElement: matches.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SportsEvent",
        name: m.venue === "home"
          ? `FC Barcelona vs ${m.opponent}`
          : `${m.opponent} vs FC Barcelona`,
        startDate: m.date,
        location: {
          "@type": "StadiumOrArena",
          name: m.venue === "home" ? "Spotify Camp Nou" : "Away",
        },
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      },
    })),
  };
}
