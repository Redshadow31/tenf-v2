import { NextResponse } from "next/server";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { staffOrgChartRepository } from "@/lib/repositories";
import type { OrgChartUpsertInput } from "@/lib/repositories/StaffOrgChartRepository";
import { syncMembersTableRoleFromOrgChart } from "@/lib/staff/syncMembersTableRoleFromOrgChart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/gestion-acces/organigramme-staff";

export async function GET() {
  try {
    const admin = await requireSectionAccess(ADMIN_SECTION);
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const entries = await staffOrgChartRepository.listAll(true);
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("[API admin/staff/org-chart GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const body = (await request.json()) as Partial<OrgChartUpsertInput>;
    if (!body?.memberId) {
      return NextResponse.json({ error: "memberId requis" }, { status: 400 });
    }
    if (!body.roleKey || !body.statusKey) {
      return NextResponse.json({ error: "roleKey et statusKey sont requis" }, { status: 400 });
    }
    if (body.roleKey !== "SOUTIEN_TENF" && !body.poleKey) {
      return NextResponse.json({ error: "poleKey est requis pour ce role" }, { status: 400 });
    }

    const entry = await staffOrgChartRepository.upsert({
      id: body.id,
      memberId: body.memberId,
      roleKey: body.roleKey,
      roleLabel: body.roleLabel,
      statusKey: body.statusKey,
      statusLabel: body.statusLabel,
      poleKey: body.poleKey,
      poleLabel: body.poleLabel,
      secondaryPoleKeys: body.secondaryPoleKeys,
      bioShort: body.bioShort,
      displayOrder: body.displayOrder,
      isVisible: body.isVisible,
      isArchived: body.isArchived,
    });

    const roleSync = await syncMembersTableRoleFromOrgChart({
      memberId: body.memberId,
      roleKey: body.roleKey,
      actorDiscordId: sectionAdmin.discordId,
    });

    return NextResponse.json({ success: true, entry, memberRoleSynced: roleSync.updated });
  } catch (error) {
    console.error("[API admin/staff/org-chart POST] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
