import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { getTwitchUsers } from "@/lib/twitch";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Récupérer l'avatar Twitch
    let avatar: string | undefined;
    try {
      const twitchUsers = await getTwitchUsers([member.twitchLogin]);
      avatar = twitchUsers[0]?.profile_image_url;
    } catch {
      // Ignorer
    }

    // Vérifier s'il y a des modifications en attente
    const { data: pending } = await supabaseAdmin
      .from("member_profile_pending")
      .select("description, instagram, tiktok, twitter")
      .eq("twitch_login", member.twitchLogin.toLowerCase())
      .eq("status", "pending")
      .single();

    const memberId = `MEM-${member.twitchLogin.toUpperCase().slice(0, 8)}`;
    const memberSince = member.createdAt
      ? new Date(member.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : null;

    return NextResponse.json({
      member: {
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        memberId,
        avatar: avatar || `https://placehold.co/120x120?text=${(member.displayName || member.twitchLogin).charAt(0)}`,
        role: member.role,
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
        tenfSummary: {
          role: member.role,
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
