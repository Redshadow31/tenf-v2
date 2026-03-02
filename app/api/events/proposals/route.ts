import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/db/supabase";
import { memberRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProposalRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  proposed_date: string | null;
  status: string;
  is_anonymous: boolean;
  created_at: string;
};

export async function GET() {
  try {
    const cookieStore = cookies();
    const discordUserId = cookieStore.get("discord_user_id")?.value || null;

    const { data: proposals, error } = await supabaseAdmin
      .from("event_proposals")
      .select("id,title,description,category,proposed_date,status,is_anonymous,created_at")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const proposalIds = (proposals || []).map((p) => p.id);
    let voteRows: Array<{ proposal_id: string; voter_discord_id: string }> = [];

    if (proposalIds.length > 0) {
      const { data: votes, error: votesError } = await supabaseAdmin
        .from("event_proposal_votes")
        .select("proposal_id,voter_discord_id")
        .in("proposal_id", proposalIds);

      if (votesError) throw votesError;
      voteRows = votes || [];
    }

    const voteCountByProposal = new Map<string, number>();
    const userVotes = new Set<string>();

    for (const vote of voteRows) {
      voteCountByProposal.set(vote.proposal_id, (voteCountByProposal.get(vote.proposal_id) || 0) + 1);
      if (discordUserId && vote.voter_discord_id === discordUserId) {
        userVotes.add(vote.proposal_id);
      }
    }

    const formatted = ((proposals || []) as ProposalRow[]).map((proposal) => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      proposedDate: proposal.proposed_date,
      status: proposal.status,
      isAnonymous: proposal.is_anonymous,
      createdAt: proposal.created_at,
      votesCount: voteCountByProposal.get(proposal.id) || 0,
      hasVoted: userVotes.has(proposal.id),
    }));

    return NextResponse.json({ proposals: formatted, success: true });
  } catch (error) {
    console.error("[API events/proposals GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const discordUserId = cookieStore.get("discord_user_id")?.value;
    if (!discordUserId) {
      return NextResponse.json({ error: "Vous devez être connecté pour proposer un événement" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, proposedDate } = body as {
      title?: string;
      description?: string;
      category?: string;
      proposedDate?: string;
    };

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Titre, description et catégorie sont requis" }, { status: 400 });
    }

    const member = await memberRepository.findByDiscordId(discordUserId);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable pour ce compte Discord" }, { status: 404 });
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      proposed_date: proposedDate ? new Date(proposedDate).toISOString() : null,
      status: "pending",
      is_anonymous: true,
      proposed_by_discord_id: member.discordId || discordUserId,
      proposed_by_twitch_login: member.twitchLogin,
      proposed_by_display_name: member.displayName || member.twitchLogin,
    };

    const { data, error } = await supabaseAdmin
      .from("event_proposals")
      .insert(payload)
      .select("id,title,description,category,proposed_date,status,is_anonymous,created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      proposal: {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        proposedDate: data.proposed_date,
        status: data.status,
        isAnonymous: data.is_anonymous,
        createdAt: data.created_at,
        votesCount: 0,
        hasVoted: false,
      },
      success: true,
      message: "Proposition envoyée avec succès",
    });
  } catch (error) {
    console.error("[API events/proposals POST] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

