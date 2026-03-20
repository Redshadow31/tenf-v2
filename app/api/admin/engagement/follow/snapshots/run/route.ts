import { NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import {
  executeFollowEngagementSnapshotJob,
  startFollowEngagementSnapshotJob,
} from "@/lib/admin/followEngagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300; // Snapshot follow potentiellement long (Twitch + DB)

export async function POST() {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const started = await startFollowEngagementSnapshotJob(admin.discordId || null);
    if (!started.alreadyRunning) {
      void executeFollowEngagementSnapshotJob(started.snapshotId, admin.discordId || null).catch(
        (error) => {
          console.error("[Admin Follow Snapshot Run] Erreur job async:", error);
        }
      );
    }

    return NextResponse.json({
      success: true,
      snapshotId: started.snapshotId,
      status: "running",
      alreadyRunning: started.alreadyRunning,
    }, { status: 202 });
  } catch (error) {
    console.error("[Admin Follow Snapshot Run] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la generation du snapshot follow" },
      { status: 500 }
    );
  }
}
