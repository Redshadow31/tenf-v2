import { NextResponse } from "next/server";
import { deleteAventuraInspirationItem, updateAventuraInspirationItem } from "@/lib/newFamilyAventuraStorage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

    const body = await request.json();
    const updates: {
      title?: string;
      category?: string;
      description?: string;
      image_url?: string;
      is_published?: boolean;
      is_archived?: boolean;
    } = {};

    if (typeof body?.title === "string") updates.title = body.title;
    if (typeof body?.category === "string") updates.category = body.category;
    if (typeof body?.description === "string") updates.description = body.description;
    if (typeof body?.image_url === "string") {
      if (!/^https?:\/\//i.test(body.image_url.trim())) {
        return NextResponse.json({ error: "URL image invalide." }, { status: 400 });
      }
      updates.image_url = body.image_url;
    }
    if (typeof body?.is_published === "boolean") updates.is_published = body.is_published;
    if (typeof body?.is_archived === "boolean") updates.is_archived = body.is_archived;

    const item = await updateAventuraInspirationItem(id, updates);
    if (!item) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[api/new-family-aventura/inspiration/:id] PATCH error:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour cette image." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    const removed = await deleteAventuraInspirationItem(id);
    if (!removed) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/new-family-aventura/inspiration/:id] DELETE error:", error);
    return NextResponse.json({ error: "Impossible de supprimer cette image." }, { status: 500 });
  }
}
