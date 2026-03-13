import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";
import { memberRepository } from "@/lib/repositories";
import { parisLocalDateTimeToUtcIso } from "@/lib/timezone";
import { requireUser } from "@/lib/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProposalRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  proposed_date?: string | null;
  preferred_date?: string | null;
  status: string;
  is_anonymous?: boolean;
  created_at: string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const discordUserId = user?.discordId || null;

    let proposals: ProposalRow[] = [];
    let schemaVariant: "legacy" | "v2" = "legacy";

    const legacyQuery = await supabaseAdmin
      .from("event_proposals")
      .select("id,title,description,category,proposed_date,status,is_anonymous,created_at")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (legacyQuery.error) {
      const v2Query = await supabaseAdmin
        .from("event_proposals")
        .select("id,title,description,category,preferred_date,status,created_at")
        .neq("status", "archived")
        .order("created_at", { ascending: false });
      if (v2Query.error) throw v2Query.error;
      proposals = (v2Query.data || []) as ProposalRow[];
      schemaVariant = "v2";
    } else {
      proposals = (legacyQuery.data || []) as ProposalRow[];
    }

    const proposalIds = proposals.map((p) => p.id);
    let voteRows: Array<{ proposal_id: string; voter_discord_id: string }> = [];

    if (proposalIds.length > 0) {
      const { data: votes, error: votesError } = await supabaseAdmin
        .from("event_proposal_votes")
        .select("proposal_id,voter_discord_id")
        .in("proposal_id", proposalIds);

      // La table de votes peut ne pas exister sur certaines bases.
      if (votesError && votesError.code !== "42P01") throw votesError;
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

    const formatted = proposals.map((proposal) => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      proposedDate: schemaVariant === "legacy" ? (proposal.proposed_date ?? null) : (proposal.preferred_date ?? null),
      status: proposal.status,
      isAnonymous: schemaVariant === "legacy" ? Boolean(proposal.is_anonymous) : true,
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
    const user = await requireUser();
    const discordUserId = user?.discordId;
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

    const legacyPayload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      proposed_date: proposedDate ? parisLocalDateTimeToUtcIso(proposedDate) : null,
      status: "pending",
      is_anonymous: true,
      proposed_by_discord_id: member.discordId || discordUserId,
      proposed_by_twitch_login: member.twitchLogin,
      proposed_by_display_name: member.displayName || member.twitchLogin,
    };

    const legacyInsert = await supabaseAdmin
      .from("event_proposals")
      .insert(legacyPayload)
      .select("id,title,description,category,proposed_date,status,is_anonymous,created_at")
      .single();

    let data:
      | {
          id: string;
          title: string;
          description: string;
          category: string;
          proposed_date: string | null;
          status: string;
          is_anonymous: boolean;
          created_at: string;
        }
      | null = null;

    if (legacyInsert.error) {
      const v2Payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        preferred_date: proposedDate ? parisLocalDateTimeToUtcIso(proposedDate) : null,
        status: "pending",
        // MemberData ne porte pas d'UUID SQL "members.id" dans ce codebase.
        proposed_by_member_id: null,
      };

      const v2Insert = await supabaseAdmin
        .from("event_proposals")
        .insert(v2Payload)
        .select("id,title,description,category,preferred_date,status,created_at")
        .single();
      if (v2Insert.error) throw v2Insert.error;

      data = {
        id: v2Insert.data.id,
        title: v2Insert.data.title,
        description: v2Insert.data.description,
        category: v2Insert.data.category,
        proposed_date: v2Insert.data.preferred_date,
        status: v2Insert.data.status,
        is_anonymous: true,
        created_at: v2Insert.data.created_at,
      };
    } else {
      data = legacyInsert.data;
    }

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

