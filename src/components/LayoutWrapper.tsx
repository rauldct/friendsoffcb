"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieBanner from "./CookieBanner";
import LiveScore from "./LiveScore";
import MatchCountdown from "./MatchCountdown";
export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isStandalone = pathname.startsWith("/manualpet");

  if (isAdmin || isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <LiveScore />
      <MatchCountdown />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
