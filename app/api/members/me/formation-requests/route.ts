import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

function sanitizeFormationTitle(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

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
      .from("formation_requests")
      .select("formation_title,status,requested_at")
      .eq("member_discord_id", discordId)
      .order("requested_at", { ascending: false });

    if (error && !isMissingRelationError(error)) {
      return NextResponse.json({ error: "Impossible de charger les demandes" }, { status: 500 });
    }

    const pendingTitles = new Set<string>();
    for (const row of error ? [] : data || []) {
      if (row.status === "pending") {
        pendingTitles.add(String(row.formation_title || ""));
      }
    }

    return NextResponse.json({
      requests: error ? [] : data || [],
      pendingTitles: Array.from(pendingTitles.values()),
    });
  } catch (error) {
    console.error("[members/me/formation-requests] GET error:", error);
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
    const rawTitle = String(body?.formationTitle || "");
    const formationTitle = sanitizeFormationTitle(rawTitle);
    const sourceEventId = body?.sourceEventId ? String(body.sourceEventId) : null;

    if (!formationTitle) {
      return NextResponse.json({ error: "Nom de formation requis" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("formation_requests")
      .select("id,formation_title,status")
      .eq("member_discord_id", discordId)
      .eq("formation_title", formationTitle)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingError) {
      if (isMissingRelationError(existingError)) {
        return NextResponse.json({ error: "Module demandes de formation non actif (migration 0033 manquante)" }, { status: 503 });
      }
      return NextResponse.json({ error: "Impossible de verifier la demande existante" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ success: true, created: false, request: existing });
    }

    const payload = {
      formation_title: formationTitle,
      source_event_id: sourceEventId,
      member_discord_id: discordId,
      member_twitch_login: member.twitchLogin,
      member_display_name: member.displayName || member.siteUsername || member.twitchLogin,
      status: "pending",
    };

    const { data: created, error: insertError } = await supabaseAdmin
      .from("formation_requests")
      .insert(payload)
      .select("*")
      .single();

    if (insertError) {
      if (isMissingRelationError(insertError)) {
        return NextResponse.json({ error: "Module demandes de formation non actif (migration 0033 manquante)" }, { status: 503 });
      }
      return NextResponse.json({ error: "Impossible d enregistrer la demande" }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true, request: created });
  } catch (error) {
    console.error("[members/me/formation-requests] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

