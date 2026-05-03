import type { Metadata } from "next";
import GuideTenfNouveauMembreExperience from "./GuideTenfNouveauMembreExperience";

export const metadata: Metadata = {
  title: "Guide TENF — nouveau membre | TENF",
  description:
    "Culture TENF pour les nouveaux membres : entraide, Spotlights, points, événements, formations et rôle — avec liens vers le fonctionnement officiel et l’espace membre.",
  alternates: {
    canonical: "https://tenf-community.com/guides/tenf",
  },
};

export default function GuideTenfNouveauMembrePage() {
  return <GuideTenfNouveauMembreExperience />;
}
