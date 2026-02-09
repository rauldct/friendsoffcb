import prisma from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

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
    { label: "Total Leads", value: String(totalLeads), icon: "\u{1F4E7}", color: "bg-blue-50 text-blue-700", href: "/admin/leads" },
    { label: "Subscribers", value: `${activeSubscribers} / ${totalSubscribers}`, icon: "\u{1F4EC}", color: "bg-green-50 text-green-700", href: "/admin/subscribers" },
    { label: "Packages", value: `${upcomingPackages} upcoming`, icon: "\u{1F4E6}", color: "bg-purple-50 text-purple-700", href: "/admin/packages" },
    { label: "Blog Posts", value: `${publishedPosts} published`, icon: "\u{1F4DD}", color: "bg-orange-50 text-orange-700", href: "/admin/posts" },
    { label: "Matches", value: String(totalMatches), icon: "\u26BD", color: "bg-red-50 text-red-700", href: "/admin/settings" },
  ];

  const serializedLeads = recentLeads.map(l => ({
    id: l.id,
    email: l.email,
    name: l.name,
    matchInterested: l.matchInterested,
    source: l.source,
    createdAt: l.createdAt.toISOString(),
  }));

  const serializedSubs = recentSubscribers.map(s => ({
    id: s.id,
    email: s.email,
    active: s.active,
    source: s.source,
  }));

  return (
    <DashboardClient
      stats={stats}
      recentLeads={serializedLeads}
      recentSubscribers={serializedSubs}
    />
  );
}
