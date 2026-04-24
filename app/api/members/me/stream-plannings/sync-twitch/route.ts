import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import {
  createMemberStreamPlanningsBulkForUser,
  replaceMemberStreamPlanningsForUser,
} from "@/lib/memberPlanningStorage";
import {
  fetchAllTwitchChannelScheduleSegments,
  getTwitchUserIdByLogin,
  type TwitchHelixScheduleSegment,
} from "@/lib/twitchHelpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Horaires affichés comme sur le planning manuel (fuseau communauté FR). */
const DISPLAY_TIMEZONE = "Europe/Paris";

function twitchSegmentToParisSlot(segment: TwitchHelixScheduleSegment): {
  date: string;
  time: string;
  liveType: string;
  title?: string;
} | null {
  if (segment.canceled_until) return null;
  const start = new Date(segment.start_time);
  if (Number.isNaN(start.getTime())) return null;
  if (start.getTime() < Date.now() - 60_000) return null;

  const dateFmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const date = dateFmt.format(start);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(start);
  const hour = (parts.find((p) => p.type === "hour")?.value || "00").padStart(2, "0");
  const minute = (parts.find((p) => p.type === "minute")?.value || "00").padStart(2, "0");
  const time = `${hour}:${minute}`;

  const categoryName = segment.category?.name?.trim() || "";
  const titleRaw = segment.title?.trim() || "";
  let liveType = categoryName;
  if (liveType.length < 3) {
    liveType = titleRaw.length >= 3 ? titleRaw.slice(0, 80) : "Live Twitch";
  }
  const title = titleRaw.length > 0 ? titleRaw.slice(0, 120) : undefined;

  return { date, time, liveType: liveType.slice(0, 80), title };
}

async function getAuthenticatedMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) return null;
  const member = await memberRepository.findByDiscordId(session.user.discordId);
  if (!member) return null;
  return { member, discordId: session.user.discordId };
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedMember();
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const twitchLogin = (auth.member.twitchLogin || "").trim().toLowerCase();
    if (!twitchLogin) {
      return NextResponse.json(
        { error: "Aucune chaîne Twitch liée à ton profil membre." },
        { status: 400 }
      );
    }

    let broadcasterId = (auth.member.twitchId || "").trim();
    if (!broadcasterId) {
      broadcasterId = (await getTwitchUserIdByLogin(twitchLogin)) || "";
    }
    if (!broadcasterId) {
      return NextResponse.json(
        {
          error:
            "Impossible de résoudre l’identifiant Twitch. Demande une synchro ID côté admin ou vérifie ton pseudo chaîne.",
        },
        { status: 400 }
      );
    }

    const schedule = await fetchAllTwitchChannelScheduleSegments(broadcasterId);
    if (!schedule.ok) {
      if (schedule.reason === "config") {
        return NextResponse.json(
          { error: schedule.message || "Configuration Twitch incomplète côté serveur." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Impossible de contacter l’API Twitch pour le moment." },
        { status: 502 }
      );
    }

    const segments = schedule.segments;
    let skippedFiltered = 0;
    const slots: Array<{ date: string; time: string; liveType: string; title?: string }> = [];

    for (const seg of segments) {
      const slot = twitchSegmentToParisSlot(seg);
      if (!slot) {
        skippedFiltered += 1;
        continue;
      }
      slots.push(slot);
    }

    const { searchParams } = new URL(request.url);
    const replaceAll = searchParams.get("replaceAll") === "true";

    if (replaceAll) {
      const { created, skippedInvalid, removedCount } = await replaceMemberStreamPlanningsForUser(
        auth.discordId,
        twitchLogin,
        slots
      );

      return NextResponse.json({
        success: true,
        mode: "replace",
        imported: created.length,
        skippedDuplicates: 0,
        skippedInvalid,
        removedCount,
        skippedCanceledOrPast: skippedFiltered,
        segmentsFromTwitch: segments.length,
        timezoneNote: DISPLAY_TIMEZONE,
      });
    }

    const { created, skippedDuplicates, skippedInvalid } = await createMemberStreamPlanningsBulkForUser(auth.discordId, twitchLogin, slots);

    return NextResponse.json({
      success: true,
      mode: "append",
      imported: created.length,
      skippedDuplicates,
      skippedInvalid,
      skippedCanceledOrPast: skippedFiltered,
      segmentsFromTwitch: segments.length,
      timezoneNote: DISPLAY_TIMEZONE,
    });
  } catch (error) {
    console.error("[members/me/stream-plannings/sync-twitch] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
