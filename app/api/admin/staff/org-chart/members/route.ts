import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { staffOrgChartRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/gestion-acces/organigramme-staff";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSectionAccess(ADMIN_SECTION);
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (query.length < 2) {
      return NextResponse.json({ success: true, members: [] });
    }

    const members = await staffOrgChartRepository.searchMembers(query, 20);
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("[API admin/staff/org-chart/members GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
