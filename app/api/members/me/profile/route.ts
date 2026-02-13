import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_DESCRIPTION = 800;

/**
 * POST - Soumet les modifications de profil (description, réseaux) pour validation admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { description, instagram, tiktok, twitter, twitchLogin } = body;

    let member = null;
    if (session?.user?.discordId) {
      member = await memberRepository.findByDiscordId(session.user.discordId);
    }
    if (!member && twitchLogin) {
      member = await memberRepository.findByTwitchLogin(twitchLogin);
    }

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const desc = (description || "").trim();
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
        status: "pending",
      });
    }

    // Mettre à jour le statut du membre
    await memberRepository.update(member.twitchLogin, {
      profileValidationStatus: "en_cours_examen",
    });

    return NextResponse.json({ success: true, message: "Modifications soumises pour validation" });
  } catch (error) {
    console.error("[members/me/profile] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}
