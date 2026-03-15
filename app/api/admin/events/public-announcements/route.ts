import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";
import { isValidHttpUrl } from "@/lib/eventLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CATEGORY = "Soirée Film";

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = normalizeString(searchParams.get("category")) || DEFAULT_CATEGORY;

    const { data, error } = await supabaseAdmin
      .from("event_category_public_announcements")
      .select("id,category,title,description,image,cta_label,cta_url,is_active,updated_at")
      .eq("category", category)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      announcement: data
        ? {
            id: data.id,
            category: data.category,
            title: data.title,
            description: data.description || "",
            image: data.image || "",
            ctaLabel: data.cta_label || "",
            ctaUrl: data.cta_url || "",
            isActive: data.is_active ?? true,
            updatedAt: data.updated_at || null,
          }
        : null,
    });
  } catch (error) {
    console.error("[API admin/events/public-announcements GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = await request.json();
    const category = normalizeString(body?.category) || DEFAULT_CATEGORY;
    const title = normalizeString(body?.title);
    const description = normalizeString(body?.description);
    const image = normalizeString(body?.image);
    const ctaLabel = normalizeString(body?.ctaLabel);
    const ctaUrl = normalizeString(body?.ctaUrl);
    const isActive = body?.isActive !== false;

    if (!title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }
    if (ctaUrl && !isValidHttpUrl(ctaUrl)) {
      return NextResponse.json({ error: "Lien CTA invalide (http/https)" }, { status: 400 });
    }
    if (image && !isValidHttpUrl(image) && !image.startsWith("/")) {
      return NextResponse.json({ error: "Image invalide (URL http/https ou chemin interne)" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("event_category_public_announcements")
      .upsert(
        {
          category,
          title,
          description,
          image: image || null,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          is_active: isActive,
          updated_by: admin.discordId,
        },
        { onConflict: "category" }
      )
      .select("id,category,title,description,image,cta_label,cta_url,is_active,updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      announcement: {
        id: data.id,
        category: data.category,
        title: data.title,
        description: data.description || "",
        image: data.image || "",
        ctaLabel: data.cta_label || "",
        ctaUrl: data.cta_url || "",
        isActive: data.is_active ?? true,
        updatedAt: data.updated_at || null,
      },
    });
  } catch (error) {
    console.error("[API admin/events/public-announcements PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
