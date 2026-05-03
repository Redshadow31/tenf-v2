import type { Metadata } from "next";
import GuideIntegrationClient from "./GuideIntegrationClient";

export const metadata: Metadata = {
  title: "Guide d'intégration TENF",
  description:
    "Comprendre la réunion d'intégration TENF : déroulé, état d'esprit, FAQ et réservation de créneau. Parcours pour futurs membres.",
  openGraph: {
    title: "Guide d'intégration TENF",
    description:
      "Réunion d'accueil, entraide et cadre communautaire : tout savoir avant de réserver ton créneau.",
  },
};

export default function GuideIntegrationPage() {
  return <GuideIntegrationClient />;
}
