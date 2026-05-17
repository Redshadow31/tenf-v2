import { requireModerationAccess } from "@/lib/moderation/guards";
import { getLatestModerationCharterValidationForMember } from "@/lib/moderationCharterValidationsStorage";
import ModerationHub from "@/components/admin/moderation/ModerationHub";

/**
 * Hub staff du Centre de modération.
 * Vue opérationnelle réservée aux modérateurs (avec bascule vers la vue admin
 * pour les fondateurs et coordinateurs).
 */
export default async function AdminModerationStaffHubPage() {
  const { admin, canPilot } = await requireModerationAccess();
  const validation = await getLatestModerationCharterValidationForMember(admin.discordId).catch(
    () => null,
  );
  return (
    <ModerationHub
      view="staff"
      canPilot={canPilot}
      charterSigned={!!validation}
      username={admin.username}
    />
  );
}
