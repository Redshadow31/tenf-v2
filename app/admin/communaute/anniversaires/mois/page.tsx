import AnniversariesPage from "@/components/admin/AnniversariesPage";

export default function CommunauteAnniversairesMoisPage() {
  return (
    <AnniversariesPage
      scope="month"
      backHref="/admin/communaute/anniversaires"
      backLabel="Retour au sous-groupe Anniversaires"
      title="Anniversaires du mois"
      description="Retrouve les anniversaires du mois en deux onglets : Anniversaire et Anniversaire d'affiliation."
    />
  );
}
