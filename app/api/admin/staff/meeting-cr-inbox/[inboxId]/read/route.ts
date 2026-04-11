import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { staffMeetingCrInboxRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: { inboxId: string } };

export async function PATCH(_request: Request, { params }: RouteCtx) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifie ou acces refuse" }, { status: 401 });
    }

    const discordId = String(admin.discordId || "").trim();
    const inboxId = String(params.inboxId || "").trim();
    if (!inboxId || !discordId) {
      return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
    }

    const ok = await staffMeetingCrInboxRepository.markRead(inboxId, discordId);
    if (!ok) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API admin/staff/meeting-cr-inbox/[id]/read PATCH] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
