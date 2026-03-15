import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { staffOrgChartRepository } from "@/lib/repositories";
import type { OrgChartUpsertInput } from "@/lib/repositories/StaffOrgChartRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/gestion-acces/organigramme-staff";

type Params = { params: { entryId: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const entryId = String(params.entryId || "").trim();
    if (!entryId) {
      return NextResponse.json({ error: "entryId requis" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<OrgChartUpsertInput>;
    if (!body.memberId || !body.roleKey || !body.statusKey || !body.poleKey) {
      return NextResponse.json({ error: "memberId, roleKey, statusKey et poleKey sont requis" }, { status: 400 });
    }

    const entry = await staffOrgChartRepository.upsert({
      id: entryId,
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

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("[API admin/staff/org-chart/[entryId] PATCH] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const entryId = String(params.entryId || "").trim();
    if (!entryId) {
      return NextResponse.json({ error: "entryId requis" }, { status: 400 });
    }

    await staffOrgChartRepository.remove(entryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API admin/staff/org-chart/[entryId] DELETE] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
