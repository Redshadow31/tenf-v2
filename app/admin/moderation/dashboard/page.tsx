import { redirect } from "next/navigation";

/**
 * Alias historique de /admin/moderation.
 * Conservé pour rétrocompatibilité — l'URL canonique est /admin/moderation.
 */
export default function AdminModerationDashboardLegacyPage() {
  redirect("/admin/moderation");
}
