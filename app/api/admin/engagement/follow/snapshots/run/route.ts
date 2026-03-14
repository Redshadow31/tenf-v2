import { NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { createFollowEngagementSnapshot } from "@/lib/admin/followEngagement";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const snapshot = await createFollowEngagementSnapshot(admin.discordId || null);
    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error("[Admin Follow Snapshot Run] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la generation du snapshot follow" },
      { status: 500 }
    );
  }
}
