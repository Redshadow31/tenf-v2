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

    let proposals: Record<string, unknown>[] = [];
    let schemaVariant: "legacy" | "v2" = "legacy";

    const legacyQuery = await supabaseAdmin
      .from("event_proposals")
      .select(
        "id,title,description,category,proposed_date,status,is_anonymous,proposed_by_discord_id,proposed_by_twitch_login,proposed_by_display_name,created_at,updated_at"
      )
      .order("created_at", { ascending: false });

    if (legacyQuery.error) {
      const v2Query = await supabaseAdmin
        .from("event_proposals")
        .select("id,title,description,category,preferred_date,status,proposed_by_member_id,created_at,reviewed_at")
        .order("created_at", { ascending: false });

      if (v2Query.error) throw v2Query.error;
      proposals = (v2Query.data || []) as Record<string, unknown>[];
      schemaVariant = "v2";
    } else {
      proposals = (legacyQuery.data || []) as Record<string, unknown>[];
    }

    const proposalIds = (proposals || []).map((p) => String(p.id));
    let votesByProposal = new Map<string, number>();
    if (proposalIds.length > 0) {
      const { data: votes, error: votesError } = await supabaseAdmin
        .from("event_proposal_votes")
        .select("proposal_id")
        .in("proposal_id", proposalIds);
      // Certains environnements v2 n'ont pas encore la table de votes.
      if (votesError && votesError.code !== "42P01") throw votesError;
      votesByProposal = ((votes || []) as Array<{ proposal_id: string }>).reduce((acc, vote) => {
        acc.set(vote.proposal_id, (acc.get(vote.proposal_id) || 0) + 1);
        return acc;
      }, new Map<string, number>());
    }

    const formatted = (proposals || []).map((proposal) => ({
      id: String(proposal.id),
      title: String(proposal.title || ""),
      description: String(proposal.description || ""),
      category: String(proposal.category || ""),
      proposedDate: schemaVariant === "legacy" ? (proposal.proposed_date as string | null) : (proposal.preferred_date as string | null),
      status: String(proposal.status || "pending"),
      isAnonymous: schemaVariant === "legacy" ? Boolean(proposal.is_anonymous) : true,
      proposer: {
        discordId:
          schemaVariant === "legacy"
            ? ((proposal.proposed_by_discord_id as string | undefined) ?? undefined)
            : undefined,
        twitchLogin:
          schemaVariant === "legacy"
            ? ((proposal.proposed_by_twitch_login as string | undefined) ?? undefined)
            : undefined,
        displayName:
          schemaVariant === "legacy"
            ? ((proposal.proposed_by_display_name as string | undefined) ?? undefined)
            : ((proposal.proposed_by_member_id as string | undefined) ?? undefined),
      },
      votesCount: votesByProposal.get(String(proposal.id)) || 0,
      createdAt: String(proposal.created_at || new Date().toISOString()),
      updatedAt:
        schemaVariant === "legacy"
          ? ((proposal.updated_at as string | undefined) ?? null)
          : ((proposal.reviewed_at as string | undefined) ?? null),
    }));

    return NextResponse.json({ success: true, proposals: formatted });
  } catch (error) {
    console.error("[API admin/events/proposals GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

