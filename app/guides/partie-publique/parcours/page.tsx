import type { Metadata } from "next";
import GuideParcoursView from "@/components/guides/partie-publique/GuideParcoursView";

export const metadata: Metadata = {
  title: "Parcours première visite — guide site public | TENF",
  description: "Parcours en 4 étapes pour découvrir TENF sur le site public avant de rejoindre la communauté.",
  alternates: {
    canonical: "https://tenf-community.com/guides/partie-publique/parcours",
  },
};

export default function GuideParcoursPage() {
  return <GuideParcoursView />;
}
