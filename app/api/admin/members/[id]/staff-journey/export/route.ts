import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { fetchMemberStaffJourneyExtras } from "@/lib/admin/members-gestion/memberStaffJourney";
import { buildUnifiedMemberJourney } from "@/lib/admin/members-gestion/unifiedMemberJourney";
import { normalizeTimeline } from "@/lib/admin/members-gestion/memberTimeline";
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

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requirePermission("read");
    if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const member = await resolveMember(params.id);
    if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    const timeline = normalizeTimeline(member.roleHistory as unknown[]);
    const extras = await fetchMemberStaffJourneyExtras(
      member.memberId,
      member.twitchLogin,
    );
    const unified = buildUnifiedMemberJourney({
      timeline,
      staffPeriods: extras.staffPeriods,
      createdAt: member.createdAt,
      integrationDate: member.integrationDate,
    });

    const lines = [
      ["type", "date", "titre", "sous_titre", "detail", "badges"].join(","),
      ...unified.map((item) =>
        [
          item.kind,
          item.at,
          item.title,
          item.subtitle ?? "",
          item.detail ?? "",
          item.badges.join(" | "),
        ]
          .map((c) => csvEscape(String(c)))
          .join(","),
      ),
    ];

    const filename = `parcours-${member.twitchLogin || member.discordId || "membre"}.csv`;
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[staff-journey/export GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
