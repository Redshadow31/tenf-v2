import type { Metadata } from "next";
import DiscoverCreatorsClient from "./DiscoverCreatorsClient";

export const metadata: Metadata = {
  title: "Découvrir les créateurs | TENF",
  description:
    "Sélection publique de clips aléatoires de créateurs TENF actifs, avec rafraîchissement et filtres rapides.",
  alternates: {
    canonical: "https://tenf-community.com/decouvrir-createurs",
  },
};

export default function DecouvrirCreateursPage() {
  return <DiscoverCreatorsClient />;
}
