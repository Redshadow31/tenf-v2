import type { Metadata } from "next";
import GuideMemberParcoursView from "@/components/guides/espace-membre/GuideMemberParcoursView";

export const metadata: Metadata = {
  title: "Parcours première connexion — guide espace membre | TENF",
  description: "Parcours en 4 étapes pour prendre en main l'espace membre TENF après connexion Discord.",
  alternates: {
    canonical: "https://tenf-community.com/guides/espace-membre/parcours",
  },
};

export default function GuideMemberParcoursPage() {
  return <GuideMemberParcoursView />;
}
