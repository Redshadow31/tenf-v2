import { NextRequest, NextResponse } from "next/server";
import { backfillUnknownGeoStatus } from "@/lib/services/geoBackfillService";

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
    const daysRaw = Number.parseInt(new URL(request.url).searchParams.get("days") || "30", 10);
    const days = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, daysRaw)) : 30;
    const result = await backfillUnknownGeoStatus(days);
    return NextResponse.json({ success: true, ...result, days });
  } catch (error) {
    console.error("[internal/connection-logs/geo-backfill] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
