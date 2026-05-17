import type { Metadata } from "next";
import AdminPartnershipsClient from "./_components/AdminPartnershipsClient";

export const metadata: Metadata = {
  title: "Demandes de partenariat — Admin TENF",
  robots: { index: false, follow: false },
};

/**
 * Console admin des demandes de partenariat reçues depuis la modale
 * publique /partenariats. L'authentification + l'autorisation sont
 * vérifiées côté API (requireSectionAccess('/admin/partenariats')) :
 * si le visiteur n'a pas le droit, l'API renvoie 401 et l'UI affiche
 * un message d'accès refusé.
 *
 * Le layout /admin/layout.tsx s'occupe déjà du chrome (topbar + sidebar).
 */
export default function AdminPartenariatsPage() {
  return <AdminPartnershipsClient />;
}
