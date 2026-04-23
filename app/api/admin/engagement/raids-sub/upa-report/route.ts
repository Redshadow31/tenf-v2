import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { requireAdmin } from "@/lib/requireAdmin";
import { upaEventRepository } from "@/lib/repositories/UpaEventRepository";
import { supabaseAdmin } from "@/lib/db/supabase";
import { PARIS_TIMEZONE } from "@/lib/timezone";

function normalizeLogin(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function parisInclusiveRangeUtcIso(startYmd: string, endYmd: string): { startIso: string; endIso: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) {
    return null;
  }
  const startUtc = fromZonedTime(`${startYmd}T00:00:00`, PARIS_TIMEZONE);
  const endUtc = fromZonedTime(`${endYmd}T23:59:59.999`, PARIS_TIMEZONE);
  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()) || startUtc.getTime() > endUtc.getTime()) {
    return null;
  }
  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const content = await upaEventRepository.getContent("upa-event");
    const startYmd = String(content.general.startDate || "").trim();
    const endYmd = String(content.general.endDate || "").trim();
    const range = parisInclusiveRangeUtcIso(startYmd, endYmd);
    if (!range) {
      return NextResponse.json(
        { error: "Dates UPA invalides (attendu YYYY-MM-DD sur la periode dans /admin/upa-event)." },
        { status: 400 }
      );
    }

    const streamerRows = (content.streamers || [])
      .map((s) => ({
        order: typeof s.order === "number" ? s.order : 0,
        twitchLogin: normalizeLogin(s.twitchLogin),
        displayName: String(s.displayName || s.twitchLogin || "").trim(),
        upaCardActive: s.isActive !== false,
      }))
      .filter((s) => s.twitchLogin.length > 0)
      .sort((a, b) => a.order - b.order || a.twitchLogin.localeCompare(b.twitchLogin));

    const upaLogins = new Set(streamerRows.map((s) => s.twitchLogin));

    const { data: rawEvents, error } = await supabaseAdmin
      .from("raid_test_events")
      .select(
        "id,from_broadcaster_user_login,from_broadcaster_user_name,to_broadcaster_user_login,to_broadcaster_user_name,event_at,viewers,raider_live_duration_minutes,processing_status,error_reason"
      )
      .gte("event_at", range.startIso)
      .lte("event_at", range.endIso)
      .order("event_at", { ascending: false })
      .limit(8000);

    if (error) {
      console.error("[upa-report] raid_test_events:", error.message);
      return NextResponse.json({ error: "Impossible de lire les raids EventSub." }, { status: 500 });
    }

    const events = (rawEvents || []).filter((row: { processing_status?: string }) => {
      const st = String(row.processing_status || "");
      return st !== "duplicate" && st !== "error";
    });

    const byLogin = new Map<
      string,
      {
        twitchLogin: string;
        displayName: string;
        upaCardActive: boolean;
        raidsReceived: typeof events;
        raidsSent: typeof events;
      }
    >();

    for (const row of streamerRows) {
      byLogin.set(row.twitchLogin, {
        twitchLogin: row.twitchLogin,
        displayName: row.displayName || row.twitchLogin,
        upaCardActive: row.upaCardActive,
        raidsReceived: [],
        raidsSent: [],
      });
    }

    for (const ev of events) {
      const fromL = normalizeLogin((ev as { from_broadcaster_user_login?: string }).from_broadcaster_user_login);
      const toL = normalizeLogin((ev as { to_broadcaster_user_login?: string }).to_broadcaster_user_login);
      if (upaLogins.has(toL)) {
        const bucket = byLogin.get(toL);
        if (bucket) bucket.raidsReceived.push(ev);
      }
      if (upaLogins.has(fromL)) {
        const bucket = byLogin.get(fromL);
        if (bucket) bucket.raidsSent.push(ev);
      }
    }

    const streamers = streamerRows
      .map((s) => {
        const b = byLogin.get(s.twitchLogin)!;
        return {
          twitchLogin: b.twitchLogin,
          displayName: b.displayName,
          upaCardActive: b.upaCardActive,
          raidsReceivedCount: b.raidsReceived.length,
          raidsSentCount: b.raidsSent.length,
          raidsReceived: b.raidsReceived,
          raidsSent: b.raidsSent,
        };
      })
      .sort((a, b) => a.twitchLogin.localeCompare(b.twitchLogin));

    return NextResponse.json({
      period: {
        startDate: startYmd,
        endDate: endYmd,
        startIsoUtc: range.startIso,
        endIsoUtc: range.endIso,
      },
      streamers,
      meta: {
        eventsLoaded: events.length,
        streamerCardsConfigured: streamerRows.length,
      },
    });
  } catch (e) {
    console.error("[upa-report]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
