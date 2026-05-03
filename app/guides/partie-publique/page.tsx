import type { Metadata } from "next";
import GuidePartiePubliqueExperience from "./GuidePartiePubliqueExperience";

export const metadata: Metadata = {
  title: "Guide — partie publique du site | TENF",
  description:
    "Parcourir TENF sans connexion : carte du menu, profils interactifs, parcours, checklist et FAQ — puis passage à l'espace membre.",
  alternates: {
    canonical: "https://tenf-community.com/guides/partie-publique",
  },
};

export default function GuidePartiePubliquePage() {
  return <GuidePartiePubliqueExperience />;
}
