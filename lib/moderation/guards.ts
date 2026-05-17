/**
 * Guards serveur dédiés au centre de modération TENF.
 *
 * Pourquoi un guard dédié plutôt que `requireAdmin` direct ?
 * - La zone /admin/moderation/staff doit aussi être accessible aux modérateurs
 *   opérationnels (rôles MODERATEUR, MODERATEUR_EN_FORMATION, etc.), qui ne
 *   passent pas tous le check `hasAdminDashboardAccess` strict.
 * - Le gate charte (`moderationCharterBlocked`) doit pouvoir laisser passer
 *   les pages charte/validation-charte sans court-circuiter le rôle.
 * - On veut une fonction qui renvoie l'admin authentifié ET un drapeau de
 *   vue par défaut (admin ou staff) selon le rôle pour pré-router le hub.
 *
 * Les pages métier appellent ces guards et `redirect()` si null.
 */

import { redirect } from "next/navigation";
import {
  getAuthenticatedAdmin,
  type AuthenticatedAdmin,
} from "@/lib/requireAdmin";
import { adminModerationCharterAccessBlocked } from "@/lib/adminModerationCharterGate";
import {
  buildModerationHref,
  charterEscapeModuleIds,
  type ModerationView,
} from "@/lib/moderation/moderationTree";

const STAFF_ROLES = new Set([
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
  "MODERATEUR",
  "MODERATEUR_EN_FORMATION",
  "MODERATEUR_EN_PAUSE",
  "SOUTIEN_TENF",
]);

const ADMIN_PILOT_ROLES = new Set([
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
]);

export type ModerationGuardOptions = {
  /**
   * Indique si la page courante est une route "charte" autorisée même quand
   * le gate charte est actif. Si true, on contourne la redirection vers
   * `/admin/moderation/staff/info/charte`.
   */
  isCharterEscapePath?: boolean;
};

export type ModerationGuardResult = {
  admin: AuthenticatedAdmin;
  /** Vue par défaut (admin coordinateur => admin, sinon staff). */
  defaultView: ModerationView;
  /** True si l'utilisateur peut accéder à la vue admin (pilotage). */
  canPilot: boolean;
  /** True si l'utilisateur est un modérateur (vue staff). */
  isStaff: boolean;
  /** True si la charte est non signée et bloque l'utilisateur (modos). */
  charterBlocked: boolean;
};

/**
 * Garde principal du centre de modération.
 * Acceptable pour toute la zone /admin/moderation/**.
 * Redirige vers /unauthorized si l'utilisateur n'a aucun rôle staff.
 */
export async function requireModerationAccess(
  options: ModerationGuardOptions = {},
): Promise<ModerationGuardResult> {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/api/auth/signin?callbackUrl=/admin/moderation");
  }

  const role = admin.role;
  const isStaff = STAFF_ROLES.has(role);
  const canPilot = ADMIN_PILOT_ROLES.has(role);

  if (!isStaff && !canPilot) {
    redirect("/unauthorized");
  }

  const charterBlocked =
    !canPilot && (await adminModerationCharterAccessBlocked(admin.discordId));

  if (charterBlocked && !options.isCharterEscapePath) {
    const [first] = charterEscapeModuleIds;
    if (first) {
      const target = buildModerationHref("staff", first.group, first.module);
      redirect(`${target}?charter=required`);
    }
  }

  const defaultView: ModerationView = canPilot ? "admin" : "staff";

  return {
    admin,
    defaultView,
    canPilot,
    isStaff,
    charterBlocked,
  };
}

/**
 * Garde réservé aux pages de pilotage admin (assignations, validations charte,
 * config, logs). Refuse les modérateurs simples.
 */
export async function requireModerationAdminAccess(
  options: ModerationGuardOptions = {},
): Promise<ModerationGuardResult> {
  const result = await requireModerationAccess(options);
  if (!result.canPilot) {
    redirect("/unauthorized");
  }
  return result;
}
