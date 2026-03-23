import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const idsRaw = Array.isArray(body?.ids) ? body.ids : [];
    const ids = idsRaw
      .map((value: unknown) => String(value || "").trim())
      .filter((value: string) => value.length > 0)
      .slice(0, 300);

    if (ids.length === 0) {
      return NextResponse.json({ error: "Aucun id valide fourni" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from("raid_test_events").delete().in("id", ids).select("id");

    if (error) {
      return NextResponse.json({ error: "Impossible de supprimer les events" }, { status: 500 });
    }

    const deletedIds = (data || []).map((row: { id: string }) => row.id);
    return NextResponse.json({ success: true, deletedIds, requestedCount: ids.length, deletedCount: deletedIds.length });
  } catch (error) {
    console.error("[admin/engagement/raids-sub/review/bulk] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

