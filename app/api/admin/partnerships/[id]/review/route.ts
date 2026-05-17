import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import {
  getPartnershipRequest,
  getPartnershipRequestReview,
  upsertPartnershipRequestReview,
  RISK_LEVELS,
  type RiskLevel,
} from "@/lib/partnershipRequestsStorage";

export const dynamic = "force-dynamic";

const SECTION = "/admin/partenariats";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RISK_SET = new Set<string>(RISK_LEVELS);
const COMMENT_MAX = 4000;

function parseRating(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "invalid";
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return "invalid";
  return rounded;
}

function parseRisk(value: unknown): RiskLevel | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const v = String(value).toLowerCase();
  if (!RISK_SET.has(v)) return "invalid";
  return v as RiskLevel;
}

function parseBool(value: unknown): boolean | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return "invalid";
}

/** GET /api/admin/partnerships/[id]/review : récupère l'évaluation staff. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireSectionAccess(SECTION);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!params?.id || !UUID_RE.test(params.id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const review = await getPartnershipRequestReview(params.id);
    return NextResponse.json({ ok: true, review });
  } catch (error) {
    console.error("[admin/partnerships] GET review error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement de l'évaluation." },
      { status: 500 }
    );
  }
}

/** PUT /api/admin/partnerships/[id]/review : upsert l'évaluation staff. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const valuesAlignment = parseRating(dict.valuesAlignment);
    if (valuesAlignment === "invalid") {
      return NextResponse.json(
        { error: "Note 'valeurs TENF' invalide (1 à 5).", field: "valuesAlignment" },
        { status: 400 }
      );
    }
    const membersInterest = parseRating(dict.membersInterest);
    if (membersInterest === "invalid") {
      return NextResponse.json(
        { error: "Note 'intérêt membres' invalide (1 à 5).", field: "membersInterest" },
        { status: 400 }
      );
    }
    const partnerSeriousness = parseRating(dict.partnerSeriousness);
    if (partnerSeriousness === "invalid") {
      return NextResponse.json(
        { error: "Note 'sérieux du partenaire' invalide (1 à 5).", field: "partnerSeriousness" },
        { status: 400 }
      );
    }

    const recruitmentRisk = parseRisk(dict.recruitmentRisk);
    if (recruitmentRisk === "invalid") {
      return NextResponse.json(
        { error: "Niveau de risque (recrutement) invalide.", field: "recruitmentRisk" },
        { status: 400 }
      );
    }
    const confusionRisk = parseRisk(dict.confusionRisk);
    if (confusionRisk === "invalid") {
      return NextResponse.json(
        { error: "Niveau de risque (confusion) invalide.", field: "confusionRisk" },
        { status: 400 }
      );
    }

    const observationNeeded = parseBool(dict.observationNeeded);
    if (observationNeeded === "invalid") {
      return NextResponse.json(
        { error: "Valeur 'période d'observation' invalide.", field: "observationNeeded" },
        { status: 400 }
      );
    }

    let comment: string | null = null;
    if (typeof dict.comment === "string") {
      const trimmed = dict.comment.trim();
      if (trimmed.length > COMMENT_MAX) {
        return NextResponse.json(
          { error: `Commentaire trop long (max ${COMMENT_MAX} caractères).`, field: "comment" },
          { status: 400 }
        );
      }
      comment = trimmed.length > 0 ? trimmed : null;
    }

    // Vérifier que la demande existe
    const existing = await getPartnershipRequest(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    const review = await upsertPartnershipRequestReview({
      requestId: params.id,
      updatedBy: admin.username || admin.discordId,
      valuesAlignment,
      membersInterest,
      partnerSeriousness,
      recruitmentRisk,
      confusionRisk,
      observationNeeded,
      comment,
    });

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    console.error("[admin/partnerships] PUT review error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour de l'évaluation." },
      { status: 500 }
    );
  }
}
