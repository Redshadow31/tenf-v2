"use client";

import AnniversariesPage from "@/components/admin/AnniversariesPage";

export default function TousLesAnniversairesPage() {
  return (
    <AnniversariesPage
      scope="all"
      backHref="/admin/events/anniversaires"
      backLabel="Retour au sous-groupe Anniversaires"
      title="Tous les anniversaires"
      description="Page globale qui rassemble tous les anniversaires en deux onglets : Anniversaire et Anniversaire d'affiliation."
    />
  );
}

