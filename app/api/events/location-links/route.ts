import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("event_location_links")
      .select("id,name,url,is_active")
      .order("name", { ascending: true });

    if (error) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("relation") && message.includes("event_location_links")) {
        return NextResponse.json({ success: true, links: [] });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      links: (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        isActive: item.is_active,
      })),
    });
  } catch (error) {
    console.error("[API events/location-links GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
