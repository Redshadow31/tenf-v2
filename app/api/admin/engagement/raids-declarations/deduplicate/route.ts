import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccessAny } from "@/lib/requireAdmin";
import { RAIDS_HISTORIQUE_FIABILITE_SECTION_HREFS } from "@/lib/admin/raidsFiabiliteRbac";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { logAction } from "@/lib/admin/logger";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSectionAccessAny(RAIDS_HISTORIQUE_FIABILITE_SECTION_HREFS);
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const canManage = await hasAdvancedAdminAccess(admin.discordId);
    if (!canManage) {
      return NextResponse.json({ error: "Acces reserve aux admins avances" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const month = String(body?.month || "").trim();

    let query = supabaseAdmin
      .from("raid_declarations")
      .select("id,member_twitch_login,target_twitch_login,raid_at,created_at")
      .order("created_at", { ascending: true })
      .limit(1000);

    if (/^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      const start = new Date(Date.UTC(year, monthIndex, 1)).toISOString();
      const end = new Date(Date.UTC(year, monthIndex + 1, 1)).toISOString();
      query = query.gte("raid_at", start).lt("raid_at", end);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Impossible de charger les declarations" }, { status: 500 });
    }

    const rows = data || [];
    const kept = new Set<string>();
    const toDelete: string[] = [];

    for (const row of rows) {
      const key = `${String(row.member_twitch_login || "").toLowerCase()}|${String(row.target_twitch_login || "").toLowerCase()}|${String(row.raid_at || "")}`;
      if (!key || key === "||") continue;
      if (kept.has(key)) {
        toDelete.push(String(row.id));
      } else {
        kept.add(key);
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin.from("raid_declarations").delete().in("id", toDelete);
      if (deleteError) {
        return NextResponse.json({ error: "Suppression des doublons impossible" }, { status: 500 });
      }
    }

    void logAction({
      action: "raids.declarations.deduplicate",
      resourceType: "raid_declarations",
      resourceId: month || "all",
      newValue: { removed: toDelete.length },
      metadata: {
        sourcePage: "/admin/communaute/engagement/historique-raids",
        month: month || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      removed: toDelete.length,
      message: toDelete.length > 0 ? "Doublons supprimes." : "Aucun doublon trouve.",
    });
  } catch (error) {
    console.error("[api/admin/engagement/raids-declarations/deduplicate] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

