import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { proposalId: string } }) {
  try {
    const admin = await requireSectionAccess("/admin/events/planification");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { proposalId } = params;
    const body = await request.json();
    const status = body.status as "pending" | "approved" | "rejected" | "archived" | undefined;
    const createEvent = !!body.createEvent;

    if (!status || !["pending", "approved", "rejected", "archived"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from("event_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();
    if (proposalError || !proposal) {
      return NextResponse.json({ error: "Proposition introuvable" }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("event_proposals")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.discordId || admin.id,
      })
      .eq("id", proposalId);

    if (updateError) throw updateError;

    let createdEventId: string | null = null;
    if (createEvent && status === "approved") {
      const proposedDate = proposal.preferred_date || proposal.proposed_date;
      const eventDate = proposedDate ? new Date(proposedDate).toISOString() : new Date().toISOString();

      const { data: createdEvent, error: createError } = await supabaseAdmin.from("community_events").insert({
        title: proposal.title,
        description: proposal.description,
        starts_at: eventDate,
        category: proposal.category,
        is_published: false,
        created_by: admin.discordId || admin.id,
        created_at: new Date().toISOString(),
      }).select("id").single();
      if (createError) throw createError;
      createdEventId = createdEvent?.id ?? null;
    }

    return NextResponse.json({
      success: true,
      message: "Proposition mise à jour",
      createdEventId,
    });
  } catch (error) {
    console.error("[API admin/events/proposals PATCH] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

