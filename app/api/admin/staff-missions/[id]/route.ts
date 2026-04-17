import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import type { AdminRole } from "@/lib/adminRoles";
import { deleteStaffMission, updateStaffMission } from "@/lib/staffMissionAssignments";

export const dynamic = "force-dynamic";

function canManageStaffMissions(role: AdminRole): boolean {
  return role === "FONDATEUR" || role === "ADMIN_COORDINATEUR";
}

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * PATCH — met à jour une mission (titre, description, ordre).
 */
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageStaffMissions(admin.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  let body: { title?: string; description?: string | null; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    const updated = await updateStaffMission(id, {
      title: body.title,
      description: body.description,
      sortOrder: body.sortOrder,
      updatedByDiscordId: admin.discordId,
    });
    if (!updated) {
      return NextResponse.json({ error: "Mission introuvable." }, { status: 404 });
    }
    return NextResponse.json({
      mission: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        sortOrder: updated.sortOrder,
      },
    });
  } catch (e) {
    console.error("[staff-missions PATCH]", e);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
}

/**
 * DELETE — supprime une mission.
 */
export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageStaffMissions(admin.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  try {
    await deleteStaffMission(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[staff-missions DELETE]", e);
    return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
  }
}
