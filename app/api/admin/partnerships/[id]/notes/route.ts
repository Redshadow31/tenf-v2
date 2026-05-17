import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import {
  addPartnershipRequestNote,
  getPartnershipRequest,
} from "@/lib/partnershipRequestsStorage";

export const dynamic = "force-dynamic";

const SECTION = "/admin/partenariats";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTE_MIN = 2;
const NOTE_MAX = 4000;

/** POST /api/admin/partnerships/[id]/notes : ajoute une note interne. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireSectionAccess(SECTION);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!params?.id || !UUID_RE.test(params.id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const note = String((body as Record<string, unknown>).note || "").trim();
    if (note.length < NOTE_MIN) {
      return NextResponse.json(
        { error: `La note doit contenir au moins ${NOTE_MIN} caractères.` },
        { status: 400 }
      );
    }
    if (note.length > NOTE_MAX) {
      return NextResponse.json(
        { error: `La note ne doit pas dépasser ${NOTE_MAX} caractères.` },
        { status: 400 }
      );
    }

    // Vérifie que la demande existe (et que l'admin ne crée pas une note orpheline).
    const existing = await getPartnershipRequest(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    const created = await addPartnershipRequestNote({
      requestId: params.id,
      author: admin.username || admin.discordId,
      note: note.slice(0, NOTE_MAX),
    });

    return NextResponse.json({ ok: true, note: created });
  } catch (error) {
    console.error("[admin/partnerships] POST note error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'ajout de la note." },
      { status: 500 }
    );
  }
}
