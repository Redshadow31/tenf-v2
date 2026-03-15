import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("raid_declarations")
      .select("id,target_twitch_login,raid_at,is_approximate,note,status,staff_comment,reviewed_at,created_at")
      .eq("member_discord_id", discordId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json({ declarations: [], backendReady: false }, { status: 200 });
      }
      return NextResponse.json({ error: "Impossible de charger les declarations" }, { status: 500 });
    }

    return NextResponse.json({ declarations: data || [], backendReady: true });
  } catch (error) {
    console.error("[members/me/raid-declarations] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const member = await memberRepository.findByDiscordId(discordId);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const target = String(body?.targetTwitchLogin || "").trim();
    const raidAt = String(body?.raidAt || "").trim();
    const note = String(body?.note || "").trim();
    const isApproximate = Boolean(body?.isApproximate);

    if (!target) {
      return NextResponse.json({ error: "Streamer cible requis" }, { status: 400 });
    }
    if (!raidAt) {
      return NextResponse.json({ error: "Date/heure raid requise" }, { status: 400 });
    }

    const raidDate = new Date(raidAt);
    if (Number.isNaN(raidDate.getTime())) {
      return NextResponse.json({ error: "Date/heure invalide" }, { status: 400 });
    }

    const payload = {
      member_discord_id: discordId,
      member_twitch_login: member.twitchLogin,
      member_display_name: member.displayName || member.siteUsername || member.twitchLogin,
      target_twitch_login: target,
      raid_at: raidDate.toISOString(),
      is_approximate: isApproximate,
      note,
      status: "processing",
    };

    const { data, error } = await supabaseAdmin
      .from("raid_declarations")
      .insert(payload)
      .select("id,target_twitch_login,raid_at,is_approximate,note,status,staff_comment,reviewed_at,created_at")
      .single();

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json({ error: "Module declarations raids non actif (migration 0034 manquante)" }, { status: 503 });
      }
      return NextResponse.json({ error: "Impossible d enregistrer la declaration" }, { status: 500 });
    }

    return NextResponse.json({ success: true, declaration: data });
  } catch (error) {
    console.error("[members/me/raid-declarations] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

