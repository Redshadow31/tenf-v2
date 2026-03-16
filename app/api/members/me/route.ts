import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";
import {
  fetchCanonicalTwitchAvatarForLogin,
  hydrateTwitchStatusAvatar,
  resolveMemberAvatar,
} from "@/lib/memberAvatar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMIN_ROLE_TO_MEMBER_ROLE: Record<string, string> = {
  FONDATEUR: "Admin",
  ADMIN_COORDINATEUR: "Admin Coordinateur",
  MODERATEUR: "Modérateur",
  MODERATEUR_EN_FORMATION: "Modérateur en formation",
  MODERATEUR_EN_PAUSE: "Modérateur en pause",
  SOUTIEN_TENF: "Soutien TENF",
};

/**
 * GET - Récupère le profil du membre connecté ou par twitchLogin
 * Si session Discord : cherche par discordId
 * Sinon : ?twitchLogin=xxx requis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const twitchLoginParam = searchParams.get("twitchLogin");

    let member = null;

    // Essayer d'abord par session Discord
    const session = await getServerSession(authOptions);
    if (session?.user?.discordId) {
      member = await memberRepository.findByDiscordId(session.user.discordId);
      if (!member) {
        const discordId = String(session.user.discordId).trim();
        const discordUsername = String(session.user.username || session.user.name || "").trim();
        const placeholderLogin = `nouveau_${discordId.toLowerCase()}`;
        member = await memberRepository.create({
          twitchLogin: placeholderLogin,
          twitchUrl: `https://www.twitch.tv/${placeholderLogin}`,
          displayName: discordUsername || `Nouveau membre ${discordId.slice(-4)}`,
          siteUsername: discordUsername || undefined,
          discordId,
          discordUsername: discordUsername || undefined,
          role: "Nouveau",
          isActive: false,
          isVip: false,
          badges: [],
          profileValidationStatus: "non_soumis",
          onboardingStatus: "a_faire",
          timezone: "Europe/Paris",
          countryCode: "FR",
          primaryLanguage: "fr",
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: discordId,
        });
      }
    }

    // Sinon par twitchLogin si fourni
    if (!member && twitchLoginParam) {
      member = await memberRepository.findByTwitchLogin(twitchLoginParam);
    }

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé. Connecte-toi avec Discord ou indique ton pseudo Twitch." },
        { status: 404 }
      );
    }

    // Récupérer et hydrater l'avatar Twitch canonique si disponible
    const fetchedAvatar = await fetchCanonicalTwitchAvatarForLogin(member.twitchLogin);
    if (fetchedAvatar) {
      member = await memberRepository.update(member.twitchLogin, {
        twitchStatus: hydrateTwitchStatusAvatar(member.twitchStatus, fetchedAvatar),
        updatedAt: new Date(),
        updatedBy: session?.user?.discordId || member.updatedBy,
      } as any);
    }

    // Vérifier s'il y a des modifications en attente
    const { data: pending } = await supabaseAdmin
      .from("member_profile_pending")
      .select("description, instagram, tiktok, twitter, birthday, twitch_affiliate_date")
      .eq("twitch_login", member.twitchLogin.toLowerCase())
      .eq("status", "pending")
      .single();

    const memberId = `MEM-${member.twitchLogin.toUpperCase().slice(0, 8)}`;
    const memberSince = member.createdAt
      ? new Date(member.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : null;
    const authenticatedAdmin = await getAuthenticatedAdmin();
    const effectiveRole =
      (authenticatedAdmin?.role && ADMIN_ROLE_TO_MEMBER_ROLE[authenticatedAdmin.role]) || member.role;

    return NextResponse.json({
      member: {
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        memberId,
        avatar: resolveMemberAvatar(member, fetchedAvatar),
        role: effectiveRole,
        bio: member.description || member.customBio || "",
        memberSince,
        profileValidationStatus: member.profileValidationStatus || "non_soumis",
        socials: {
          twitch: member.twitchLogin ? `https://www.twitch.tv/${member.twitchLogin}` : "",
          discord: member.discordUsername || "",
          instagram: member.instagram || "",
          tiktok: member.tiktok || "",
          twitter: member.twitter || "",
        },
        birthday: member.birthday ? new Date(member.birthday).toISOString() : null,
        twitchAffiliateDate: member.twitchAffiliateDate ? new Date(member.twitchAffiliateDate).toISOString() : null,
        timezone: member.timezone || null,
        tenfSummary: {
          role: effectiveRole,
          status: member.isActive ? "Actif" : "Inactif",
          integration: {
            integrated: !!member.integrationDate,
            date: member.integrationDate
              ? new Date(member.integrationDate).toLocaleDateString("fr-FR")
              : null,
          },
          parrain: member.parrain || null,
        },
        createdAt: member.createdAt?.toISOString?.(),
        integrationDate: member.integrationDate?.toISOString?.(),
      },
      pending: pending
        ? {
            description: pending.description || "",
            instagram: pending.instagram || "",
            tiktok: pending.tiktok || "",
            twitter: pending.twitter || "",
            birthday: pending.birthday || "",
            twitchAffiliateDate: pending.twitch_affiliate_date || "",
          }
        : null,
    });
  } catch (error) {
    console.error("[members/me] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du profil" },
      { status: 500 }
    );
  }
}
