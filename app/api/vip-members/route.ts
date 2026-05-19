import { NextResponse } from "next/server";
import { memberRepository } from "@/lib/repositories";
import { getTwitchUsers } from "@/lib/twitch";
import { getVipBadgeText, getConsecutiveVipMonths } from "@/lib/vipHistory";
import { buildTwitchAvatarMap, extractUniqueTwitchLogins, resolveMemberAvatar } from "@/lib/memberAvatar";
import { resolveMonthVipLogins } from "@/lib/vipCurrentMonthLogins";

export const runtime = "nodejs";
export const revalidate = 30;

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
  vipBadge?: string;
  consecutiveMonths?: number;
}

/**
 * VIP affichés sur /vip
 * Priorité : snapshot vip-month (admin) > vip-history.json > Supabase > is_vip (sans limite 50)
 */
export async function GET() {
  try {
    const vipLogins = await resolveMonthVipLogins();
    let vipMemberData;
    let source = "vip_month_snapshot";

    if (vipLogins.length > 0) {
      const loginSet = new Set(vipLogins);
      const allMembers = await memberRepository.findAllBatched(2000, 50000);
      vipMemberData = allMembers.filter(
        (member) =>
          member.isActive !== false &&
          loginSet.has((member.twitchLogin || "").toLowerCase())
      );
      console.log(
        `[VIP Members API] Snapshot mois (${vipLogins.length} logins, ${vipMemberData.length} membres actifs)`
      );
    } else {
      source = "is_vip_flag";
      vipMemberData = await memberRepository.findVip(500, 0);
      console.log(`[VIP Members API] Fallback is_vip (${vipMemberData.length} membres)`);
    }

    if (vipMemberData.length === 0) {
      return NextResponse.json({
        members: [],
        message: "Aucun membre VIP trouvé",
        source,
      });
    }

    const twitchLogins = extractUniqueTwitchLogins(vipMemberData);
    const twitchUsers = await getTwitchUsers(twitchLogins);
    const avatarMap = buildTwitchAvatarMap(twitchUsers);

    const vipMembers: VipMember[] = vipMemberData.map((member) => {
      const normalizedLogin = member.twitchLogin.toLowerCase();
      const twitchAvatar = avatarMap.get(normalizedLogin);
      const avatar = resolveMemberAvatar(member, twitchAvatar);

      return {
        discordId: member.discordId || "",
        username: member.discordUsername || member.displayName,
        avatar,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        twitchAvatar,
        vipBadge: getVipBadgeText(member.twitchLogin),
        consecutiveMonths: getConsecutiveVipMonths(member.twitchLogin),
      };
    });

    const response = NextResponse.json({ members: vipMembers, source, count: vipMembers.length });
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("Error fetching VIP members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
