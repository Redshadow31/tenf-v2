import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getDashboardSummaryCached } from "@/lib/admin/dashboardSummary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const data = await getDashboardSummaryCached();
    const payload = { success: true, data };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[API Admin Dashboard Summary] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
