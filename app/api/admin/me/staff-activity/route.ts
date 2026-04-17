import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildStaffActivityFeed } from "@/lib/staffActivityFeed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET — fil d’activité « staff métier » (audit filtré : membres, accès, événements, évaluations).
 * Tout administrateur authentifié peut lire ce flux synthétique (sans payloads d’audit).
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const items = await buildStaffActivityFeed(20);
    return NextResponse.json({
      source: "audit_staff",
      items,
    });
  } catch (e) {
    console.error("[admin/me/staff-activity]", e);
    return NextResponse.json(
      { error: "Impossible de charger l’activité staff", items: [], source: "audit_staff" },
      { status: 500 }
    );
  }
}
