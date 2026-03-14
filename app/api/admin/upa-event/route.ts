import { NextResponse } from "next/server";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { upaEventRepository } from "@/lib/repositories/UpaEventRepository";
import type { UpaEventContent } from "@/lib/upaEvent/types";
import { getTwitchUsers } from "@/lib/twitch";
import { buildTwitchAvatarMap, extractUniqueTwitchLogins } from "@/lib/memberAvatar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECTION = "/admin/upa-event";

export async function GET() {
  try {
    const admin = await requireSectionAccess(ADMIN_SECTION);
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const content = await upaEventRepository.getContent("upa-event");
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API admin/upa-event GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const sectionAdmin = await requireSectionAccess(ADMIN_SECTION);
    if (!sectionAdmin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const writeAdmin = await requirePermission("write");
    if (!writeAdmin) {
      return NextResponse.json({ error: "Permission ecriture requise" }, { status: 403 });
    }

    const body = await request.json();

    const existingContent = await upaEventRepository.getContent("upa-event");

    const incomingTotalRegistered = Number.parseInt(
      String(body?.totalRegistered ?? body?.content?.socialProof?.totalRegistered ?? existingContent.socialProof.totalRegistered),
      10
    );
    const totalRegistered =
      Number.isFinite(incomingTotalRegistered) && incomingTotalRegistered >= 0
        ? incomingTotalRegistered
        : existingContent.socialProof.totalRegistered;

    const staffInput = Array.isArray(body?.staff)
      ? body.staff
      : Array.isArray(body?.content?.staff)
        ? body.content.staff
        : existingContent.staff;

    const normalizedStaffDraft = (staffInput as Array<Record<string, unknown>>)
      .map((item, index) => {
        const rawLogin = String(item?.twitchLogin ?? "").trim().replace(/^@/, "").toLowerCase();
        const fallbackName = String(item?.name ?? "").trim();
        const staffTypeRaw = String(item?.staffType ?? "moderator").trim();
        const staffType = staffTypeRaw === "high_staff" ? "high_staff" : "moderator";
        const orderRaw = Number.parseInt(String(item?.order ?? index + 1), 10);
        const order = Number.isFinite(orderRaw) && orderRaw > 0 ? orderRaw : index + 1;
        return {
          id: String(item?.id || `staff-${crypto.randomUUID()}`),
          twitchLogin: rawLogin,
          name: fallbackName || rawLogin || "Membre UPA",
          role: String(item?.role ?? "").trim(),
          description: String(item?.description ?? "").trim(),
          staffType,
          avatarUrl: "",
          order,
          isActive: item?.isActive === false ? false : true,
        };
      }) as UpaEventContent["staff"];

    const uniqueLogins = extractUniqueTwitchLogins(
      normalizedStaffDraft.map((member) => ({ twitchLogin: member.twitchLogin }))
    );
    const twitchUsers = await getTwitchUsers(uniqueLogins);
    const avatarMap = buildTwitchAvatarMap(twitchUsers);
    const twitchUserMap = new Map(twitchUsers.map((user) => [user.login.toLowerCase(), user]));

    const enrichedStaff = normalizedStaffDraft.map((member) => {
      const user = twitchUserMap.get(member.twitchLogin);
      return {
        ...member,
        name: user?.display_name || member.name || member.twitchLogin || "Membre UPA",
        avatarUrl: avatarMap.get(member.twitchLogin) || member.avatarUrl || "",
      };
    });

    const nextContent: UpaEventContent = {
      ...existingContent,
      socialProof: {
        ...existingContent.socialProof,
        totalRegistered,
        socialProofMessage: `Deja ${totalRegistered} participants inscrits`,
      },
      staff: enrichedStaff,
    };

    const content = await upaEventRepository.upsertContent("upa-event", nextContent, writeAdmin.discordId);

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API admin/upa-event PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
