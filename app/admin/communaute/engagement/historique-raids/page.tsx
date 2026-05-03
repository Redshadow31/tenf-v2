import RaidsFiabiliteHubShell from "@/components/admin/RaidsFiabiliteHubShell";
import EngagementHistoriqueRaidsPage from "../../../engagement/historique-raids/page";

export default function CommunauteEngagementHistoriqueRaidsPage() {
  return (
    <RaidsFiabiliteHubShell active="historique">
      <EngagementHistoriqueRaidsPage />
    </RaidsFiabiliteHubShell>
  );
}
