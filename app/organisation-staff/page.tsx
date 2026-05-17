import type { Metadata } from "next";
import OrganisationStaffClient from "./OrganisationStaffClient";

export const metadata: Metadata = {
  title: "Rôles staff & pôles de mission — TENF",
  description:
    "Découvre l’organisation du staff TENF : huit rôles principaux (de Fondateur à Contributeur Invité) et neuf pôles de mission (vision, parcours, animations, outils, veille…). Une équipe bénévole, structurée et bienveillante.",
};

export default function OrganisationStaffPage() {
  return <OrganisationStaffClient />;
}
