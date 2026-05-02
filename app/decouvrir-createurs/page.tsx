import type { Metadata } from "next";
import DiscoverCreatorsClient from "./DiscoverCreatorsClient";

export const metadata: Metadata = {
  title: "Clips à découvrir | TENF",
  description:
    "Clips Twitch TENF renouvelés à chaque tirage : filtres par style et durée, accès direct aux chaînes et aux fiches annuaire pour curieux·ses et membres.",
  alternates: {
    canonical: "https://tenf-community.com/decouvrir-createurs",
  },
};

export default function DecouvrirCreateursPage() {
  return <DiscoverCreatorsClient />;
}
