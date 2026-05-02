import type { Metadata } from "next";
import OrganisationStaffClient from "./OrganisationStaffClient";

export const metadata: Metadata = {
  title: "Organisation du staff TENF",
  description:
    "Gouvernance, modération, pôles projet et rôle Soutien TENF : structure de la communauté pour le public et les membres, avec parcours guidé et lien vers l’organigramme interactif.",
};

export default function OrganisationStaffPage() {
  return <OrganisationStaffClient />;
}
