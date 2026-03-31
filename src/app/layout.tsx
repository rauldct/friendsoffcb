import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PageViewTracker from "@/components/PageViewTracker";
import HtmlLangSync from "@/components/HtmlLangSync";
import WebVitals from "@/components/WebVitals";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { LanguageProvider } from "@/lib/LanguageContext";

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Friends of Barça | Your Ultimate FC Barcelona Experience",
    template: "%s | Friends of Barça",
  },
  description:
    "The ultimate guide for international FC Barcelona fans. Match tickets, hotels, tours & insider tips for the perfect Spotify Camp Nou experience.",
  keywords: [
    "FC Barcelona", "Camp Nou", "Spotify Camp Nou", "Barcelona football",
    "Barça tickets", "Barcelona match tickets", "Camp Nou experience",
    "Barcelona fan guide", "El Clásico tickets", "Champions League Barcelona",
    "Barcelona travel guide", "Camp Nou tour", "Barcelona matchday",
    "entradas FC Barcelona", "entradas Camp Nou", "guía Barcelona fútbol",
    "experiencia Camp Nou", "paquetes partido Barcelona", "viaje Barcelona fútbol",
  ],
  metadataBase: new URL("https://friendsofbarca.com"),
  alternates: {
    canonical: "https://friendsofbarca.com",
    languages: { "en": "https://friendsofbarca.com", "es": "https://friendsofbarca.com/es", "x-default": "https://friendsofbarca.com" },
  },
  openGraph: {
    title: "Friends of Barça | Your Ultimate FC Barcelona Experience",
    description:
      "Match tickets, hotels, tours & insider tips for the perfect Camp Nou experience. The #1 fan platform for FC Barcelona.",
    url: "https://friendsofbarca.com",
    siteName: "Friends of Barça",
    locale: "en_US",
    alternateLocale: "es_ES",
    type: "website",
    images: [
      {
        url: "/images/packages/camp-nou-aerial.jpg",
        width: 1826,
        height: 1186,
        alt: "Spotify Camp Nou aerial view - FC Barcelona stadium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Friends of Barça | FC Barcelona Fan Experience",
    description:
      "Your ultimate FC Barcelona matchday experience guide. Tickets, hotels, tours & insider tips.",
    images: ["/images/packages/camp-nou-aerial.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console verification will go here
    // google: "your-verification-code",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Friends of Barça",
  alternateName: "FriendsOfBarca",
  url: "https://friendsofbarca.com",
  description: "The ultimate guide for international FC Barcelona fans. Match tickets, hotels, tours & insider tips.",
  publisher: {
    "@type": "Organization",
    name: "Friends of Barça",
    url: "https://friendsofbarca.com",
    logo: {
      "@type": "ImageObject",
      url: "https://friendsofbarca.com/images/packages/camp-nou-aerial.jpg",
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://friendsofbarca.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  name: "FC Barcelona",
  alternateName: ["Barça", "Barcelona", "FCB"],
  url: "https://www.fcbarcelona.com",
  sport: "Football",
  location: {
    "@type": "StadiumOrArena",
    name: "Spotify Camp Nou",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Barcelona",
      addressRegion: "Catalonia",
      addressCountry: "ES",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <meta name="theme-color" content="#1A1A2E" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <PageViewTracker />
        <WebVitals />
        <ServiceWorkerRegister />
        <LanguageProvider>
          <HtmlLangSync />
          <LayoutWrapper>{children}</LayoutWrapper>
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
