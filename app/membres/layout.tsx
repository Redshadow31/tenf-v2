import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "Membres — TENF";
const DESCRIPTION =
  "L'annuaire public de la New Family : profils, ambiance, lives en direct et chaînes coup de cœur de la communauté TENF. Filtre, cherche, tire au sort — découvre les humains derrière le réseau.";
const URL = "https://tenf-community.com/membres";

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
    "membres TENF",
    "annuaire streamers Twitch",
    "communauté streamers francophone",
    "Twitch Entraide New Family",
  ],
};

export default function MembresLayout({ children }: { children: ReactNode }) {
  return children;
}
