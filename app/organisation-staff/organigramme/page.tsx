import type { Metadata } from "next";
import OrganigrammeClient from "./OrganigrammeClient";
import { getPublicOrgChartEntries } from "@/lib/staff/getPublicOrgChartEntries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organigramme interactif TENF",
  description:
    "Carte du staff public TENF : filtres par rôle et par pôle, recherche, vue grille ou compacte et fiches détail — pour le grand public et les membres.",
};

export default async function OrganigrammeInteractifPage() {
  const entries = await getPublicOrgChartEntries();
  return <OrganigrammeClient entries={entries} />;
}

