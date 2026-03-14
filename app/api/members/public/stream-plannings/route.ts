import { NextRequest, NextResponse } from "next/server";
import { loadMemberStreamPlannings } from "@/lib/memberPlanningStorage";
import { memberRepository } from "@/lib/repositories";
import { getTwitchUsers } from "@/lib/twitch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidMonthParam(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

function toMonthKey(date: string): string {
  return date.slice(0, 7);
}

function toUnavatarUrl(login: string): string {
  return `https://unavatar.io/twitch/${encodeURIComponent(login.toLowerCase())}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = (searchParams.get("month") || "").trim();

    if (!monthParam || !isValidMonthParam(monthParam)) {
      return NextResponse.json(
        { error: "Paramètre month requis au format YYYY-MM." },
        { status: 400 }
      );
    }

    const [plannings, activeMembers] = await Promise.all([
      loadMemberStreamPlannings(),
      memberRepository.findActive(5000, 0),
    ]);

    const memberMetaByLogin = new Map<
      string,
      { displayName: string; avatarUrl?: string; twitchUrl?: string }
    >();
    for (const member of activeMembers) {
      memberMetaByLogin.set(member.twitchLogin.toLowerCase(), {
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        avatarUrl: member.twitchStatus?.profileImageUrl || undefined,
        twitchUrl: member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`,
      });
    }

    const monthPlannings = plannings
      .filter((planning) => toMonthKey(planning.date) === monthParam)
      .sort((a, b) => {
        const aMs = new Date(`${a.date}T${a.time}`).getTime();
        const bMs = new Date(`${b.date}T${b.time}`).getTime();
        return aMs - bMs;
      });

    const monthLogins = Array.from(
      new Set(monthPlannings.map((planning) => planning.twitchLogin.toLowerCase()))
    );

    const twitchAvatarByLogin = new Map<string, string>();
    if (monthLogins.length > 0) {
      try {
        const twitchUsers = await getTwitchUsers(monthLogins);
        for (const user of twitchUsers) {
          const login = user.login?.toLowerCase();
          const avatar = user.profile_image_url?.trim();
          if (login && avatar) {
            twitchAvatarByLogin.set(login, avatar);
          }
        }
      } catch (error) {
        console.warn(
          "[members/public/stream-plannings] fallback avatars Twitch indisponibles:",
          error
        );
      }
    }

    const items = monthPlannings
      .map((planning) => {
        const normalizedLogin = planning.twitchLogin.toLowerCase();
        const memberMeta = memberMetaByLogin.get(normalizedLogin);
        const twitchAvatar = twitchAvatarByLogin.get(normalizedLogin);
        return {
          id: planning.id,
          date: planning.date,
          time: planning.time,
          endTime: (planning as any).endTime || undefined,
          liveType: planning.liveType,
          title: planning.title,
          twitchLogin: planning.twitchLogin,
          displayName: memberMeta?.displayName || planning.twitchLogin,
          avatarUrl:
            twitchAvatar ||
            memberMeta?.avatarUrl ||
            toUnavatarUrl(planning.twitchLogin),
          twitchUrl: memberMeta?.twitchUrl || `https://www.twitch.tv/${planning.twitchLogin}`,
        };
      });

    return NextResponse.json({ month: monthParam, items });
  } catch (error) {
    console.error("[members/public/stream-plannings] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

