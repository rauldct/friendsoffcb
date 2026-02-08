"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/leads", label: "Leads", icon: "📧" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "📬" },
  { href: "/admin/packages", label: "Packages", icon: "📦" },
  { href: "/admin/posts", label: "Blog Posts", icon: "📝" },
  { href: "/admin/gallery", label: "Gallery", icon: "📸" },
  { href: "/admin/automations", label: "Automations", icon: "🤖" },
  { href: "/admin/penyes", label: "Peñas", icon: "🏠" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
              {adminLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-gray-50 transition-colors ${
                    pathname === link.href
                      ? "bg-[#004D98] text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
