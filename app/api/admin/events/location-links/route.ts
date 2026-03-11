import { NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";
import { isValidHttpUrl } from "@/lib/eventLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("event_location_links")
      .select("id,name,url,is_active,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      links: (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    console.error("[API admin/events/location-links GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!name || !url) {
      return NextResponse.json({ error: "Nom et URL requis" }, { status: 400 });
    }
    if (!isValidHttpUrl(url)) {
      return NextResponse.json({ error: "URL invalide (http/https uniquement)" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("event_location_links")
      .insert({
        name,
        url,
        is_active: body?.isActive ?? true,
        created_by: admin.discordId,
      })
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
    console.error("[API admin/events/location-links POST] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
