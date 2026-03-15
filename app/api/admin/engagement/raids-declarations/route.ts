import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSectionAccess("/admin/engagement/raids-a-valider");
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get("status") || "all");
    const search = String(searchParams.get("search") || "").trim().toLowerCase();
    const month = String(searchParams.get("month") || "").trim();

    let query = supabaseAdmin
      .from("raid_declarations")
      .select(
        "id,member_discord_id,member_twitch_login,member_display_name,target_twitch_login,raid_at,is_approximate,note,status,staff_comment,reviewed_at,reviewed_by,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (status !== "all") {
      query = query.eq("status", status);
    }
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
      if (isMissingRelationError(error)) {
        return NextResponse.json({ declarations: [], backendReady: false }, { status: 200 });
      }
      return NextResponse.json({ error: "Impossible de charger les declarations" }, { status: 500 });
    }

    const declarations = (data || []).filter((row) => {
      if (!search) return true;
      const haystack = [
        row.member_display_name,
        row.member_twitch_login,
        row.target_twitch_login,
        row.note,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(search);
    });

    return NextResponse.json({ declarations, backendReady: true });
  } catch (error) {
    console.error("[api/admin/engagement/raids-declarations] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

