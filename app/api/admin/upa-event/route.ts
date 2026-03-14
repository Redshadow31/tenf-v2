import { NextResponse } from "next/server";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { upaEventRepository } from "@/lib/repositories/UpaEventRepository";
import type { UpaEventContent } from "@/lib/upaEvent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/upa-event";

export async function GET() {
  try {
    const admin = await requireSectionAccess(ADMIN_SECTION);
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const content = await upaEventRepository.getContent("upa-event");
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API admin/upa-event GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const body = await request.json();
    const incomingContent = body?.content as UpaEventContent | undefined;

    if (!incomingContent || typeof incomingContent !== "object") {
      return NextResponse.json({ error: "Payload invalide: content requis" }, { status: 400 });
    }

    const content = await upaEventRepository.upsertContent(
      "upa-event",
      incomingContent,
      writeAdmin.discordId
    );

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API admin/upa-event PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
