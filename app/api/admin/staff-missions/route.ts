import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import type { AdminRole } from "@/lib/adminRoles";
import { createStaffMission, listStaffMissionsForAssignee } from "@/lib/staffMissionAssignments";

export const dynamic = "force-dynamic";

function canManageStaffMissions(role: AdminRole): boolean {
  return role === "FONDATEUR" || role === "ADMIN_COORDINATEUR";
}

/**
 * GET — missions nominatives pour un Discord ID (soi-même, ou tout staff si coordinateur / fondateur).
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const requested = request.nextUrl.searchParams.get("assigneeDiscordId")?.trim() || admin.discordId;
  if (requested !== admin.discordId && !canManageStaffMissions(admin.role)) {
    return NextResponse.json({ error: "Tu ne peux consulter que tes propres missions." }, { status: 403 });
  }

  try {
    const missions = await listStaffMissionsForAssignee(requested);
    return NextResponse.json({
      missions: missions.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        sortOrder: m.sortOrder,
        assigneeDiscordId: m.assigneeDiscordId,
        updatedAt: m.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[staff-missions GET]", e);
    return NextResponse.json({ error: "Impossible de charger les missions." }, { status: 500 });
  }
}

/**
 * POST — ajoute une mission (fondateur ou admin coordinateur uniquement).
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageStaffMissions(admin.role)) {
    return NextResponse.json(
      { error: "Réservé aux fondateurs et admins coordinateurs." },
      { status: 403 }
    );
  }

  let body: {
    assigneeDiscordId?: string;
    title?: string;
    description?: string | null;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const assigneeDiscordId = typeof body.assigneeDiscordId === "string" ? body.assigneeDiscordId.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!assigneeDiscordId || !title) {
    return NextResponse.json({ error: "assigneeDiscordId et title sont requis." }, { status: 400 });
  }

  try {
    const created = await createStaffMission({
      assigneeDiscordId,
      title,
      description: body.description,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      updatedByDiscordId: admin.discordId,
    });
    return NextResponse.json({
      mission: {
        id: created.id,
        title: created.title,
        description: created.description,
        sortOrder: created.sortOrder,
        assigneeDiscordId: created.assigneeDiscordId,
      },
    });
  } catch (e) {
    console.error("[staff-missions POST]", e);
    return NextResponse.json({ error: "Création impossible (table absente ou erreur base)." }, { status: 500 });
  }
}
