import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { parseAdminPageActivityFilters } from "@/lib/services/adminPageActivityQuery";
import { getPageActivityHistory } from "@/lib/services/pageActivityService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    ensureConnectionLogsCleanupScheduler();
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = parseAdminPageActivityFilters(searchParams);
    const payload = await getPageActivityHistory(filters);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/page-activity] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
