import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import {
  listPartnershipRequests,
  PARTNERSHIP_STATUSES,
  PARTNERSHIP_TYPES,
  type PartnershipRequestStatus,
  type PartnershipType,
} from "@/lib/partnershipRequestsStorage";

export const dynamic = "force-dynamic";

const SECTION = "/admin/partenariats";
const STATUS_SET = new Set<string>(PARTNERSHIP_STATUSES);
const TYPE_SET = new Set<string>(PARTNERSHIP_TYPES);

/**
 * GET /api/admin/partnerships
 * ───────────────────────────
 * Liste les demandes de partenariat pour l'admin. Authentification +
 * autorisation section via `requireSectionAccess('/admin/partenariats')`.
 * Query params : ?status=, ?type=, ?search=, ?limit=.
 */
export async function GET(request: NextRequest) {
  const admin = await requireSectionAccess(SECTION);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawStatus = (searchParams.get("status") || "").toLowerCase();
    const rawType = (searchParams.get("type") || "").toLowerCase();
    const search = (searchParams.get("search") || "").slice(0, 120);
    const limitRaw = Number(searchParams.get("limit") || "500");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 1000) : 500;

    const status: PartnershipRequestStatus | "all" = STATUS_SET.has(rawStatus)
      ? (rawStatus as PartnershipRequestStatus)
      : "all";
    const type: PartnershipType | "all" = TYPE_SET.has(rawType) ? (rawType as PartnershipType) : "all";

    const items = await listPartnershipRequests({ status, type, search, limit });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[admin/partnerships] GET error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement des demandes." },
      { status: 500 }
    );
  }
}
