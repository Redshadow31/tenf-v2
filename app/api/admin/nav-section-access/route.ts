import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";
import { adminModerationCharterAccessBlocked } from "@/lib/adminModerationCharterGate";
import { isAdminPathAllowedDuringCharterBlock } from "@/lib/adminModerationCharterGatePaths";
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

    const [charterBlocked, advancedBypass] = await Promise.all([
      adminModerationCharterAccessBlocked(admin.discordId),
      hasAdvancedAdminAccess(admin.discordId),
    ]);

    if (advancedBypass) {
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
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[nav-section-access]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
