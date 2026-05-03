import RaidsFiabiliteHubShell from "@/components/admin/RaidsFiabiliteHubShell";
import EngagementRaidsSignalementsPage from "../../../engagement/raids-a-valider/page";

export default function CommunauteEngagementSignalementsRaidsPage() {
  return (
    <RaidsFiabiliteHubShell active="signalements">
      <EngagementRaidsSignalementsPage />
    </RaidsFiabiliteHubShell>
  );
}
