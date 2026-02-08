import Link from "next/link";
import PostCard from "./PostCard";
import { BlogPost } from "@/types";

export default function LatestNews({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] mb-4">Latest News</h2>
          <p className="text-gray-500">Stay up to date with everything FC Barcelona.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, 6).map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/blog" className="btn-secondary">Read More News</Link>
        </div>
      </div>
    </section>
  );
}
