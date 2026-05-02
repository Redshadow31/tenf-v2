import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import {
  createStaffAnnouncement,
  listActiveStaffAnnouncements,
  type DbAnnouncementAudience,
} from "@/lib/staffAnnouncements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const rawAudience = request.nextUrl.searchParams.get("audience");
    const filter =
      rawAudience === "staff"
        ? { audience: "staff" as const }
        : rawAudience === "community"
          ? { audience: "community" as const }
          : undefined;

    const items = await listActiveStaffAnnouncements(80, filter);
    const canManageAnnouncements = !!(await requireAdvancedAdminAccess());

    return NextResponse.json({ items, canManageAnnouncements });
  } catch (e) {
    console.error("[staff-announcements] GET:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const advanced = await requireAdvancedAdminAccess();
  if (!advanced) {
    return NextResponse.json(
      { error: "Publication réservée aux administrateurs avancés." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title : "";
    const message = typeof body?.message === "string" ? body.message : "";
    const link = typeof body?.link === "string" ? body.link.trim() || null : null;
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() || null : null;
    const sendDiscordDm = body?.sendDiscordDm === true;
    const audienceRaw = body?.audience === "community" ? "community" : "staff";
    const audience = audienceRaw as DbAnnouncementAudience;

    const created = await createStaffAnnouncement({
      title,
      body: message,
      link,
      imageUrl,
      audience,
      authorDiscordId: advanced.discordId,
      authorDisplayName: advanced.username,
      sendDiscordDm,
    });

    return NextResponse.json({ ok: true, announcement: created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[staff-announcements] POST:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
