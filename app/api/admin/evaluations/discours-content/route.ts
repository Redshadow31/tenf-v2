import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  DiscoursPartKey,
  loadDiscoursContent,
  updateDiscoursPartContent,
} from "@/lib/discoursStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PARTS: DiscoursPartKey[] = ["partie-1", "partie-2", "partie-3", "partie-4"];

function isValidPart(value: string | null): value is DiscoursPartKey {
  return Boolean(value && VALID_PARTS.includes(value as DiscoursPartKey));
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const store = await loadDiscoursContent();
    const part = request.nextUrl.searchParams.get("part");

    if (isValidPart(part)) {
      return NextResponse.json({ part, content: store[part] });
    }

    return NextResponse.json({ content: store });
  } catch (error) {
    console.error("[API discours-content][GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const part = typeof body?.part === "string" ? body.part : null;
    if (!isValidPart(part)) {
      return NextResponse.json({ error: "Partie invalide" }, { status: 400 });
    }

    const points = typeof body?.points === "string" ? body.points : "";
    const discours = typeof body?.discours === "string" ? body.discours : "";
    const conseils = typeof body?.conseils === "string" ? body.conseils : "";

    const updated = await updateDiscoursPartContent(
      part,
      { points, discours, conseils },
      admin.discordId || "admin",
    );

    return NextResponse.json({ success: true, part, content: updated[part] });
  } catch (error) {
    console.error("[API discours-content][PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
