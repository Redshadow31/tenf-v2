import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { fetchMemberStaffJourneyExtras } from "@/lib/admin/members-gestion/memberStaffJourney";
import { memberRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

type RouteParams = { params: { id: string } };

async function resolveMember(id: string) {
  const decoded = decodeURIComponent(id).trim();
  if (!decoded) return null;
  let member = await memberRepository.findByTwitchLogin(decoded);
  if (!member) member = await memberRepository.findByDiscordId(decoded);
  if (!member) member = await memberRepository.findById(decoded);
  if (!member && /^\d+$/.test(decoded)) {
    member = await memberRepository.findByTwitchId(decoded);
  }
  return member;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission("read");
    if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const member = await resolveMember(params.id);
    if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    const extras = await fetchMemberStaffJourneyExtras(
      member.memberId,
      member.twitchLogin,
    );

    return NextResponse.json(extras);
  } catch (error) {
    console.error("[staff-journey GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
