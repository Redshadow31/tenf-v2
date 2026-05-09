import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Onboarding staff (mobile) | TENF",
  description: "Vue tactile allégée pour le staffing des sessions d’intégration — mêmes données que la version bureau.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0c10",
};

export default function StaffMobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
