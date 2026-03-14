import { NextRequest, NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { buildFollowEngagementMemberDetail } from "@/lib/admin/followEngagement";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{
    discordId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { discordId } = await params;
    if (!discordId) {
      return NextResponse.json({ error: "discordId manquant" }, { status: 400 });
    }

    const detail = await buildFollowEngagementMemberDetail(discordId);
    if (!detail) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("[Admin Follow Detail] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne lors du detail follow" },
      { status: 500 }
    );
  }
}
