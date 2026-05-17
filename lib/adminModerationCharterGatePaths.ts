/**
 * Chemins admin autorisés lorsque la charte modération bloque le reste (middleware Edge, sans DB).
 * @see lib/adminModerationCharterGate.ts pour la logique métier.
 * @see lib/moderation/moderationTree.ts pour la source unique (modules `charterEscapeModuleIds`).
 *
 * IMPORTANT : ce fichier est importé par le middleware Edge, donc il ne doit
 * pas importer de code Node-only (DB, blobs, fs). On dérive uniquement depuis
 * le tree statique.
 */
import { moderationCharterEscapePrefixes } from "@/lib/moderation/moderationTree";

export const ADMIN_CHARTER_ESCAPE_PATH_PREFIXES: readonly string[] =
  moderationCharterEscapePrefixes;

export function isAdminPathAllowedDuringCharterBlock(pathname: string): boolean {
  return ADMIN_CHARTER_ESCAPE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
