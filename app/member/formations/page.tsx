import type { Metadata } from "next";
import MemberFormationsCatalog from "@/components/member/formations/MemberFormationsCatalog";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description: "Sessions à venir, inscriptions, archive des thèmes et demandes d'intérêt pour les formations TENF.",
};

export default function MemberFormationCatalogPage() {
  return <MemberFormationsCatalog />;
}
