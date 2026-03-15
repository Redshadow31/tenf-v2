import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db/supabase";

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

async function requireDiscordId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.discordId || null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: { declarationId: string } }) {
  try {
    const discordId = await requireDiscordId();
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const declarationId = String(params.declarationId || "");
    if (!declarationId) {
      return NextResponse.json({ error: "Identifiant declaration manquant" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("raid_declarations")
      .select("id,target_twitch_login,raid_at,is_approximate,note,status,staff_comment,reviewed_at,reviewed_by,created_at")
      .eq("id", declarationId)
      .eq("member_discord_id", discordId)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json({ error: "Module declarations raids non actif" }, { status: 503 });
      }
      return NextResponse.json({ error: "Impossible de charger cette declaration" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Declaration introuvable" }, { status: 404 });
    }

    return NextResponse.json({ declaration: data });
  } catch (error) {
    console.error("[members/me/raid-declarations/:id] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { declarationId: string } }) {
  try {
    const discordId = await requireDiscordId();
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const declarationId = String(params.declarationId || "");
    if (!declarationId) {
      return NextResponse.json({ error: "Identifiant declaration manquant" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("raid_declarations")
      .select("id,status")
      .eq("id", declarationId)
      .eq("member_discord_id", discordId)
      .maybeSingle();

    if (existingError) {
      if (isMissingRelationError(existingError)) {
        return NextResponse.json({ error: "Module declarations raids non actif" }, { status: 503 });
      }
      return NextResponse.json({ error: "Impossible de verifier cette declaration" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Declaration introuvable" }, { status: 404 });
    }
    if (existing.status !== "processing") {
      return NextResponse.json({ error: "Seules les declarations en cours peuvent etre annulees" }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from("raid_declarations")
      .delete()
      .eq("id", declarationId)
      .eq("member_discord_id", discordId);

    if (error) {
      return NextResponse.json({ error: "Impossible d annuler la declaration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[members/me/raid-declarations/:id] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

