import { redirect } from "next/navigation";

/** Ancienne URL du tableau de bord — conservée pour les favoris et liens externes. */
export default function GestionAccesAccueilLegacyRedirectPage() {
  redirect("/admin/gestion-acces");
}
