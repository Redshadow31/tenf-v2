import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { cacheGet, cacheKey, cacheSetWithNamespace } from "@/lib/cache";
import { getDashboardSummaryCached } from "@/lib/admin/dashboardSummary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_DASHBOARD_NAMESPACE = "admin_dashboard";
const AGGREGATE_TTL_SECONDS = 90;

type AggregatedPayload = {
  success: true;
  data: {
    summary: any;
    ops: {
      events: any[];
      finalNotesCount: number;
      followOverdueStaffNames: string[];
      vipMonthCount: number;
      staffApplicationsPendingCount: number;
      staffApplicationsRedFlagCount: number;
      profileValidationPendingCount: number;
      raidsPendingCount: number;
      discordPointsPendingCount: number;
      raidsIgnoredToProcessCount: number;
    };
    visual: {
      discordGrowthData: Array<{ month: string; value: number }>;
      monthlyActivityData: Array<{ month: string; messages: number; vocals: number }>;
      spotlightProgressionData: Array<{ month: string; value: number }>;
      raidStats: {
        totalRaidsReceived: number;
        totalRaidsSent: number;
        topRaiders: Array<{ rank: number; displayName: string; count: number }>;
        topTargets: Array<{ rank: number; displayName: string; count: number }>;
      };
      discordMonthStats: {
        totalMessages: number;
        totalVoiceHours: number;
        topMessages: Array<{ rank: number; displayName: string; messages: number }>;
        topVocals: Array<{ rank: number; displayName: string; display: string }>;
      };
    };
    recap: {
      recapEvents: Array<{
        event: {
          id: string;
          title: string;
          date: string;
          category: string;
          isPublished: boolean;
        };
        registrationCount: number;
        presenceCount: number;
      }>;
      upcomingKpis: {
        nextMeetingRegistrations: number;
        nextEventRegistrations: number;
        nextEventLabel: string;
        upcomingSpotlights: number;
        pendingEventValidations: number;
      };
    };
  };
  meta: {
    generatedAt: string;
    partial: boolean;
    errors: string[];
  };
};

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date = new Date()): string {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function monthLabelFromDate(date: Date): string {
  const names = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  return `${names[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

function normalizeCategoryLabel(value: string | undefined): string {
  return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type FetchContext = {
  origin: string;
  cookieHeader: string | null;
  errors: string[];
};

async function fetchJson<T>(
  ctx: FetchContext,
  path: string
): Promise<T | null> {
  try {
    const response = await fetch(`${ctx.origin}${path}`, {
      cache: "no-store",
      headers: ctx.cookieHeader ? { cookie: ctx.cookieHeader } : undefined,
    });
    if (!response.ok) {
      ctx.errors.push(`${path} -> HTTP ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    ctx.errors.push(`${path} -> ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const currentMonth = request.nextUrl.searchParams.get("month") || monthKey();
    const evaluationMonth =
      request.nextUrl.searchParams.get("evaluationMonth") || previousMonthKey();

    const aggregateCacheKey = cacheKey(
      "api",
      "admin",
      "dashboard",
      "aggregate",
      "v1",
      currentMonth,
      evaluationMonth
    );

    const cached = await cacheGet<AggregatedPayload>(aggregateCacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const ctx: FetchContext = {
      origin: request.nextUrl.origin,
      cookieHeader: request.headers.get("cookie"),
      errors: [],
    };

    const now = new Date();
    const summary = await getDashboardSummaryCached();

    const [
      eventsData,
      notesData,
      followSummaryData,
      vipMonthData,
      staffApplicationsData,
      profileValidationData,
      raidsValidationData,
      pointsQueueData,
      raidsSubSummaryData,
      dashboardPublicData,
      spotlightData,
      raidsData,
      discordMonthData,
      eventsRegistrationsData,
      integrationsData,
    ] = await Promise.all([
      fetchJson<any>(ctx, "/api/admin/members/events?limit=20"),
      fetchJson<any>(ctx, `/api/evaluations/synthesis/save?month=${encodeURIComponent(evaluationMonth)}`),
      fetchJson<any>(ctx, `/api/follow/summary/${encodeURIComponent(currentMonth)}`),
      fetchJson<any>(ctx, `/api/vip-month/save?month=${encodeURIComponent(currentMonth)}`),
      fetchJson<any>(ctx, "/api/staff-applications"),
      fetchJson<any>(ctx, "/api/admin/members/profile-validation"),
      fetchJson<any>(ctx, "/api/admin/engagement/raids-declarations?status=all"),
      fetchJson<any>(ctx, "/api/admin/engagement/raids-sub/points?includeTodo=true&includeHistory=false"),
      fetchJson<any>(ctx, "/api/admin/engagement/raids-sub/summary"),
      fetchJson<any>(ctx, "/api/dashboard/data"),
      fetchJson<any>(ctx, "/api/spotlight/progression"),
      fetchJson<any>(ctx, `/api/discord/raids/data-v2?month=${encodeURIComponent(currentMonth)}`),
      fetchJson<any>(ctx, `/api/admin/discord-activity/data?month=${encodeURIComponent(currentMonth)}`),
      fetchJson<any>(ctx, "/api/admin/events/registrations"),
      fetchJson<any>(ctx, "/api/integrations?admin=true"),
    ]);

    const followSummary = (followSummaryData?.summary || []) as Array<{
      staffName: string;
      status: string;
    }>;
    const followOverdueStaffNames = followSummary
      .filter((item) => item.status === "obsolete")
      .map((item) => item.staffName);

    const staffApplications = (staffApplicationsData?.applications || []) as Array<{
      admin_status: string;
      has_red_flag?: boolean;
    }>;
    const pendingStatuses = new Set(["nouveau", "a_contacter", "entretien_prevu"]);
    const staffApplicationsPendingCount = staffApplications.filter((app) =>
      pendingStatuses.has(app.admin_status)
    ).length;
    const staffApplicationsRedFlagCount = staffApplications.filter((app) => app.has_red_flag).length;

    const declarations = (raidsValidationData?.declarations || []) as Array<{ status: string }>;
    const raidsPendingCount = declarations.filter(
      (item) => item.status === "processing" || item.status === "to_study"
    ).length;

    const growth = dashboardPublicData?.data?.discordGrowth || [];
    const daily = dashboardPublicData?.data?.discordDailyActivity || [];
    const byMonth = new Map<string, { date: Date; messages: number; vocals: number }>();
    for (const day of daily) {
      const d = new Date(day.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const current = byMonth.get(key) || { date: new Date(d.getFullYear(), d.getMonth(), 1), messages: 0, vocals: 0 };
      current.messages += Number(day.messages || 0);
      current.vocals += Number(day.vocals || 0);
      byMonth.set(key, current);
    }
    const monthlyActivityData = Array.from(byMonth.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12)
      .map((it) => ({
        month: monthLabelFromDate(it.date),
        messages: it.messages,
        vocals: Math.round(it.vocals * 10) / 10,
      }));

    const baseEvents = (eventsRegistrationsData?.eventsWithRegistrations || []) as Array<{
      event: {
        id: string;
        title: string;
        date: string;
        category?: string;
        isPublished?: boolean;
      };
      registrationCount: number;
      presenceCount?: number;
    }>;

    const pastEvents = baseEvents.filter((item) => new Date(item.event.date) < now);
    const recapEvents = pastEvents.map((item) => ({
      event: {
        id: item.event.id,
        title: item.event.title,
        date: item.event.date,
        category: item.event.category || "Non classé",
        isPublished: item.event.isPublished ?? false,
      },
      registrationCount: Number(item.registrationCount || 0),
      presenceCount: Number(item.presenceCount || 0),
    }));

    const pendingEventValidations = recapEvents.filter(
      (item) => item.registrationCount > 0 && item.presenceCount === 0
    ).length;

    const futureEvents = baseEvents
      .filter((item) => new Date(item.event.date) >= now)
      .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

    const findNextRegistrationCount = (matcher: (category: string) => boolean): number => {
      const found = futureEvents.find((item) => matcher(normalizeCategoryLabel(item.event.category)));
      return found?.registrationCount || 0;
    };

    let nextMeetingRegistrations = findNextRegistrationCount(
      (category) => category.includes("integration") || category.includes("reunion")
    );
    const nextEvent = futureEvents[0];
    const nextEventRegistrations = Number(nextEvent?.registrationCount || 0);
    const nextEventLabel = String(nextEvent?.event?.title || "");
    const upcomingSpotlights = futureEvents.filter((item) =>
      normalizeCategoryLabel(item.event.category).includes("spotlight")
    ).length;

    if (nextMeetingRegistrations === 0 && integrationsData?.integrations) {
      const integrations = (integrationsData.integrations || []) as Array<{
        id: string;
        date: string;
        isPublished?: boolean;
      }>;
      const nextMeeting = integrations
        .filter((integration) => integration.isPublished !== false && new Date(integration.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      if (nextMeeting?.id) {
        const regsData = await fetchJson<any>(
          ctx,
          `/api/admin/integrations/${encodeURIComponent(nextMeeting.id)}/registrations`
        );
        if (regsData) {
          nextMeetingRegistrations = (regsData.registrations || []).length;
        }
      }
    }

    const payload: AggregatedPayload = {
      success: true,
      data: {
        summary,
        ops: {
          events: (eventsData?.events || []) as any[],
          finalNotesCount: Object.keys(notesData?.finalNotes || {}).length,
          followOverdueStaffNames,
          vipMonthCount: Array.isArray(vipMonthData?.vipLogins) ? vipMonthData.vipLogins.length : 0,
          staffApplicationsPendingCount,
          staffApplicationsRedFlagCount,
          profileValidationPendingCount: (profileValidationData?.pending || []).length,
          raidsPendingCount,
          discordPointsPendingCount: Number(pointsQueueData?.counters?.todo || 0),
          raidsIgnoredToProcessCount: Number(raidsSubSummaryData?.eventStatus?.ignored || 0),
        },
        visual: {
          discordGrowthData: growth,
          monthlyActivityData,
          spotlightProgressionData: (spotlightData?.data || []) as Array<{ month: string; value: number }>,
          raidStats: {
            totalRaidsReceived: raidsData?.stats?.totalRaidsRecus || 0,
            totalRaidsSent: raidsData?.stats?.totalRaidsFaits || 0,
            topRaiders: raidsData?.stats?.topRaiders || [],
            topTargets: raidsData?.stats?.topTargets || [],
          },
          discordMonthStats: {
            totalMessages: discordMonthData?.data?.totalMessages || 0,
            totalVoiceHours: discordMonthData?.data?.totalVoiceHours || 0,
            topMessages: discordMonthData?.data?.topMessages || [],
            topVocals: discordMonthData?.data?.topVocals || [],
          },
        },
        recap: {
          recapEvents,
          upcomingKpis: {
            nextMeetingRegistrations,
            nextEventRegistrations,
            nextEventLabel,
            upcomingSpotlights,
            pendingEventValidations,
          },
        },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        partial: ctx.errors.length > 0,
        errors: ctx.errors,
      },
    };

    await cacheSetWithNamespace(
      ADMIN_DASHBOARD_NAMESPACE,
      aggregateCacheKey,
      payload,
      AGGREGATE_TTL_SECONDS
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[API Admin Dashboard Aggregate] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

