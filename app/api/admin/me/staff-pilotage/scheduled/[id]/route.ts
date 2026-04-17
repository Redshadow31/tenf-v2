import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { deleteScheduledItem, updateScheduledItem, type StaffPilotageScheduledCategory } from "@/lib/staffPilotage";

export const dynamic = "force-dynamic";

const CATEGORIES: StaffPilotageScheduledCategory[] = [
  "integration_meeting",
  "action",
  "raid_window",
  "other",
];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdvancedAdminAccess(admin.discordId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const patch: Parameters<typeof updateScheduledItem>[1] = {
    updatedByDiscordId: admin.discordId,
  };

  if (typeof body.category === "string" && CATEGORIES.includes(body.category as StaffPilotageScheduledCategory)) {
    patch.category = body.category as StaffPilotageScheduledCategory;
  }
  if (typeof body.title === "string") patch.title = body.title;
  if ("scheduledAt" in body) patch.scheduledAt = body.scheduledAt as string | null | undefined;
  if ("endsAt" in body) patch.endsAt = body.endsAt as string | null | undefined;
  if ("primaryDiscordId" in body) patch.primaryDiscordId = body.primaryDiscordId as string | null | undefined;
  if ("secondaryDiscordId" in body) patch.secondaryDiscordId = body.secondaryDiscordId as string | null | undefined;
  if (typeof body.status === "string") patch.status = body.status;
  if ("notes" in body) patch.notes = body.notes as string | null | undefined;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;

  try {
    const item = await updateScheduledItem(id, patch);
    if (!item) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[staff-pilotage scheduled PATCH]", e);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdvancedAdminAccess(admin.discordId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  try {
    await deleteScheduledItem(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[staff-pilotage scheduled DELETE]", e);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
