import { NextResponse } from "next/server";
import { staffOrgChartRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await staffOrgChartRepository.listPublic();
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("[API staff/org-chart GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
