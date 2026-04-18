import LivesPageClient from "./LivesPageClient";

/**
 * Widget objectif Streamlabs Charity (URL avec token) : ne pas mettre dans le JSON UPA (API publique).
 * Définir uniquement côté serveur (.env / hébergeur).
 */
export default function LivesPage() {
  const streamlabsCharityGoalWidgetUrl =
    process.env.STREAMLABS_CHARITY_GOAL_WIDGET_URL?.trim() || "";

  return <LivesPageClient streamlabsCharityGoalWidgetUrl={streamlabsCharityGoalWidgetUrl} />;
}
