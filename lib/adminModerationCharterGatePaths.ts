/**
 * Chemins admin autorisés lorsque la charte modération bloque le reste (middleware Edge, sans DB).
 * @see lib/adminModerationCharterGate.ts pour la logique métier.
 */
export const ADMIN_CHARTER_ESCAPE_PATH_PREFIXES = [
  "/admin/moderation/staff/info/charte",
  "/admin/moderation/staff/info/validation-charte",
] as const;

export function isAdminPathAllowedDuringCharterBlock(pathname: string): boolean {
  return ADMIN_CHARTER_ESCAPE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
