import { requireModerationAccess } from "@/lib/moderation/guards";
import { getLatestModerationCharterValidationForMember } from "@/lib/moderationCharterValidationsStorage";
import ModerationHub from "@/components/admin/moderation/ModerationHub";

/**
 * Hub canonique du Centre de modération TENF.
 *
 * Comportement :
 * - Coordinateur / fondateur : vue admin (pilotage), bascule possible vers staff.
 * - Modérateur opérationnel : vue staff (opérationnel), pas de bascule.
 * - Modérateur non signataire de la charte : redirigé par le guard vers la charte.
 *
 * Source unique : `lib/moderation/moderationTree.ts`.
 */
export default async function AdminModerationHubPage() {
  const { admin, defaultView, canPilot } = await requireModerationAccess();
  const validation = await getLatestModerationCharterValidationForMember(admin.discordId).catch(
    () => null,
  );
  return (
    <ModerationHub
      view={defaultView}
      canPilot={canPilot}
      charterSigned={!!validation}
      username={admin.username}
    />
  );
}
