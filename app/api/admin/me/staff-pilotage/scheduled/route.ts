import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { createScheduledItem, type StaffPilotageScheduledCategory } from "@/lib/staffPilotage";

export const dynamic = "force-dynamic";

const CATEGORIES: StaffPilotageScheduledCategory[] = [
  "integration_meeting",
  "action",
  "raid_window",
  "other",
];

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdvancedAdminAccess(admin.discordId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: {
    category?: string;
    title?: string;
    scheduledAt?: string | null;
    endsAt?: string | null;
    primaryDiscordId?: string | null;
    secondaryDiscordId?: string | null;
    status?: string;
    notes?: string | null;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const category = (body.category || "action") as StaffPilotageScheduledCategory;
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  try {
    const item = await createScheduledItem({
      category,
      title,
      scheduledAt: body.scheduledAt,
      endsAt: body.endsAt,
      primaryDiscordId: body.primaryDiscordId,
      secondaryDiscordId: body.secondaryDiscordId,
      status: body.status,
      notes: body.notes,
      sortOrder: body.sortOrder,
      updatedByDiscordId: admin.discordId,
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[staff-pilotage scheduled POST]", e);
    return NextResponse.json({ error: "Création impossible" }, { status: 500 });
  }
}
