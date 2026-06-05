import { NextRequest, NextResponse } from "next/server";
import { exportMemberRgpdData } from "@/lib/admin/rgpd/memberRgpdService";
import { requirePermission } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const twitchLogin = new URL(request.url).searchParams.get("twitchLogin")?.trim().toLowerCase() || "";
    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin requis." }, { status: 400 });
    }

    const bundle = await exportMemberRgpdData(twitchLogin);
    if (!bundle) {
      return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    if (download) {
      const filename = `tenf-rgpd-${twitchLogin}-${new Date().toISOString().slice(0, 10)}.json`;
      return new NextResponse(JSON.stringify(bundle, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error("[admin/rgpd/export] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
