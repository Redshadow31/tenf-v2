import type { Metadata } from "next";
import MemberFormationsValidees from "@/components/member/formations/MemberFormationsValidees";

export const metadata: Metadata = {
  title: "Formations validées",
  description: "Progression, objectifs du mois et historique des formations validées côté TENF.",
};

export default function MemberValidatedFormationsPage() {
  return <MemberFormationsValidees />;
}
