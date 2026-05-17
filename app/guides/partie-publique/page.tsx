import type { Metadata } from "next";
import GuideHubView from "@/components/guides/partie-publique/GuideHubView";

export const metadata: Metadata = {
  title: "Guide du site public | TENF",
  description:
    "Guide complet de la partie publique TENF : Découvrir, Communauté, Agenda, Rejoindre et TENF+. Chaque page expliquée, sans connexion.",
  alternates: {
    canonical: "https://tenf-community.com/guides/partie-publique",
  },
};

export default function GuidePartiePubliquePage() {
  return <GuideHubView />;
}
