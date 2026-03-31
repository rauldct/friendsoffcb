import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PawTrack - Manual de Usuario",
  description: "Manual completo de la plataforma PawTrack: Smart Pet Monitoring. Guia de uso con capturas de pantalla de todas las funcionalidades.",
  robots: { index: false, follow: false },
};

export default function ManualPetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
