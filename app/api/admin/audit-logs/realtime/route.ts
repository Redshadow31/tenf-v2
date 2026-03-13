import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getRealtimeConnectionsSnapshot } from "@/lib/connectionLogs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const payload = await getRealtimeConnectionsSnapshot();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/audit-logs/realtime] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
