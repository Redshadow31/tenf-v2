import type { Metadata } from "next";
import EvenementsAgendaClient from "@/components/events2/EvenementsAgendaClient";

const TITLE = "Événements TENF — Agenda communautaire & inscriptions";
const DESCRIPTION =
  "Calendrier officiel des événements TENF : soirées film, formations, spotlights, apéros, jeux et rencontres communautaires. Filtre par catégorie, ajoute à ton agenda Google et inscris-toi en quelques secondes.";
const URL = "https://tenf-community.com/evenements";

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
    "agenda TENF",
    "calendrier événements Twitch",
    "soirée film TENF",
    "spotlight TENF",
    "formations streamers",
    "apéro communauté Twitch",
    "inscription événement Twitch",
    "communauté streamers francophone",
  ],
};

export default function EvenementsPage() {
  return <EvenementsAgendaClient />;
}
