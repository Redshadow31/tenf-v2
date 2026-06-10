import { NextRequest, NextResponse } from "next/server";
import { getAllAuditLogs } from "@/lib/adminAudit";
import {
  buildFullMemberChangeLog,
  countByCategory,
} from "@/lib/admin/members-fiche/memberChangeLog";
import { resolveMemberForFiche } from "@/lib/admin/members-fiche/resolveMemberForFiche";
import { requirePermission } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * GET — Journal unifié des changements membre (identité, profil, rôle, statut, notes, admin).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
    }

    const decodedId = decodeURIComponent(params.id || "").trim();
    if (!decodedId) {
      return NextResponse.json({ error: "Identifiant membre requis" }, { status: 400 });
    }

    const member = await resolveMemberForFiche(decodedId);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const auditLogs = await getAllAuditLogs({
      resourceType: "member",
      limit: 2500,
    });

    const entries = buildFullMemberChangeLog({
      storedIdentityHistory: member.identityHistory,
      roleHistory: member.roleHistory,
      auditLogs,
      twitchLogin: member.twitchLogin,
      discordId: member.discordId,
      twitchId: member.twitchId,
    });

    return NextResponse.json({
      success: true,
      member: {
        twitchLogin: member.twitchLogin || null,
        discordId: member.discordId || null,
        twitchId: member.twitchId || null,
        displayName: member.displayName || member.siteUsername || null,
      },
      entries,
      counts: countByCategory(entries),
      total: entries.length,
    });
  } catch (error) {
    console.error("[member-logs] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur chargement journal membre" },
      { status: 500 }
    );
  }
}
