import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "Événements communautaires — TENF";
const DESCRIPTION =
  "Les événements communautaires TENF : soirées jeux, formats spéciaux, découvertes de créateurs et idées proposées par les membres. Calendrier, propositions et participation ouverts à toute la New Family.";
const URL = "https://tenf-community.com/evenements-communautaires";

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
    "événements TENF",
    "soirées Twitch communautaires",
    "événements streamers francophones",
    "Discord communauté Twitch",
  ],
};

export default function EvenementsCommunautairesLayout({ children }: { children: ReactNode }) {
  return children;
}
