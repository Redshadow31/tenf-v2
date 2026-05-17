import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";

/**
 * Layout serveur du Centre de modération.
 *
 * Pourquoi un guard ici alors que /admin a déjà un middleware ?
 * - Le middleware exige une session Discord mais ne vérifie pas le ROLE
 *   admin/staff. Sans ce layout, un utilisateur Discord quelconque connecté
 *   pouvait charger le squelette UI des pages /admin/moderation/**.
 * - On vérifie ici uniquement le rôle (defense in depth) — le gate charte
 *   reste géré côté middleware (Edge, sans DB) pour éviter une double
 *   redirection vers la charte.
 *
 * Rôles acceptés : tout rôle staff TENF (fondateur, admin coordinateur,
 * modérateur, modérateur en formation, modérateur en pause, soutien).
 */

const STAFF_ROLES = new Set([
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
  "MODERATEUR",
  "MODERATEUR_EN_FORMATION",
  "MODERATEUR_EN_PAUSE",
  "SOUTIEN_TENF",
]);

export default async function ModerationLayout({ children }: { children: ReactNode }) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/api/auth/signin?callbackUrl=/admin/moderation");
  }
  if (!STAFF_ROLES.has(admin.role)) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
