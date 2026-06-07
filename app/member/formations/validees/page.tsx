import type { Metadata } from "next";
import FormationsValideesPage from "@/components/member/formations/validees/FormationsValideesPage";

export const metadata: Metadata = {
  title: "Formations validées",
  description:
    "Progression, objectifs du mois, paliers et historique des formations validées — parcours TENF à ton rythme.",
};

export default function MemberValidatedFormationsPage() {
  return <FormationsValideesPage />;
}
