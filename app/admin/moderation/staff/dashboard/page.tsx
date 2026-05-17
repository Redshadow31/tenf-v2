import { redirect } from "next/navigation";

/**
 * Alias historique de /admin/moderation/staff.
 * Conservé pour rétrocompatibilité — l'URL canonique est /admin/moderation/staff.
 */
export default function AdminModerationStaffDashboardLegacyPage() {
  redirect("/admin/moderation/staff");
}
