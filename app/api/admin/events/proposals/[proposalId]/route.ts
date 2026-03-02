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
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) throw updateError;

    let createdEventId: string | null = null;
    if (createEvent && status === "approved") {
      const eventId = `event-proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const eventDate = proposal.proposed_date ? new Date(proposal.proposed_date).toISOString() : new Date().toISOString();

      const { error: createError } = await supabaseAdmin.from("events").insert({
        id: eventId,
        title: proposal.title,
        description: proposal.description,
        date: eventDate,
        category: proposal.category,
        is_published: false,
        created_by: admin.discordId || admin.id,
        created_at: new Date().toISOString(),
      });
      if (createError) throw createError;
      createdEventId = eventId;
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

