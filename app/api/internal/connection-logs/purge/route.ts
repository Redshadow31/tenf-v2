import { NextRequest, NextResponse } from "next/server";
import { cleanupOldConnectionLogs } from "@/lib/services/cleanupService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CONNECTION_LOGS_CRON_SECRET;
  if (expectedSecret) {
    const provided = request.headers.get("x-cron-secret");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    await cleanupOldConnectionLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[internal/connection-logs/purge] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
