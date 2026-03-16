import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

const POINTS_CUTOFF_ISO_UTC = "2026-03-16T13:40:00.000Z";

type RaidHistoryEntry = {
  id: string;
  source: "manual" | "raids_sub";
  eventAt: string;
  targetLogin: string;
  targetLabel: string;
  viewers: number | null;
  raidStatus: "validated" | "pending" | "rejected";
  raidStatusLabel: string;
  pointsStatus: "awarded" | "pending";
  pointsStatusLabel: string;
  note: string | null;
};

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthKey(): string {
  return toMonthKey(new Date());
}

function monthRange(monthKey: string): { startIso: string; endIso: string } {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

function mapManualRaidStatus(status: string): { key: "validated" | "pending" | "rejected"; label: string } {
  if (status === "validated") return { key: "validated", label: "Valide" };
  if (status === "rejected") return { key: "rejected", label: "Refuse" };
  return { key: "pending", label: "En cours de validation" };
}

function mapEventSubRaidStatus(status: string): { key: "validated" | "pending" | "rejected"; label: string } {
  if (status === "matched") return { key: "validated", label: "Valide" };
  if (status === "received") return { key: "pending", label: "En cours de validation" };
  return { key: "rejected", label: "Refuse" };
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - idx, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedMonth = String(searchParams.get("month") || "").trim();
    const month = /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : getCurrentMonthKey();
    const { startIso, endIso } = monthRange(month);
    const cutoffMs = new Date(POINTS_CUTOFF_ISO_UTC).getTime();

    const member = await memberRepository.findByDiscordId(discordId);
    if (!member?.twitchLogin) {
      return NextResponse.json({
        month,
        months: getLast12Months(),
        entries: [],
        summary: { total: 0, validated: 0, pending: 0, rejected: 0, pointsAwarded: 0, pointsPending: 0 },
      });
    }

    const normalizedLogin = String(member.twitchLogin).toLowerCase();
    const normalizedTwitchId = member.twitchId ? String(member.twitchId) : null;

    const [manualRes, eventsubRes] = await Promise.all([
      supabaseAdmin
        .from("raid_declarations")
        .select("id,target_twitch_login,raid_at,status,staff_comment,note")
        .eq("member_discord_id", discordId)
        .gte("raid_at", startIso)
        .lt("raid_at", endIso)
        .order("raid_at", { ascending: false })
        .limit(2000),
      normalizedTwitchId
        ? supabaseAdmin
            .from("raid_test_events")
            .select(
              "id,from_broadcaster_user_id,from_broadcaster_user_login,to_broadcaster_user_login,to_broadcaster_user_name,event_at,processing_status,error_reason,viewers"
            )
            .or(`from_broadcaster_user_id.eq.${normalizedTwitchId},from_broadcaster_user_login.eq.${normalizedLogin}`)
            .gte("event_at", startIso)
            .lt("event_at", endIso)
            .order("event_at", { ascending: false })
            .limit(2000)
        : supabaseAdmin
            .from("raid_test_events")
            .select(
              "id,from_broadcaster_user_id,from_broadcaster_user_login,to_broadcaster_user_login,to_broadcaster_user_name,event_at,processing_status,error_reason,viewers"
            )
            .eq("from_broadcaster_user_login", normalizedLogin)
            .gte("event_at", startIso)
            .lt("event_at", endIso)
            .order("event_at", { ascending: false })
            .limit(2000),
    ]);

    if (manualRes.error && !isMissingRelationError(manualRes.error)) {
      return NextResponse.json({ error: "Impossible de charger l'historique manuel." }, { status: 500 });
    }
    if (eventsubRes.error && !isMissingRelationError(eventsubRes.error)) {
      return NextResponse.json({ error: "Impossible de charger l'historique raids-sub." }, { status: 500 });
    }

    const eventRows = (eventsubRes.data || []) as Array<{
      id: string;
      event_at: string;
      processing_status: string;
      to_broadcaster_user_login: string;
      to_broadcaster_user_name: string | null;
      error_reason: string | null;
      viewers: number | null;
    }>;
    const eventIds = eventRows.map((row) => row.id);

    let awardedEventIds = new Set<string>();
    if (eventIds.length > 0) {
      const pointsRes = await supabaseAdmin
        .from("raid_test_points")
        .select("raid_test_event_id,status")
        .in("raid_test_event_id", eventIds)
        .eq("status", "awarded");
      if (!pointsRes.error || isMissingRelationError(pointsRes.error)) {
        awardedEventIds = new Set((pointsRes.data || []).map((row: any) => String(row.raid_test_event_id)));
      }
    }

    const manualEntries: RaidHistoryEntry[] = ((manualRes.data || []) as Array<any>).map((row) => {
      const eventAt = String(row.raid_at);
      const raidStatus = mapManualRaidStatus(String(row.status || "processing"));
      const eventMs = new Date(eventAt).getTime();
      const pointsAwardedByDate = Number.isFinite(eventMs) && eventMs < cutoffMs;
      return {
        id: `manual:${row.id}`,
        source: "manual",
        eventAt,
        targetLogin: String(row.target_twitch_login || "").toLowerCase(),
        targetLabel: String(row.target_twitch_login || "Cible"),
        viewers: null,
        raidStatus: raidStatus.key,
        raidStatusLabel: raidStatus.label,
        pointsStatus: pointsAwardedByDate ? "awarded" : "pending",
        pointsStatusLabel: pointsAwardedByDate ? "Points attribues" : "Points en cours d'attribution",
        note: row.staff_comment || row.note || null,
      };
    });

    const eventsubEntries: RaidHistoryEntry[] = eventRows
      .filter((row) => {
        const status = String(row.processing_status || "");
        return status !== "duplicate";
      })
      .map((row) => {
        const eventAt = String(row.event_at);
        const raidStatus = mapEventSubRaidStatus(String(row.processing_status || "received"));
        const eventMs = new Date(eventAt).getTime();
        const pointsAwardedByDate = Number.isFinite(eventMs) && eventMs < cutoffMs;
        const pointsAwardedByLog = awardedEventIds.has(String(row.id));
        const awarded = pointsAwardedByDate || pointsAwardedByLog;
        const targetLogin = String(row.to_broadcaster_user_login || "").toLowerCase();
        return {
          id: `eventsub:${row.id}`,
          source: "raids_sub",
          eventAt,
          targetLogin,
          targetLabel: String(row.to_broadcaster_user_name || targetLogin || "Cible"),
          viewers: typeof row.viewers === "number" ? row.viewers : null,
          raidStatus: raidStatus.key,
          raidStatusLabel: raidStatus.label,
          pointsStatus: awarded ? "awarded" : "pending",
          pointsStatusLabel: awarded ? "Points attribues" : "Points en cours d'attribution",
          note: row.error_reason || null,
        };
      });

    const entries = [...manualEntries, ...eventsubEntries].sort(
      (a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()
    );

    const summary = {
      total: entries.length,
      validated: entries.filter((entry) => entry.raidStatus === "validated").length,
      pending: entries.filter((entry) => entry.raidStatus === "pending").length,
      rejected: entries.filter((entry) => entry.raidStatus === "rejected").length,
      pointsAwarded: entries.filter((entry) => entry.pointsStatus === "awarded").length,
      pointsPending: entries.filter((entry) => entry.pointsStatus === "pending").length,
    };

    return NextResponse.json({
      month,
      months: getLast12Months(),
      entries,
      summary,
    });
  } catch (error) {
    console.error("[members/me/raids-history] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

