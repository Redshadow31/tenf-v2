import { NextRequest, NextResponse } from "next/server";
import { updateAventuraInterestReview } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = params.id;
    const isReviewed = body?.is_reviewed;
    const adminNote = body?.admin_note;

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const ok = await updateAventuraInterestReview(id, {
      is_reviewed: typeof isReviewed === "boolean" ? isReviewed : undefined,
      admin_note: typeof adminNote === "string" ? adminNote : undefined,
    });

    if (!ok) {
      return NextResponse.json({ error: "Réponse introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/new-family-aventura/interest/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

