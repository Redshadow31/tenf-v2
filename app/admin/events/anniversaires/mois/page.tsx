"use client";

import AnniversariesPage from "@/components/admin/AnniversariesPage";

export default function AnniversairesMoisPage() {
  return (
    <AnniversariesPage
      scope="month"
      backHref="/admin/events/anniversaires"
      backLabel="Retour au sous-groupe Anniversaires"
      title="Anniversaires du mois"
      description="Retrouve les anniversaires du mois en deux onglets : Anniversaire et Anniversaire d'affiliation."
    />
  );
}

