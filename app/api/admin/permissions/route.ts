import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, requireRole, type AuthenticatedAdmin } from "@/lib/requireAdmin";
import { ADMIN_ROLE_ORDER, normalizeAdminRole, type AdminRole } from "@/lib/adminRoles";
import { resetSectionPermissionsCache } from "@/lib/sectionPermissions";

/** Aligné sur /api/admin/access : en dev, bypass fondateur sauf ENABLE_DEV_AUTH="false" */
const DEV_AUTH_RELAXED =
  process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_AUTH !== "false";

const DEV_MOCK_FOUNDER: AuthenticatedAdmin = {
  id: process.env.DEV_BYPASS_DISCORD_ID || "333001130705420299",
  discordId: process.env.DEV_BYPASS_DISCORD_ID || "333001130705420299",
  username: process.env.DEV_BYPASS_USERNAME || "Dev Fondateur",
  avatar: null,
  role: "FONDATEUR",
};

async function requireFounderOrDevRelaxedBypass(): Promise<AuthenticatedAdmin | null> {
  const founder = await requireRole("FONDATEUR");
  if (founder) return founder;
  if (!DEV_AUTH_RELAXED) return null;
  return DEV_MOCK_FOUNDER;
}

/** Préfère l’ID Discord de la session réelle pour l’audit (ex. Clara en local). */
async function resolveAuditDiscordId(fallbackDiscordId: string): Promise<string> {
  try {
    const actor = await getAuthenticatedAdmin();
    const id = actor?.discordId?.trim();
    if (id) return id;
  } catch {
    /* ignore */
  }
  return fallbackDiscordId;
}

export const dynamic = 'force-dynamic';

interface SectionPermission {
  href: string;
  label: string;
  roles: AdminRole[];
  supportDiscordIds?: string[];
  extraDiscordIds?: string[];
}

interface PermissionsData {
  sections: Record<string, SectionPermission>;
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * GET - Récupère les permissions des sections du dashboard
 * Réservé aux fondateurs uniquement
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireFounderOrDevRelaxedBypass();
    if (!admin) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent accéder à cette ressource." },
        { status: 403 }
      );
    }

    // Charger les permissions depuis Blobs
    try {
      const { getBlobStore } = await import("@/lib/memberData");
      const store = getBlobStore("tenf-admin-permissions");
      const stored = await store.get("dashboard-permissions");

      if (stored) {
        const permissionsData: PermissionsData = JSON.parse(stored);
        Object.values(permissionsData.sections || {}).forEach((section) => {
          section.roles = (section.roles || [])
            .map((role) => normalizeAdminRole(role as unknown as string))
            .filter((role): role is AdminRole => role !== null);
          if (Array.isArray(section.supportDiscordIds)) {
            section.supportDiscordIds = section.supportDiscordIds.map((id) => String(id).trim()).filter(Boolean);
          }
          if (Array.isArray(section.extraDiscordIds)) {
            section.extraDiscordIds = section.extraDiscordIds.map((id) => String(id).trim()).filter(Boolean);
          }
        });
        return NextResponse.json({
          success: true,
          permissions: permissionsData,
        });
      }
    } catch (error) {
      console.warn("[Permissions API] Cannot load from Blobs, using defaults:", error);
    }

    // Retourner des permissions par défaut (toutes les sections accessibles à tous)
    return NextResponse.json({
      success: true,
      permissions: {
        sections: {},
        // Pas de restrictions par défaut
      },
    });
  } catch (error: any) {
    console.error("[Permissions API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur lors de la récupération des permissions" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour les permissions des sections du dashboard
 * Réservé aux fondateurs uniquement
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireFounderOrDevRelaxedBypass();
    if (!admin) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent modifier les permissions." },
        { status: 403 }
      );
    }

    const auditDiscordId = await resolveAuditDiscordId(admin.discordId);
    const auditActor = await getAuthenticatedAdmin();
    const auditUsername = auditActor?.username?.trim() || admin.username;

    const body = await request.json();
    const { permissions } = body;

    if (!permissions || !permissions.sections) {
      return NextResponse.json(
        { error: "Données invalides. Format attendu: { permissions: { sections: {...} } }" },
        { status: 400 }
      );
    }

    // Valider la structure des permissions
    const sections = permissions.sections;
    for (const [href, section] of Object.entries(sections)) {
      const sectionPerm = section as SectionPermission;
      if (!sectionPerm.href || !sectionPerm.label || !Array.isArray(sectionPerm.roles)) {
        return NextResponse.json(
          { error: `Format invalide pour la section ${href}. Format attendu: { href, label, roles: AdminRole[] }` },
          { status: 400 }
        );
      }

      if (
        sectionPerm.supportDiscordIds !== undefined &&
        !Array.isArray(sectionPerm.supportDiscordIds)
      ) {
        return NextResponse.json(
          { error: `supportDiscordIds invalide pour la section ${href}. Format attendu: string[]` },
          { status: 400 }
        );
      }

      // Normaliser et valider les rôles (compatibilité anciens codes)
      sectionPerm.roles = sectionPerm.roles
        .map((role) => normalizeAdminRole(role as unknown as string))
        .filter((role): role is AdminRole => role !== null);

      // Valider que tous les rôles sont valides
      const validRoles: AdminRole[] = ADMIN_ROLE_ORDER;
      for (const role of sectionPerm.roles) {
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: `Rôle invalide "${role}" pour la section ${href}. Rôles valides: ${validRoles.join(", ")}` },
            { status: 400 }
          );
        }
      }

      if (Array.isArray(sectionPerm.supportDiscordIds)) {
        const invalidIds = sectionPerm.supportDiscordIds.filter(
          (id) => typeof id !== "string" || !id.trim()
        );
        if (invalidIds.length > 0) {
          return NextResponse.json(
            { error: `supportDiscordIds contient des valeurs invalides pour la section ${href}` },
            { status: 400 }
          );
        }
      }

      if (
        sectionPerm.extraDiscordIds !== undefined &&
        !Array.isArray(sectionPerm.extraDiscordIds)
      ) {
        return NextResponse.json(
          { error: `extraDiscordIds invalide pour la section ${href}. Format attendu: string[]` },
          { status: 400 }
        );
      }

      if (Array.isArray(sectionPerm.extraDiscordIds)) {
        const invalidExtra = sectionPerm.extraDiscordIds.filter(
          (id) => typeof id !== "string" || !/^\d{15,22}$/.test(id.trim())
        );
        if (invalidExtra.length > 0) {
          return NextResponse.json(
            { error: `extraDiscordIds contient des IDs Discord invalides pour la section ${href}` },
            { status: 400 }
          );
        }
        sectionPerm.extraDiscordIds = sectionPerm.extraDiscordIds.map((id) => id.trim());
      }
    }

    // Sauvegarder dans Blobs
    try {
      const { getBlobStore } = await import("@/lib/memberData");
      const store = getBlobStore("tenf-admin-permissions");

      const permissionsData: PermissionsData = {
        sections: sections,
        lastUpdated: new Date().toISOString(),
        updatedBy: auditDiscordId,
      };

      await store.set("dashboard-permissions", JSON.stringify(permissionsData));
      resetSectionPermissionsCache();

      // Logger l'action
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "UPDATE_PERMISSIONS",
            target: "dashboard-permissions",
            metadata: {
              updatedBy: auditDiscordId,
              updatedByUsername: auditUsername,
              sectionsCount: Object.keys(sections).length,
            },
          }),
        });
      } catch (logError) {
        console.warn("[Permissions API] Could not log action:", logError);
      }

      return NextResponse.json({
        success: true,
        message: "Permissions mises à jour avec succès",
        permissions: permissionsData,
      });
    } catch (error: any) {
      console.error("[Permissions API] Error saving to Blobs:", error);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde des permissions" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Permissions API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur lors de la mise à jour des permissions" },
      { status: 500 }
    );
  }
}
