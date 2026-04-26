import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";
import { syncProfileValidationNotification } from "@/lib/memberNotifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_DESCRIPTION = 800;

function normalizeDateInput(value?: string): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/**
 * POST - Soumet les modifications de profil (description, réseaux) pour validation admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { description, instagram, tiktok, twitter, birthday, twitchAffiliateDate, timezone } = body;

    const member = await memberRepository.findByDiscordId(session.user.discordId);

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const desc = (description || "").trim();
    const normalizedBirthday = normalizeDateInput(birthday);
    const normalizedAffiliateDate = normalizeDateInput(twitchAffiliateDate);
    if ((birthday || "").trim() && !normalizedBirthday) {
      return NextResponse.json({ error: "Format date d'anniversaire invalide (YYYY-MM-DD)" }, { status: 400 });
    }
    if ((twitchAffiliateDate || "").trim() && !normalizedAffiliateDate) {
      return NextResponse.json({ error: "Format date d'affiliation Twitch invalide (YYYY-MM-DD)" }, { status: 400 });
    }
    const normalizedTimezone = (timezone || "").trim();

    if (desc.length > MAX_DESCRIPTION) {
      return NextResponse.json(
        { error: `La description ne doit pas dépasser ${MAX_DESCRIPTION} caractères` },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà une demande en attente
    const { data: existing } = await supabaseAdmin
      .from("member_profile_pending")
      .select("id")
      .eq("twitch_login", member.twitchLogin.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existing) {
      // Mettre à jour la demande existante
      await supabaseAdmin
        .from("member_profile_pending")
        .update({
          description: desc || null,
          instagram: (instagram || "").trim() || null,
          tiktok: (tiktok || "").trim() || null,
          twitter: (twitter || "").trim() || null,
          birthday: normalizedBirthday,
          twitch_affiliate_date: normalizedAffiliateDate,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Créer une nouvelle demande
      await supabaseAdmin.from("member_profile_pending").insert({
        twitch_login: member.twitchLogin.toLowerCase(),
        discord_id: member.discordId || null,
        description: desc || null,
        instagram: (instagram || "").trim() || null,
        tiktok: (tiktok || "").trim() || null,
        twitter: (twitter || "").trim() || null,
        birthday: normalizedBirthday,
        twitch_affiliate_date: normalizedAffiliateDate,
        status: "pending",
      });
    }

    // A la soumission valide du profil, l'onboarding est considere termine.
    await memberRepository.update(member.twitchLogin, {
      profileValidationStatus: "en_cours_examen",
      onboardingStatus: "termine",
      timezone: normalizedTimezone || member.timezone,
    });

    // Maintenir la notification admin des profils en attente synchronisée.
    try {
      await syncProfileValidationNotification();
    } catch (notificationError) {
      console.error("[members/me/profile] notification sync error:", notificationError);
    }

    return NextResponse.json({ success: true, message: "Modifications soumises pour validation" });
  } catch (error) {
    console.error("[members/me/profile] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}
