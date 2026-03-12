import { NextResponse } from "next/server";
import { getPublicStreamPlanningsByTwitchLogin } from "@/lib/memberPlanningStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: { twitchLogin: string } }
) {
  try {
    const twitchLogin = decodeURIComponent(params.twitchLogin || "").trim().toLowerCase();
    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin requis" }, { status: 400 });
    }

    const all = await getPublicStreamPlanningsByTwitchLogin(twitchLogin);
    const now = new Date();
    const upcoming = all.filter((planning) => {
      const dateTime = new Date(`${planning.date}T${planning.time}`);
      return !Number.isNaN(dateTime.getTime()) && dateTime >= now;
    });

    return NextResponse.json({ plannings: upcoming.slice(0, 60) });
  } catch (error) {
    console.error("[members/public/[twitchLogin]/stream-plannings] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

