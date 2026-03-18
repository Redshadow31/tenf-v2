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

function isDiscordPlaceholderLogin(value?: string | null): boolean {
  const login = (value || "").trim().toLowerCase();
  return login.startsWith("nouveau_");
}

async function ensureSupabaseMemberForPending(pending: any, updatedBy: string) {
  const normalizedLogin = String(pending?.twitch_login || "").trim().toLowerCase();
  if (!normalizedLogin) return null;

  const byLogin = await memberRepository.findByTwitchLogin(normalizedLogin);
  if (byLogin) return byLogin;

  if (!isDiscordPlaceholderLogin(normalizedLogin)) {
    return null;
  }

  const discordId = String(pending?.discord_id || "").trim() || undefined;
  const fallbackDisplayName = discordId
    ? `Nouveau membre ${discordId.slice(-4)}`
    : normalizedLogin;

  try {
    return await memberRepository.create({
      twitchLogin: normalizedLogin,
      twitchUrl: `https://www.twitch.tv/${normalizedLogin}`,
      displayName: fallbackDisplayName,
      siteUsername: fallbackDisplayName,
      discordId,
      role: "Nouveau",
      isVip: false,
      isActive: false,
      badges: [],
      profileValidationStatus: "non_soumis",
      onboardingStatus: "a_faire",
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy,
    });
  } catch (createError) {
    // Tolérance aux courses d'écriture: un autre process a pu le créer entre-temps.
    const lateRead = await memberRepository.findByTwitchLogin(normalizedLogin);
    if (lateRead) return lateRead;
    throw createError;
  }
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
      const ensuredMember = await ensureSupabaseMemberForPending(pending, admin.discordId);
      if (!ensuredMember) {
        return NextResponse.json(
          { error: "Membre introuvable en base pour cette demande" },
          { status: 404 }
        );
      }
      await memberRepository.update(pending.twitch_login, {
        description: pending.description || undefined,
        instagram: pending.instagram || undefined,
        tiktok: pending.tiktok || undefined,
        twitter: pending.twitter || undefined,
        birthday: parseDateFromDb(pending.birthday),
        twitchAffiliateDate: parseDateFromDb(pending.twitch_affiliate_date),
        // Nouvelle logique métier:
        // profil validé => membre conservé inactif en attente de validation "passage Communauté".
        isActive: false,
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
