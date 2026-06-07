import type { Metadata } from "next";
import FormationsCatalogPage from "@/components/member/formations/catalog/FormationsCatalogPage";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description:
    "Sessions à venir, archive thématique et demandes d'intérêt — parcours formations TENF à ton rythme.",
};

export default function MemberFormationCatalogPage() {
  return <FormationsCatalogPage />;
}
