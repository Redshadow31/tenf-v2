import { NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { getLatestFollowEngagementOverview } from "@/lib/admin/followEngagement";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const latest = await getLatestFollowEngagementOverview();
    if (!latest) {
      return NextResponse.json(
        {
          snapshotId: null,
          generatedAt: null,
          sourceDataRetrievedAt: null,
          totalActiveTenfChannels: 0,
          trackedMembersCount: 0,
          rows: [],
        },
        { status: 200 }
      );
    }
    return NextResponse.json(latest);
  } catch (error) {
    console.error("[Admin Follow Overview] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne lors du calcul follow" },
      { status: 500 }
    );
  }
}
