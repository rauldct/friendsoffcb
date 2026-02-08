import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "We're a group of local Barcelona fans helping international visitors experience the magic of FC Barcelona at Spotify Camp Nou. Learn about our mission.",
  openGraph: {
    title: "About Friends of Barça",
    description: "Local Barcelona fans helping international visitors experience FC Barcelona like locals.",
    images: ["/images/packages/camp-nou-exterior.jpg"],
  },
  twitter: {
    card: "summary",
    title: "About Friends of Barça",
    description: "Local Barcelona fans helping international visitors experience FC Barcelona like locals.",
  },
  alternates: {
    canonical: "https://friendsofbarca.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="section-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-8 text-center">About Friends of Barça</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <p className="text-xl text-gray-500 text-center mb-10">
            We&apos;re a group of passionate culés from Barcelona helping international fans experience the magic of FC Barcelona like locals.
          </p>

          <div className="bg-[#F5F5F5] rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">Our Mission</h2>
            <p>
              Visiting the Spotify Camp Nou should be more than just watching a football match — it should be an unforgettable experience. We created Friends of Barça to help fans from around the world navigate tickets, find the best hotels, discover hidden local gems, and create memories that last a lifetime.
            </p>
          </div>

          <h2 className="text-2xl font-heading font-bold text-[#1A1A2E]">What We Do</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>Curate complete matchday packages with trusted ticket providers, hotels, and activities</span></li>
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>Write insider guides based on our years of attending matches as locals</span></li>
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>Provide daily news and analysis for the global Barça community</span></li>
            <li className="flex items-start gap-3"><span className="text-[#EDBB00]">★</span> <span>Help you plan your perfect Barcelona football trip from start to finish</span></li>
          </ul>

          <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mt-8">Affiliate Disclosure</h2>
          <p>
            Friends of Barça is an independent website and is not affiliated with FC Barcelona. Some of the links on our site are affiliate links, meaning we may earn a commission if you make a purchase through them — at no extra cost to you. This helps us keep the site running and continue providing free content and guides.
          </p>

          <div className="text-center mt-10">
            <Link href="/contact" className="btn-primary">Get in Touch</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
