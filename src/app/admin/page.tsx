import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalLeads,
    totalSubscribers,
    activeSubscribers,
    totalPackages,
    upcomingPackages,
    totalPosts,
    publishedPosts,
    totalMatches,
    recentLeads,
    recentSubscribers,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { active: true } }),
    prisma.matchPackage.count(),
    prisma.matchPackage.count({ where: { status: "upcoming" } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "published" } }),
    prisma.match.count(),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: "📧", color: "bg-blue-50 text-blue-700", href: "/admin/leads" },
    { label: "Subscribers", value: `${activeSubscribers} / ${totalSubscribers}`, icon: "📬", color: "bg-green-50 text-green-700", href: "/admin/subscribers" },
    { label: "Packages", value: `${upcomingPackages} upcoming`, icon: "📦", color: "bg-purple-50 text-purple-700", href: "/admin/packages" },
    { label: "Blog Posts", value: `${publishedPosts} published`, icon: "📝", color: "bg-orange-50 text-orange-700", href: "/admin/posts" },
    { label: "Matches", value: totalMatches, icon: "⚽", color: "bg-red-50 text-red-700", href: "/admin/settings" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${stat.color}`}>{stat.icon}</span>
              <span className="text-xs font-medium text-gray-500 uppercase">{stat.label}</span>
            </div>
            <div className="text-2xl font-heading font-bold text-[#1A1A2E]">{stat.value}</div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-[#1A1A2E]">Recent Leads</h2>
            <Link href="/admin/leads" className="text-sm text-[#004D98] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLeads.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No leads yet</p>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-[#1A1A2E]">{lead.name || lead.email}</span>
                      {lead.matchInterested && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{lead.matchInterested}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{lead.email} · {lead.source}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-bold text-[#1A1A2E]">Recent Subscribers</h2>
            <Link href="/admin/subscribers" className="text-sm text-[#004D98] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSubscribers.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No subscribers yet</p>
            ) : (
              recentSubscribers.map(sub => (
                <div key={sub.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-[#1A1A2E]">{sub.email}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${sub.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {sub.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{sub.source}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-heading font-bold text-[#1A1A2E] mb-3">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Next.js Server: <strong className="text-green-600">Running</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Database: <strong className="text-green-600">Connected</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">SSL: <strong className="text-green-600">Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
