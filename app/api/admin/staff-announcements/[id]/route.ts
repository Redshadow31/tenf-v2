import { NextRequest, NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { updateStaffAnnouncement } from "@/lib/staffAnnouncements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const advanced = await requireAdvancedAdminAccess();
  if (!advanced) {
    return NextResponse.json(
      { error: "Action réservée aux administrateurs avancés." },
      { status: 403 },
    );
  }

  const announcementId = typeof params?.id === "string" ? params.id.trim() : "";
  if (!announcementId) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const patch: {
      title?: string;
      body?: string;
      link?: string | null;
      imageUrl?: string | null;
      isActive?: boolean;
    } = {};

    if (typeof body?.title === "string") patch.title = body.title;
    if (typeof body?.message === "string") patch.body = body.message;
    if (body?.link === null) patch.link = null;
    else if (typeof body?.link === "string") patch.link = body.link;
    if (body?.imageUrl === null) patch.imageUrl = null;
    else if (typeof body?.imageUrl === "string") patch.imageUrl = body.imageUrl;
    if (typeof body?.isActive === "boolean") patch.isActive = body.isActive;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    await updateStaffAnnouncement(announcementId, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[staff-announcements/:id] PATCH:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
