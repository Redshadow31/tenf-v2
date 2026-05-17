import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import {
  getPartnershipRequest,
  updatePartnershipRequestStatus,
  PARTNERSHIP_STATUSES,
  STATUSES_REQUIRING_DECISION_REASON,
  type PartnershipRequestStatus,
} from "@/lib/partnershipRequestsStorage";

export const dynamic = "force-dynamic";

const SECTION = "/admin/partenariats";
const STATUS_SET = new Set<string>(PARTNERSHIP_STATUSES);
const STATUSES_NEEDING_REASON = new Set<string>(STATUSES_REQUIRING_DECISION_REASON);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DECISION_REASON_MIN = 5;
const DECISION_REASON_MAX = 2000;

/** GET /api/admin/partnerships/[id] : détail + notes internes. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireSectionAccess(SECTION);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!params?.id || !UUID_RE.test(params.id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const result = await getPartnershipRequest(params.id);
    if (!result) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[admin/partnerships] GET detail error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement de la demande." },
      { status: 500 }
    );
  }
}

/** PATCH /api/admin/partnerships/[id] : changement de statut. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireSectionAccess(SECTION);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!params?.id || !UUID_RE.test(params.id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const dict = body as Record<string, unknown>;

    const nextStatus = String(dict.status || "").toLowerCase();
    if (!STATUS_SET.has(nextStatus)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    // Motif obligatoire pour accepted / refused
    let decisionReason: string | null | undefined;
    if (STATUSES_NEEDING_REASON.has(nextStatus)) {
      const rawReason = typeof dict.decisionReason === "string" ? dict.decisionReason.trim() : "";
      if (rawReason.length < DECISION_REASON_MIN) {
        return NextResponse.json(
          {
            error: "Un motif de décision interne est obligatoire pour ce statut.",
            field: "decisionReason",
          },
          { status: 400 }
        );
      }
      if (rawReason.length > DECISION_REASON_MAX) {
        return NextResponse.json(
          {
            error: `Le motif est trop long (max ${DECISION_REASON_MAX} caractères).`,
            field: "decisionReason",
          },
          { status: 400 }
        );
      }
      decisionReason = rawReason;
    }

    // Date de bilan : valide uniquement pour "accepted"
    let reviewDueDate: string | null | undefined;
    if (nextStatus === "accepted" && typeof dict.reviewDueDate === "string") {
      const trimmed = dict.reviewDueDate.trim();
      if (trimmed.length > 0) {
        if (!ISO_DATE_RE.test(trimmed)) {
          return NextResponse.json(
            { error: "Date de bilan invalide (format attendu : AAAA-MM-JJ).", field: "reviewDueDate" },
            { status: 400 }
          );
        }
        reviewDueDate = trimmed;
      } else {
        reviewDueDate = null;
      }
    }

    const updated = await updatePartnershipRequestStatus(params.id, {
      status: nextStatus as PartnershipRequestStatus,
      decisionReason,
      reviewDueDate,
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("[admin/partnerships] PATCH error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du statut." },
      { status: 500 }
    );
  }
}
