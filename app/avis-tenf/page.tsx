import type { Metadata } from "next";
import AvisTenfPageClient from "@/components/avis-tenf/AvisTenfPageClient";

export const metadata: Metadata = {
  title: "Témoignages | TENF",
  description:
    "Avis et retours authentiques sur TENF : intégration, entraide, ambiance et progression. Page publique avec recherche, filtres et formulaire pour les membres.",
  alternates: {
    canonical: "https://tenf-community.com/avis-tenf",
  },
};

export default function AvisTenfPage() {
  return <AvisTenfPageClient />;
}
