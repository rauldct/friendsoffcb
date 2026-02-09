"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/leads", label: "Leads", icon: "📧" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "📬" },
  { href: "/admin/packages", label: "Packages", icon: "📦" },
  { href: "/admin/posts", label: "Blog Posts", icon: "📝" },
  { href: "/admin/gallery", label: "Gallery", icon: "📸" },
  { href: "/admin/automations", label: "Automations", icon: "🤖" },
  { href: "/admin/penyes", label: "Peñas", icon: "🏠" },
  { href: "/admin/penyes/chat", label: "Chat RAG", icon: "💬" },
  { href: "/admin/news", label: "News", icon: "📰" },
  { href: "/admin/feedback", label: "Feedback", icon: "💬" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "📨" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/backup", label: "Backup", icon: "💾" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingGalleryCount, setPendingGalleryCount] = useState(0);

  // Fetch pending gallery count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/admin/gallery/pending-count");
        if (res.ok) {
          const data = await res.json();
          setPendingGalleryCount(data.count || 0);
        }
      } catch {}
    };
    if (pathname !== "/admin/login") {
      fetchPendingCount();
    }
  }, [pathname]);

  // Login page renders without sidebar/topbar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Top Bar */}
      <div className="bg-[#1A1A2E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚽</span>
            <span className="font-heading font-bold">Friends of Barça <span className="text-[#EDBB00]">Admin</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Site
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-white rounded-xl shadow-sm overflow-hidden">
              {adminLinks.map(link => {
                // Check if this specific link should be active
                const isActive = pathname === link.href ||
                  (link.href !== "/admin" && pathname.startsWith(link.href + "/") &&
                    !adminLinks.some(other => other.href !== link.href && other.href.startsWith(link.href + "/") && pathname.startsWith(other.href)));
                return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-gray-50 transition-colors ${
                    isActive
                      ? "bg-[#004D98] text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  {link.href === "/admin/gallery" && pendingGalleryCount > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                      {pendingGalleryCount}
                    </span>
                  )}
                </Link>
              );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
