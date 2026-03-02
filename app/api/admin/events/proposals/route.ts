import { NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: proposals, error } = await supabaseAdmin
      .from("event_proposals")
      .select(
        "id,title,description,category,proposed_date,status,is_anonymous,proposed_by_discord_id,proposed_by_twitch_login,proposed_by_display_name,created_at,updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const proposalIds = (proposals || []).map((p) => p.id);
    let votesByProposal = new Map<string, number>();
    if (proposalIds.length > 0) {
      const { data: votes, error: votesError } = await supabaseAdmin
        .from("event_proposal_votes")
        .select("proposal_id")
        .in("proposal_id", proposalIds);
      if (votesError) throw votesError;
      votesByProposal = (votes || []).reduce((acc, vote) => {
        acc.set(vote.proposal_id, (acc.get(vote.proposal_id) || 0) + 1);
        return acc;
      }, new Map<string, number>());
    }

    const formatted = (proposals || []).map((proposal) => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      proposedDate: proposal.proposed_date,
      status: proposal.status,
      isAnonymous: proposal.is_anonymous,
      proposer: {
        discordId: proposal.proposed_by_discord_id,
        twitchLogin: proposal.proposed_by_twitch_login,
        displayName: proposal.proposed_by_display_name,
      },
      votesCount: votesByProposal.get(proposal.id) || 0,
      createdAt: proposal.created_at,
      updatedAt: proposal.updated_at,
    }));

    return NextResponse.json({ success: true, proposals: formatted });
  } catch (error) {
    console.error("[API admin/events/proposals GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

