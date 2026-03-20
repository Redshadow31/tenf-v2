import { NextRequest, NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { getFollowEngagementSnapshotRunInfo } from "@/lib/admin/followEngagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const snapshotId = request.nextUrl.searchParams.get("snapshotId");
    const snapshot = await getFollowEngagementSnapshotRunInfo(snapshotId);

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error("[Admin Follow Snapshot Status] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la lecture du statut snapshot follow" },
      { status: 500 }
    );
  }
}
