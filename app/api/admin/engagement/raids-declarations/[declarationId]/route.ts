import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeLogin(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

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
    const targetTwitchLoginRaw = body?.targetTwitchLogin;
    const targetTwitchLogin =
      typeof targetTwitchLoginRaw === "string" && targetTwitchLoginRaw.trim().length > 0
        ? targetTwitchLoginRaw.trim().toLowerCase()
        : null;

    if (status && !["processing", "to_study", "validated", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    if (!status && !targetTwitchLogin) {
      return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("raid_declarations")
      .select("id,member_twitch_login,target_twitch_login,raid_at,staff_comment")
      .eq("id", declarationId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Erreur verification declaration" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Declaration introuvable" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let autoRejectedAlreadyCounted = false;
    let autoRejectedMessage = "";

    if (status === "validated") {
      const fromLogin = normalizeLogin(existing.member_twitch_login);
      const toLogin = normalizeLogin(targetTwitchLogin || existing.target_twitch_login);
      const raidDate = new Date(String(existing.raid_at || ""));
      const canCheckDuplicate = Boolean(fromLogin && toLogin) && !Number.isNaN(raidDate.getTime());

      if (canCheckDuplicate) {
        const startDay = new Date(Date.UTC(raidDate.getUTCFullYear(), raidDate.getUTCMonth(), raidDate.getUTCDate(), 0, 0, 0, 0)).toISOString();
        const endDay = new Date(Date.UTC(raidDate.getUTCFullYear(), raidDate.getUTCMonth(), raidDate.getUTCDate() + 1, 0, 0, 0, 0)).toISOString();
        const { data: matchedEvents, error: matchedError } = await supabaseAdmin
          .from("raid_test_events")
          .select("id,event_at,run_id", { count: "exact" })
          .eq("processing_status", "matched")
          .eq("from_broadcaster_user_login", fromLogin)
          .eq("to_broadcaster_user_login", toLogin)
          .gte("event_at", startDay)
          .lt("event_at", endDay)
          .limit(1);

        if (matchedError && !isMissingRelationError(matchedError)) {
          return NextResponse.json({ error: "Impossible de verifier les raids EventSub deja comptabilises" }, { status: 500 });
        }

        if (!matchedError && (matchedEvents || []).length > 0) {
          autoRejectedAlreadyCounted = true;
          autoRejectedMessage =
            "Declaration refusee automatiquement: ce raid est deja comptabilise via EventSub (status matched).";
          updatePayload.status = "rejected";
          const existingComment = String(existing.staff_comment || "").trim();
          updatePayload.staff_comment = existingComment
            ? `${existingComment} | ${autoRejectedMessage}`
            : autoRejectedMessage;
          updatePayload.reviewed_at = new Date().toISOString();
          updatePayload.reviewed_by = admin.discordId || admin.id;
        }
      }
    }

    if (status) {
      if (!autoRejectedAlreadyCounted) {
        updatePayload.status = status;
        updatePayload.staff_comment = staffComment || null;
        updatePayload.reviewed_at = new Date().toISOString();
        updatePayload.reviewed_by = admin.discordId || admin.id;
      }
    }
    if (targetTwitchLogin) {
      updatePayload.target_twitch_login = targetTwitchLogin;
    }

    const { data, error } = await supabaseAdmin
      .from("raid_declarations")
      .update(updatePayload)
      .eq("id", declarationId)
      .select(
        "id,member_discord_id,member_twitch_login,member_display_name,target_twitch_login,raid_at,is_approximate,note,status,staff_comment,reviewed_at,reviewed_by,created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: "Impossible de mettre a jour la declaration" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      declaration: data,
      autoRejectedAlreadyCounted,
      message: autoRejectedAlreadyCounted ? autoRejectedMessage : undefined,
    });
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

