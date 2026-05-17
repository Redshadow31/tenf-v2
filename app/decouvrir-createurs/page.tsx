import type { Metadata } from "next";
import DiscoverCreatorsClient from "./DiscoverCreatorsClient";

export const metadata: Metadata = {
  title: "Clips à découvrir | TENF",
  description:
    "Sélection de clips Twitch des créateurs TENF : découvre des moments forts, filtre par style ou durée, puis rejoins les lives ou l’annuaire des membres.",
  alternates: {
    canonical: "https://tenf-community.com/decouvrir-createurs",
  },
};

export default function DecouvrirCreateursPage() {
  return <DiscoverCreatorsClient />;
}
