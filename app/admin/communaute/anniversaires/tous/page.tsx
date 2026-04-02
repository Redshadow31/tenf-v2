import AnniversariesPage from "@/components/admin/AnniversariesPage";

export default function CommunauteAnniversairesTousPage() {
  return (
    <AnniversariesPage
      scope="all"
      backHref="/admin/communaute/anniversaires"
      backLabel="Retour au sous-groupe Anniversaires"
      title="Tous les anniversaires"
      description="Page globale qui rassemble tous les anniversaires en deux onglets : Anniversaire et Anniversaire d'affiliation."
    />
  );
}
