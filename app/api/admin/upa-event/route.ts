import { NextResponse } from "next/server";
import { requirePermission, requireSectionAccess } from "@/lib/requireAdmin";
import { upaEventRepository } from "@/lib/repositories/UpaEventRepository";
import type { UpaEventContent } from "@/lib/upaEvent/types";
import { getTwitchUsers } from "@/lib/twitch";
import { buildTwitchAvatarMap, extractUniqueTwitchLogins } from "@/lib/memberAvatar";
import { memberRepository } from "@/lib/repositories/MemberRepository";

function isDiscordPlaceholderTwitchLogin(value: string): boolean {
  const login = value.trim().toLowerCase();
  return login.startsWith("nouveau_");
}

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

    const streamersInput = Array.isArray(body?.streamers)
      ? body.streamers
      : Array.isArray(body?.content?.streamers)
        ? body.content.streamers
        : existingContent.streamers;

    const incomingStartDate = String(body?.startDate ?? body?.content?.general?.startDate ?? existingContent.general.startDate).trim();
    const incomingEndDate = String(body?.endDate ?? body?.content?.general?.endDate ?? existingContent.general.endDate).trim();
    const rawCharityUrl = String(
      body?.charityCampaignUrl ?? body?.content?.general?.charityCampaignUrl ?? existingContent.general.charityCampaignUrl ?? ""
    ).trim();
    let charityCampaignUrl = "";
    if (rawCharityUrl) {
      try {
        const parsed = new URL(rawCharityUrl);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          charityCampaignUrl = parsed.toString();
        }
      } catch {
        charityCampaignUrl = "";
      }
    }

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

    const streamersRows = streamersInput as Array<Record<string, unknown>>;
    const normalizedStreamersDraft: UpaEventContent["streamers"] = [];

    for (let index = 0; index < streamersRows.length; index++) {
      const item = streamersRows[index];
      let rawLogin = String(item?.twitchLogin ?? "").trim().replace(/^@/, "").toLowerCase();
      let fallbackDisplayName = String(item?.displayName ?? "").trim();
      const linkedMemberDiscordId = String(item?.linkedMemberDiscordId ?? "").trim();
      const orderRaw = Number.parseInt(String(item?.order ?? index + 1), 10);
      const order = Number.isFinite(orderRaw) && orderRaw > 0 ? orderRaw : index + 1;

      if (
        linkedMemberDiscordId &&
        (!rawLogin || isDiscordPlaceholderTwitchLogin(rawLogin))
      ) {
        try {
          const linked = await memberRepository.findByDiscordId(linkedMemberDiscordId);
          const fromDb = String(linked?.twitchLogin ?? "")
            .trim()
            .replace(/^@/, "")
            .toLowerCase();
          if (fromDb && !isDiscordPlaceholderTwitchLogin(fromDb)) {
            rawLogin = fromDb;
            if (!fallbackDisplayName) {
              fallbackDisplayName = String(linked?.displayName ?? "").trim() || fromDb;
            }
          }
        } catch (err) {
          console.warn("[API admin/upa-event PUT] Résolution membre lié:", err);
        }
      }

      if (!rawLogin || isDiscordPlaceholderTwitchLogin(rawLogin)) {
        continue;
      }

      normalizedStreamersDraft.push({
        id: String(item?.id || `streamer-${crypto.randomUUID()}`),
        twitchLogin: rawLogin,
        displayName: fallbackDisplayName || rawLogin || "Streamer UPA",
        avatarUrl: "",
        description: String(item?.description ?? "").trim(),
        ...(linkedMemberDiscordId ? { linkedMemberDiscordId } : {}),
        order,
        isActive: item?.isActive === false ? false : true,
      });
    }

    const uniqueLogins = extractUniqueTwitchLogins(
      [...normalizedStaffDraft, ...normalizedStreamersDraft].map((member) => ({ twitchLogin: member.twitchLogin }))
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

    const enrichedStreamers = normalizedStreamersDraft.map((member) => {
      const user = twitchUserMap.get(member.twitchLogin);
      return {
        ...member,
        displayName: user?.display_name || member.displayName || member.twitchLogin || "Streamer UPA",
        avatarUrl: avatarMap.get(member.twitchLogin) || member.avatarUrl || "",
      };
    });

    const nextContent: UpaEventContent = {
      ...existingContent,
      general: {
        ...existingContent.general,
        startDate: incomingStartDate || existingContent.general.startDate,
        endDate: incomingEndDate || existingContent.general.endDate,
        charityCampaignUrl,
      },
      socialProof: {
        ...existingContent.socialProof,
        totalRegistered,
        socialProofMessage: `Deja ${totalRegistered} participants inscrits`,
      },
      staff: enrichedStaff,
      streamers: enrichedStreamers,
    };

    const content = await upaEventRepository.upsertContent("upa-event", nextContent, writeAdmin.discordId);

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API admin/upa-event PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
