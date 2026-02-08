import Link from "next/link";
import PackageCard from "./PackageCard";
import { MatchPackage } from "@/types";

export default function FeaturedPackages({ packages }: { packages: MatchPackage[] }) {
  return (
    <section className="section-padding bg-[#F5F5F5]">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">Featured Experiences</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Hand-picked matchday packages with the best tickets, hotels, and activities for an unforgettable Camp Nou experience.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.slice(0, 3).map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/packages" className="btn-primary">View All Packages</Link>
        </div>
      </div>
    </section>
  );
}
