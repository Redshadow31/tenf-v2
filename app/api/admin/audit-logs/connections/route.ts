import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getConnectionLogsDashboard, type ConnectionScope, type ConnectionType, type PeriodFilter } from "@/lib/connectionLogs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseScope(value: string | null): ConnectionScope {
  if (value === "members" || value === "general") return value;
  return "all";
}

function parsePeriod(value: string | null): PeriodFilter {
  if (value === "today" || value === "7d" || value === "30d") return value;
  return "7d";
}

function parseConnectionType(
  value: string | null
): ConnectionType | "all" | "discord_member" | "general_visitor" {
  if (value === "discord_member" || value === "general_visitor") return value;
  if (value === "discord" || value === "guest") return value;
  return "all";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const payload = await getConnectionLogsDashboard({
      scope: parseScope(searchParams.get("scope")),
      period: parsePeriod(searchParams.get("period")),
      country: searchParams.get("country") || undefined,
      member: searchParams.get("member") || undefined,
      connectionType: parseConnectionType(searchParams.get("connectionType")),
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/audit-logs/connections] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
