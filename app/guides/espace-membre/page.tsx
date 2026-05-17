import type { Metadata } from "next";
import GuideMemberHubView from "@/components/guides/espace-membre/GuideMemberHubView";

export const metadata: Metadata = {
  title: "Guide — espace membre (carte interactive) | TENF",
  description:
    "Carte de la navigation membre TENF : profils types, menu latéral, checklist, FAQ et liens /member — page lisible sans connexion.",
  alternates: {
    canonical: "https://tenf-community.com/guides/espace-membre",
  },
};

export default function GuideEspaceMembrePage() {
  return <GuideMemberHubView />;
}
