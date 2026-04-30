import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fonctionnement TENF",
  description:
    "Découvre comment fonctionne la communauté TENF : intégration, progression, événements, ressources et entraide entre créateurs.",
};

export default function FonctionnementTenfRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
