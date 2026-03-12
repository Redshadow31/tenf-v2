import { NextRequest, NextResponse } from "next/server";
import { loadMemberStreamPlannings } from "@/lib/memberPlanningStorage";
import { memberRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidMonthParam(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

function toMonthKey(date: string): string {
  return date.slice(0, 7);
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

    const memberNameByLogin = new Map<string, string>();
    for (const member of activeMembers) {
      memberNameByLogin.set(
        member.twitchLogin.toLowerCase(),
        member.displayName || member.siteUsername || member.twitchLogin
      );
    }

    const items = plannings
      .filter((planning) => toMonthKey(planning.date) === monthParam)
      .sort((a, b) => {
        const aMs = new Date(`${a.date}T${a.time}`).getTime();
        const bMs = new Date(`${b.date}T${b.time}`).getTime();
        return aMs - bMs;
      })
      .map((planning) => ({
        id: planning.id,
        date: planning.date,
        time: planning.time,
        liveType: planning.liveType,
        title: planning.title,
        twitchLogin: planning.twitchLogin,
        displayName:
          memberNameByLogin.get(planning.twitchLogin.toLowerCase()) || planning.twitchLogin,
      }));

    return NextResponse.json({ month: monthParam, items });
  } catch (error) {
    console.error("[members/public/stream-plannings] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

