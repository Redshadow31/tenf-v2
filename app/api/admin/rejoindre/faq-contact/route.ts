import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { listFaqContacts, updateFaqContact, type FaqContactStatus } from "@/lib/faqContactStorage";

const ALLOWED_STATUS: Set<FaqContactStatus> = new Set(["new", "in_progress", "resolved", "archived"]);

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const messages = await listFaqContacts();
    const stats = {
      total: messages.length,
      new: messages.filter((m) => m.status === "new").length,
      inProgress: messages.filter((m) => m.status === "in_progress").length,
      resolved: messages.filter((m) => m.status === "resolved").length,
      archived: messages.filter((m) => m.status === "archived").length,
    };

    return NextResponse.json({ messages, stats });
  } catch (error) {
    console.error("[admin/rejoindre/faq-contact] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = typeof body?.status === "string" ? (body.status as FaqContactStatus) : undefined;
    const adminNote = typeof body?.adminNote === "string" ? body.adminNote : undefined;

    if (!id) {
      return NextResponse.json({ error: "ID requis." }, { status: 400 });
    }
    if (status && !ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const updated = await updateFaqContact(id, {
      status,
      adminNote,
      handledBy: admin.username || admin.discordId,
    });

    if (!updated) {
      return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: updated });
  } catch (error) {
    console.error("[admin/rejoindre/faq-contact] PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

