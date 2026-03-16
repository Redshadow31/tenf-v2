import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: NextRequest, { params }: { params: { declarationId: string } }) {
  try {
    const admin = await requireSectionAccess("/admin/engagement/raids-a-valider");
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const declarationId = String(params.declarationId || "");
    if (!declarationId) {
      return NextResponse.json({ error: "Identifiant declaration manquant" }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body?.status || "");
    const staffComment = String(body?.staffComment || "").trim();

    if (!["processing", "to_study", "validated", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("raid_declarations")
      .select("id")
      .eq("id", declarationId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Erreur verification declaration" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Declaration introuvable" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("raid_declarations")
      .update({
        status,
        staff_comment: staffComment || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.discordId || admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", declarationId)
      .select(
        "id,member_discord_id,member_twitch_login,member_display_name,target_twitch_login,raid_at,is_approximate,note,status,staff_comment,reviewed_at,reviewed_by,created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: "Impossible de mettre a jour la declaration" }, { status: 500 });
    }

    return NextResponse.json({ success: true, declaration: data });
  } catch (error) {
    console.error("[api/admin/engagement/raids-declarations/:id] PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { declarationId: string } }) {
  try {
    const admin = await requireSectionAccess("/admin/engagement/raids-a-valider");
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const canManage = await hasAdvancedAdminAccess(admin.discordId);
    if (!canManage) {
      return NextResponse.json({ error: "Acces reserve aux admins avances" }, { status: 403 });
    }

    const declarationId = String(params.declarationId || "");
    if (!declarationId) {
      return NextResponse.json({ error: "Identifiant declaration manquant" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("raid_declarations")
      .select("id")
      .eq("id", declarationId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Erreur verification declaration" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Declaration introuvable" }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from("raid_declarations").delete().eq("id", declarationId);
    if (error) {
      return NextResponse.json({ error: "Impossible de supprimer la declaration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/engagement/raids-declarations/:id] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

