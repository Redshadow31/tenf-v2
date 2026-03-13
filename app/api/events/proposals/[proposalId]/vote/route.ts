import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/db/supabase";
import { memberRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMissingTableError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01");
}

async function getVoteCount(proposalId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("event_proposal_votes")
    .select("*", { count: "exact", head: true })
    .eq("proposal_id", proposalId);
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  return count || 0;
}

export async function POST(_request: NextRequest, { params }: { params: { proposalId: string } }) {
  try {
    const cookieStore = cookies();
    const discordUserId = cookieStore.get("discord_user_id")?.value;
    if (!discordUserId) {
      return NextResponse.json({ error: "Vous devez être connecté pour voter" }, { status: 401 });
    }

    const { proposalId } = params;
    const member = await memberRepository.findByDiscordId(discordUserId);

    const { error } = await supabaseAdmin.from("event_proposal_votes").insert({
      proposal_id: proposalId,
      voter_discord_id: discordUserId,
      voter_twitch_login: member?.twitchLogin || null,
    });

    // unique constraint collision -> déjà voté
    if (error && error.code !== "23505") {
      if (isMissingTableError(error)) {
        return NextResponse.json({ error: "Le vote n'est pas encore disponible (migration SQL manquante)" }, { status: 503 });
      }
      throw error;
    }

    const votesCount = await getVoteCount(proposalId);
    return NextResponse.json({ success: true, hasVoted: true, votesCount });
  } catch (error) {
    console.error("[API events/proposals vote POST] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { proposalId: string } }) {
  try {
    const cookieStore = cookies();
    const discordUserId = cookieStore.get("discord_user_id")?.value;
    if (!discordUserId) {
      return NextResponse.json({ error: "Vous devez être connecté pour voter" }, { status: 401 });
    }

    const { proposalId } = params;
    const { error } = await supabaseAdmin
      .from("event_proposal_votes")
      .delete()
      .eq("proposal_id", proposalId)
      .eq("voter_discord_id", discordUserId);

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ error: "Le vote n'est pas encore disponible (migration SQL manquante)" }, { status: 503 });
      }
      throw error;
    }

    const votesCount = await getVoteCount(proposalId);
    return NextResponse.json({ success: true, hasVoted: false, votesCount });
  } catch (error) {
    console.error("[API events/proposals vote DELETE] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

