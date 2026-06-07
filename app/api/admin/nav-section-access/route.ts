import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";
import { adminModerationCharterAccessBlocked } from "@/lib/adminModerationCharterGate";
import { isAdminPathAllowedDuringCharterBlock } from "@/lib/adminModerationCharterGatePaths";
import { getDevAdminRolePreview, isDevAdminRolePreviewActive } from "@/lib/admin/devRolePreview";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { loadSectionPermissionsCache, hasSectionAccess } from "@/lib/sectionPermissions";
import { allAdminNavHrefsUnion } from "@/lib/admin/navigation";

export const dynamic = "force-dynamic";

/**
 * Liste des href de menu autorisés pour l’admin connecté (permissions par section + charte).
 * Utilisé par la TopBar / Sidebar pour masquer les pages sans accès.
 */
export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [charterBlocked, advancedBypass, previewActive] = await Promise.all([
      adminModerationCharterAccessBlocked(admin.discordId),
      hasAdvancedAdminAccess(admin.discordId),
      isDevAdminRolePreviewActive(),
    ]);

    const previewRole = previewActive ? await getDevAdminRolePreview() : null;

    if (advancedBypass && !previewActive) {
      return NextResponse.json({ bypass: true, allowedHrefs: null });
    }

    await loadSectionPermissionsCache();
    const allHrefs = allAdminNavHrefsUnion();
    const allowedHrefs = allHrefs.filter((href) => {
      if (charterBlocked && !isAdminPathAllowedDuringCharterBlock(href)) {
        return false;
      }
      return hasSectionAccess(href, admin.role, admin.discordId);
    });

    return NextResponse.json({
      bypass: false,
      allowedHrefs,
      devRolePreview: previewRole,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[nav-section-access]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
