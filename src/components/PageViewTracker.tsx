"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin pages
    if (pathname.startsWith("/admin")) return;
    fetch("/api/pageview", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
