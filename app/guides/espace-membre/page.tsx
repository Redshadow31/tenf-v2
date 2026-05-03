import type { Metadata } from "next";
import GuideEspaceMembreExperience from "./GuideEspaceMembreExperience";

export const metadata: Metadata = {
  title: "Guide — espace membre (carte interactive) | TENF",
  description:
    "Carte de la navigation membre TENF : profils types, barre latérale, checklist, FAQ et liens /member — page lisible sans connexion.",
  alternates: {
    canonical: "https://tenf-community.com/guides/espace-membre",
  },
};

export default function GuideEspaceMembrePage() {
  return <GuideEspaceMembreExperience />;
}
