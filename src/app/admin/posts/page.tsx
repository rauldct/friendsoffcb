import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Blog Posts ({posts.length})</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Author</th>
                <th className="px-4 py-3 font-medium text-gray-500">Published</th>
                <th className="px-4 py-3 font-medium text-gray-500">Tags</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1A1A2E] max-w-[300px] truncate">{post.title}</div>
                    <div className="text-xs text-gray-400">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      post.category === "guide" ? "bg-green-100 text-green-800" :
                      post.category === "news" ? "bg-blue-100 text-blue-800" :
                      post.category === "analysis" ? "bg-purple-100 text-purple-800" :
                      post.category === "transfers" ? "bg-orange-100 text-orange-800" :
                      "bg-red-100 text-red-800"
                    }`}>{post.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      post.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{post.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{post.author}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(post.publishedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                      {post.tags.length > 3 && <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={post.category === "guide" ? `/guides/${post.slug}` : `/blog/${post.slug}`}
                      className="text-[#004D98] hover:underline text-xs"
                      target="_blank"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
