import { NextResponse } from "next/server";
import { getAllAdminIdsFromCache, loadAdminAccessCache } from "@/lib/adminAccessCache";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { generateMeetingCrMarkdown } from "@/lib/staff/generateMeetingCrMarkdown";
import { staffMeetingCrInboxRepository, staffMonthlyMeetingRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/gestion-acces/reunions-staff-mensuelles";

type RouteCtx = { params: { meetingId: string } };

export async function POST(request: Request, { params }: RouteCtx) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const meetingId = String(params.meetingId || "").trim();
    if (!meetingId) {
      return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
    }

    const body = (await request.json()) as { recipientDiscordIds?: unknown };
    const rawIds = Array.isArray(body?.recipientDiscordIds) ? body.recipientDiscordIds : [];
    const recipientDiscordIds = rawIds
      .map((id) => String(id || "").trim())
      .filter((id) => id.length > 0);
    const uniqueRecipients = [...new Set(recipientDiscordIds)];

    if (uniqueRecipients.length === 0) {
      return NextResponse.json({ error: "Selectionne au moins un destinataire" }, { status: 400 });
    }

    await loadAdminAccessCache();
    const allowed = new Set(getAllAdminIdsFromCache());
    const invalid = uniqueRecipients.filter((id) => !allowed.has(id));
    if (invalid.length > 0) {
      return NextResponse.json({ error: "Destinataire non reconnu comme acces admin" }, { status: 400 });
    }

    const meeting = await staffMonthlyMeetingRepository.getById(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const stored = (meeting.compteRendu ?? "").trim();
    const bodyMarkdown = stored
      ? stored
      : generateMeetingCrMarkdown({
          meetingDate: meeting.meetingDate,
          title: meeting.title,
          discours: meeting.discours,
        }).trim();

    if (!bodyMarkdown) {
      return NextResponse.json(
        { error: "Aucun contenu a envoyer : ajoute un compte-rendu enregistre ou du contenu dans les discours" },
        { status: 400 },
      );
    }

    const sentBy = writeAdmin.discordId || sectionAdmin.discordId || "admin";
    await staffMeetingCrInboxRepository.insertMany(
      uniqueRecipients.map((recipientDiscordId) => ({
        meetingId,
        recipientDiscordId,
        bodyMarkdown,
        sentBy,
      })),
    );

    return NextResponse.json({ success: true, sentCount: uniqueRecipients.length });
  } catch (error) {
    console.error("[API admin/staff/monthly-meetings/.../send-cr POST] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
