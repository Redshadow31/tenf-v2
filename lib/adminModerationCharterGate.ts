import { isFounder } from "@/lib/adminRoles";
import { memberRepository } from "@/lib/repositories";
import { getLatestModerationCharterValidationForMember } from "@/lib/moderationCharterValidationsStorage";
export {
  ADMIN_CHARTER_ESCAPE_PATH_PREFIXES,
  isAdminPathAllowedDuringCharterBlock,
} from "@/lib/adminModerationCharterGatePaths";

const CHARTER_GRACE_MS = 15 * 24 * 60 * 60 * 1000;

/**
 * Indique si l'accès au dashboard admin doit être refusé (charte modération non validée après le délai).
 * Les fondateurs ne sont jamais bloqués. En cas d'erreur technique, fail-open (pas de blocage).
 */
export async function adminModerationCharterAccessBlocked(discordId: string | null | undefined): Promise<boolean> {
  if (!discordId) return false;
  if (isFounder(discordId)) return false;

  try {
    const validation = await getLatestModerationCharterValidationForMember(discordId);
    if (validation) return false;

    let member = null as Awaited<ReturnType<typeof memberRepository.findByDiscordId>>;
    try {
      member = await memberRepository.findByDiscordId(discordId);
    } catch {
      return false;
    }

    const base = member?.integrationDate || member?.createdAt || new Date();
    const graceStart = base instanceof Date ? base.getTime() : new Date(base).getTime();
    if (Number.isNaN(graceStart)) return false;

    return Date.now() > graceStart + CHARTER_GRACE_MS;
  } catch (e) {
    console.warn("[adminModerationCharterGate] evaluation failed, allow access:", e);
    return false;
  }
}
