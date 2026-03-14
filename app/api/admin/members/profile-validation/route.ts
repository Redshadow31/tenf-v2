import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";
import { syncProfileValidationNotification } from "@/lib/memberNotifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseDateFromDb(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

/**
 * GET - Liste les demandes de modification de profil en attente
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("member_profile_pending")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    try {
      await syncProfileValidationNotification();
    } catch (notificationError) {
      console.error("[profile-validation] notification sync error (GET):", notificationError);
    }

    return NextResponse.json({ pending: data || [] });
  } catch (error) {
    console.error("[profile-validation] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Approuve ou rejette une demande
 * Body: { id, action: 'approve' | 'reject' }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { data: pending, error: fetchError } = await supabaseAdmin
      .from("member_profile_pending")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (fetchError || !pending) {
      return NextResponse.json({ error: "Demande non trouvée ou déjà traitée" }, { status: 404 });
    }

    if (action === "approve") {
      await memberRepository.update(pending.twitch_login, {
        description: pending.description || undefined,
        instagram: pending.instagram || undefined,
        tiktok: pending.tiktok || undefined,
        twitter: pending.twitter || undefined,
        birthday: parseDateFromDb(pending.birthday),
        twitchAffiliateDate: parseDateFromDb(pending.twitch_affiliate_date),
        // Un profil valide doit repasser actif pour reapparaitre dans les vues membres.
        isActive: true,
        profileValidationStatus: "valide",
        updatedBy: admin.discordId,
      });
    }

    await supabaseAdmin
      .from("member_profile_pending")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.discordId,
      })
      .eq("id", id);

    if (action === "reject") {
      await memberRepository.update(pending.twitch_login, {
        profileValidationStatus: "non_soumis",
      });
    }

    try {
      await syncProfileValidationNotification();
    } catch (notificationError) {
      console.error("[profile-validation] notification sync error (POST):", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Profil validé" : "Demande rejetée",
    });
  } catch (error) {
    console.error("[profile-validation] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
