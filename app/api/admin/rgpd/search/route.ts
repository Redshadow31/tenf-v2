import { NextRequest, NextResponse } from "next/server";
import { searchMembersForRgpd } from "@/lib/admin/rgpd/memberRgpdService";
import { requirePermission } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const q = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchMembersForRgpd(q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[admin/rgpd/search] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
