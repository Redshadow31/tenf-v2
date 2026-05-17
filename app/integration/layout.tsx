import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "Réunion d'intégration — TENF";
const DESCRIPTION =
  "Réserver son créneau pour la réunion d'intégration TENF : présentation du serveur, valeurs, fonctionnement et premières orientations. Format détendu, sans test ni entretien.";
const URL = "https://tenf-community.com/integration";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "website",
    siteName: "TENF — Twitch Entraide New Family",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  keywords: [
    "réunion intégration TENF",
    "rejoindre TENF",
    "communauté Twitch francophone",
    "Discord streamers",
  ],
};

export default function IntegrationLayout({ children }: { children: ReactNode }) {
  return children;
}
