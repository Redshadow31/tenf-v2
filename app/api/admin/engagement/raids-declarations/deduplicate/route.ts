import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSectionAccess("/admin/engagement/raids-a-valider");
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
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

