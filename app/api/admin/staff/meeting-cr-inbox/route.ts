import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { staffMeetingCrInboxRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifie ou acces refuse" }, { status: 401 });
    }

    const discordId = String(admin.discordId || "").trim();
    if (!discordId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const items = await staffMeetingCrInboxRepository.listForRecipient(discordId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("[API admin/staff/meeting-cr-inbox GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
