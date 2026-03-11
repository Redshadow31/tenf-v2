import { NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";
import { isValidHttpUrl } from "@/lib/eventLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { linkId: string } }
) {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
      }
      updates.name = name;
    }

    if (typeof body?.url === "string") {
      const url = body.url.trim();
      if (!isValidHttpUrl(url)) {
        return NextResponse.json({ error: "URL invalide (http/https uniquement)" }, { status: 400 });
      }
      updates.url = url;
    }

    if (typeof body?.isActive === "boolean") {
      updates.is_active = body.isActive;
    }

    const { data, error } = await supabaseAdmin
      .from("event_location_links")
      .update(updates)
      .eq("id", params.linkId)
      .select("id,name,url,is_active,created_at,updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      link: {
        id: data.id,
        name: data.name,
        url: data.url,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("[API admin/events/location-links/:id PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { linkId: string } }
) {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("event_location_links")
      .delete()
      .eq("id", params.linkId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API admin/events/location-links/:id DELETE] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
