"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarHeart,
  ClipboardCheck,
  HeartHandshake,
  Sparkles,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";

type EventRegistrationEntry = {
  event: {
    id: string;
    title: string;
    date: string;
    category?: string;
    isPublished?: boolean;
  };
  registrationCount: number;
  presenceCount?: number;
};

type ProposalLite = { status?: string; votesCount?: number };

type AdminMemberLite = {
  birthday?: string | null;
  twitchAffiliateDate?: string | null;
  isActive?: boolean;
};

type AggregateLite = {
  data?: {
    ops?: {
      followOverdueStaffNames?: string[];
      raidsPendingCount?: number;
      discordPointsPendingCount?: number;
      profileValidationPendingCount?: number;
    };
    visual?: {
      raidStats?: {
        totalRaidsReceived?: number;
        totalRaidsSent?: number;
      };
      discordMonthStats?: {
        totalMessages?: number;
        totalVoiceHours?: number;
      };
    };
    recap?: {
      upcomingKpis?: {
        pendingEventValidations?: number;
      };
    };
  };
};

type SpotlightProgressionLite = {
  data?: Array<{ month: string; value: number }>;
};

type UpaContentLite = {
  content?: {
    socialProof?: { totalRegistered?: number };
    staff?: Array<{ isActive?: boolean }>;
    timeline?: Array<{ status?: string }>;
  };
};

type BlockScope = "current" | "previous" | "all";
type ScopedKpis = {
  total: number;
  upcoming: number;
  totalPresences: number;
  avgRegistrations: number;
};

const sectionCardClass =
  "rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.28)]";
const denseStatCardClass =
  "rounded-xl border border-white/10 bg-black/20 p-3 min-h-[92px] flex flex-col justify-between";
const quickLinkClass =
  "rounded-lg border border-white/15 px-3 py-1.5 hover:border-[#d4af37] transition-colors";

const premiumHeroStyle: CSSProperties = {
  borderColor: "rgba(212,175,55,0.22)",
  background:
    "radial-gradient(circle at 15% 20%, rgba(212,175,55,0.18), rgba(212,175,55,0) 45%), linear-gradient(155deg, rgba(30,30,36,0.96), rgba(17,17,22,0.98))",
  boxShadow: "0 18px 42px rgba(0, 0, 0, 0.3)",
};

const premiumCardStyle: CSSProperties = {
  borderColor: "rgba(212,175,55,0.18)",
  background: "linear-gradient(155deg, rgba(30,30,36,0.95), rgba(19,19,24,0.98))",
  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
};

const softCardStyle: CSSProperties = {
  borderColor: "rgba(255,255,255,0.1)",
  background: "linear-gradient(160deg, rgba(24,24,30,0.95), rgba(15,15,20,0.96))",
};

function normalizeCategoryLabel(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseDateSafe(value: string | undefined | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKeyUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function countMonthHits(values: Array<string | null | undefined>, month: number): number {
  return values.reduce((acc, value) => {
    const date = parseDateSafe(value);
    return date && date.getUTCMonth() === month ? acc + 1 : acc;
  }, 0);
}

function countNext30Days(values: Array<string | null | undefined>, now: Date): number {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return values.reduce((acc, value) => {
    const date = parseDateSafe(value);
    if (!date) return acc;
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    let year = now.getUTCFullYear();
    let candidate = Date.UTC(year, month, day);
    if (candidate < todayUtc) {
      year += 1;
      candidate = Date.UTC(year, month, day);
    }
    const diff = Math.floor((candidate - todayUtc) / (24 * 60 * 60 * 1000));
    return diff >= 0 && diff <= 30 ? acc + 1 : acc;
  }, 0);
}

function kpiBadgeTone(value: number, target = 0): string {
  if (value <= target) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (value <= target + 2) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

function categoryTone(category: string): { dot: string; text: string } {
  const key = normalizeCategoryLabel(category);
  if (key.includes("film")) return { dot: "bg-blue-400", text: "text-blue-300" };
  if (key.includes("formation")) return { dot: "bg-emerald-400", text: "text-emerald-300" };
  if (key.includes("jeux")) return { dot: "bg-amber-400", text: "text-amber-300" };
  if (key.includes("apero")) return { dot: "bg-fuchsia-400", text: "text-fuchsia-300" };
  if (key.includes("aventura")) return { dot: "bg-cyan-400", text: "text-cyan-300" };
  return { dot: "bg-violet-400", text: "text-violet-300" };
}

function monthKeyFromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

function previousMonthKey(monthKey: string): string | null {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const date = new Date(Date.UTC(parsed.year, parsed.monthIndex, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return monthKeyFromDate(date);
}

function formatMonthLabel(monthKey: string): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return monthKey;
  const date = new Date(Date.UTC(parsed.year, parsed.monthIndex, 1));
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
}

function categorySeriesColor(category: string): string {
  const key = normalizeCategoryLabel(category);
  if (key.includes("spotlight")) return "#818cf8";
  if (key.includes("film")) return "#60a5fa";
  if (key.includes("formation")) return "#34d399";
  if (key.includes("jeux")) return "#fbbf24";
  if (key.includes("apero")) return "#f472b6";
  if (key.includes("aventura")) return "#22d3ee";
  return "#c4b5fd";
}

function linePath(
  values: number[],
  width: number,
  height: number,
  maxY: number
): string {
  if (!values.length) return "";
  const denominatorX = Math.max(1, values.length - 1);
  const safeMax = Math.max(1, maxY);
  return values
    .map((value, index) => {
      const x = (index / denominatorX) * width;
      const y = height - (Math.max(0, value) / safeMax) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPath(values: number[], width: number, height: number, maxY: number): string {
  if (!values.length) return "";
  const denominatorX = Math.max(1, values.length - 1);
  const safeMax = Math.max(1, maxY);
  const points = values.map((value, index) => {
    const x = (index / denominatorX) * width;
    const y = height - (Math.max(0, value) / safeMax) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M0,${height.toFixed(2)} L${points.join(" L")} L${width.toFixed(2)},${height.toFixed(2)} Z`;
}

function resolveEventsBasePath(pathname: string): string {
  return pathname.startsWith("/admin/communaute/evenements")
    ? "/admin/communaute/evenements"
    : "/admin/events";
}

function resolveEngagementBasePath(pathname: string): string {
  return pathname.startsWith("/admin/communaute")
    ? "/admin/communaute/engagement"
    : "/admin/engagement";
}

export default function CommunityDashboardPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRegistrationEntry[]>([]);
  const [proposals, setProposals] = useState<ProposalLite[]>([]);
  const [members, setMembers] = useState<AdminMemberLite[]>([]);
  const [aggregate, setAggregate] = useState<AggregateLite | null>(null);
  const [spotlightProgress, setSpotlightProgress] = useState<Array<{ month: string; value: number }>>([]);
  const [upaContent, setUpaContent] = useState<UpaContentLite["content"] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [selectedPresenceMonth, setSelectedPresenceMonth] = useState<string>("");
  const [comparePreviousMonth, setComparePreviousMonth] = useState<boolean>(true);
  const [enabledPresenceSeries, setEnabledPresenceSeries] = useState<Record<string, boolean>>({ all: true });
  const [comparePresenceSeries, setComparePresenceSeries] = useState<Record<string, boolean>>({ all: true });
  const [blockScopes, setBlockScopes] = useState<Record<string, BlockScope>>({});

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setLoadError(null);

        const [
          eventsRes,
          aggregateRes,
          spotlightRes,
          proposalsRes,
          membersRes,
          upaRes,
        ] = await Promise.allSettled([
          fetch("/api/admin/events/registrations", { cache: "no-store" }),
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
          fetch("/api/spotlight/progression", { cache: "no-store" }),
          fetch("/api/admin/events/proposals", { cache: "no-store" }),
          fetch("/api/admin/members", { cache: "no-store" }),
          fetch("/api/upa-event/content?slug=upa-event", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
          const payload = await eventsRes.value.json();
          setEvents((payload.eventsWithRegistrations || []) as EventRegistrationEntry[]);
        }

        if (aggregateRes.status === "fulfilled" && aggregateRes.value.ok) {
          const payload = (await aggregateRes.value.json()) as AggregateLite;
          setAggregate(payload);
        }

        if (spotlightRes.status === "fulfilled" && spotlightRes.value.ok) {
          const payload = (await spotlightRes.value.json()) as SpotlightProgressionLite;
          setSpotlightProgress(payload.data || []);
        }

        if (proposalsRes.status === "fulfilled" && proposalsRes.value.ok) {
          const payload = await proposalsRes.value.json();
          setProposals((payload.proposals || []) as ProposalLite[]);
        }

        if (membersRes.status === "fulfilled" && membersRes.value.ok) {
          const payload = await membersRes.value.json();
          setMembers((payload.members || []) as AdminMemberLite[]);
        }

        if (upaRes.status === "fulfilled" && upaRes.value.ok) {
          const payload = (await upaRes.value.json()) as UpaContentLite;
          setUpaContent(payload.content || null);
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Erreur de chargement");
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadedAt(new Date().toISOString());
        }
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedPresenceMonth) return;
    const nowMonth = monthKeyFromDate(new Date());
    setSelectedPresenceMonth(nowMonth);
  }, [selectedPresenceMonth]);

  const now = new Date();

  const metrics = useMemo(() => {
    const normalized = events.map((item) => {
      const date = parseDateSafe(item.event.date) || now;
      return {
        ...item,
        date,
        categoryKey: normalizeCategoryLabel(item.event.category),
      };
    });

    const upcoming = normalized.filter((item) => item.date.getTime() >= now.getTime());
    const past = normalized.filter((item) => item.date.getTime() < now.getTime());
    const spotlightItems = normalized.filter((item) => item.categoryKey.includes("spotlight"));
    const spotlightPast = spotlightItems.filter((item) => item.date.getTime() < now.getTime());
    const spotlightUpcoming = spotlightItems.filter((item) => item.date.getTime() >= now.getTime());

    const totalRegistrations = normalized.reduce((acc, item) => acc + Number(item.registrationCount || 0), 0);
    const totalPresence = past.reduce((acc, item) => acc + Number(item.presenceCount || 0), 0);
    const publishedCount = normalized.filter((item) => item.event.isPublished).length;

    const proposalsPending = proposals.filter((proposal) => {
      const status = (proposal.status || "").toLowerCase();
      return status === "pending" || status === "nouveau" || status === "to_review";
    }).length;
    const proposalsHot = proposals.filter((proposal) => Number(proposal.votesCount || 0) >= 5).length;

    const spotlightTrend =
      spotlightProgress.length >= 2
        ? Number(spotlightProgress[spotlightProgress.length - 1]?.value || 0) -
          Number(spotlightProgress[spotlightProgress.length - 2]?.value || 0)
        : 0;

    const birthdays = members.map((member) => member.birthday);
    const affiliateDates = members.map((member) => member.twitchAffiliateDate);
    const month = now.getUTCMonth();

    const upaRegistered = Number(upaContent?.socialProof?.totalRegistered || 0);
    const upaStaffActive = (upaContent?.staff || []).filter((member) => member.isActive !== false).length;
    const upaTimelineOpen = (upaContent?.timeline || []).filter(
      (item) => (item.status || "").toLowerCase() !== "done"
    ).length;

    const raidsReceived = Number(aggregate?.data?.visual?.raidStats?.totalRaidsReceived || 0);
    const raidsSent = Number(aggregate?.data?.visual?.raidStats?.totalRaidsSent || 0);
    const followOverdue = (aggregate?.data?.ops?.followOverdueStaffNames || []).length;
    const raidsPending = Number(aggregate?.data?.ops?.raidsPendingCount || 0);
    const discordPointsPending = Number(aggregate?.data?.ops?.discordPointsPendingCount || 0);
    const pendingPresenceValidations = Number(
      aggregate?.data?.recap?.upcomingKpis?.pendingEventValidations || 0
    );

    return {
      global: {
        totalEvents: normalized.length,
        upcomingEvents: upcoming.length,
        totalRegistrations,
        totalPresence,
        publishedRate: normalized.length > 0 ? Math.round((publishedCount / normalized.length) * 100) : 0,
        pendingPresenceValidations,
      },
      events: {
        total: normalized.length,
        upcoming: upcoming.length,
        avgRegistrations: normalized.length > 0 ? Math.round((totalRegistrations / normalized.length) * 10) / 10 : 0,
        proposalsPending,
        proposalsHot,
        pendingPresenceValidations,
      },
      spotlight: {
        total: spotlightItems.length,
        upcoming: spotlightUpcoming.length,
        avgPresencePast:
          spotlightPast.length > 0
            ? Math.round(
                (spotlightPast.reduce((acc, item) => acc + Number(item.presenceCount || 0), 0) / spotlightPast.length) *
                  10
              ) / 10
            : 0,
        trend: Math.round(spotlightTrend * 10) / 10,
      },
      eventsByType: (() => {
        const currentMonthKey = monthKeyUtc(now);
        const previousDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
        const previousMonthKey = monthKeyUtc(previousDate);

        const grouped = new Map<
          string,
          {
            category: string;
            total: number;
            upcoming: number;
            totalRegistrations: number;
            pastPresenceTotal: number;
            pastCount: number;
            currentMonthPresenceTotal: number;
            previousMonthPresenceTotal: number;
          }
        >();

        for (const item of normalized) {
          const category = item.event.category || "Non classé";
          const key = normalizeCategoryLabel(category) || "non-classe";
          const bucket = grouped.get(key) || {
            category,
            total: 0,
            upcoming: 0,
            totalRegistrations: 0,
            pastPresenceTotal: 0,
            pastCount: 0,
            currentMonthPresenceTotal: 0,
            previousMonthPresenceTotal: 0,
          };

          bucket.total += 1;
          bucket.totalRegistrations += Number(item.registrationCount || 0);
          if (item.date.getTime() >= now.getTime()) {
            bucket.upcoming += 1;
          } else {
            bucket.pastPresenceTotal += Number(item.presenceCount || 0);
            bucket.pastCount += 1;
          }

          const itemMonthKey = monthKeyUtc(item.date);
          if (itemMonthKey === currentMonthKey) {
            bucket.currentMonthPresenceTotal += Number(item.presenceCount || 0);
          } else if (itemMonthKey === previousMonthKey) {
            bucket.previousMonthPresenceTotal += Number(item.presenceCount || 0);
          }

          grouped.set(key, bucket);
        }

        return Array.from(grouped.entries())
          .filter(([key]) => !key.includes("spotlight"))
          .map(([, bucket]) => ({
            category: bucket.category,
            total: bucket.total,
            upcoming: bucket.upcoming,
            avgRegistrations:
              bucket.total > 0 ? Math.round((bucket.totalRegistrations / bucket.total) * 10) / 10 : 0,
            avgPresencePast:
              bucket.pastCount > 0 ? Math.round((bucket.pastPresenceTotal / bucket.pastCount) * 10) / 10 : 0,
            trend: Math.round((bucket.currentMonthPresenceTotal - bucket.previousMonthPresenceTotal) * 10) / 10,
          }))
          .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category, "fr"));
      })(),
      birthdays: {
        thisMonth: countMonthHits(birthdays, month),
        affiliateThisMonth: countMonthHits(affiliateDates, month),
        next30Days: countNext30Days(birthdays, now),
        affiliateNext30Days: countNext30Days(affiliateDates, now),
      },
      upa: {
        totalRegistered: upaRegistered,
        activeStaff: upaStaffActive,
        timelineOpen: upaTimelineOpen,
      },
      engagement: {
        raidsReceived,
        raidsSent,
        followOverdue,
        raidsPending,
        discordPointsPending,
        discordMessages: Number(aggregate?.data?.visual?.discordMonthStats?.totalMessages || 0),
        discordVoiceHours: Number(aggregate?.data?.visual?.discordMonthStats?.totalVoiceHours || 0),
      },
    };
  }, [aggregate, events, members, now, proposals, spotlightProgress, upaContent]);

  const normalizedEventRows = useMemo(() => {
    return events.map((item) => {
      const date = parseDateSafe(item.event.date) || now;
      return {
        ...item,
        date,
        category: item.event.category || "Non classé",
        categoryKey: normalizeCategoryLabel(item.event.category || "Non classé"),
        presenceCount: Number(item.presenceCount || 0),
        registrationCount: Number(item.registrationCount || 0),
      };
    });
  }, [events, now]);

  const scopedEventBlocks = useMemo(() => {
    const currentMonth = monthKeyUtc(now);
    const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
    const previousMonth = monthKeyUtc(prevDate);

    const filterByScope = (
      rows: typeof normalizedEventRows,
      scope: BlockScope
    ): typeof normalizedEventRows => {
      if (scope === "all") return rows;
      const target = scope === "current" ? currentMonth : previousMonth;
      return rows.filter((row) => monthKeyUtc(row.date) === target);
    };

    const computeKpis = (rows: typeof normalizedEventRows): ScopedKpis => {
      const total = rows.length;
      const upcoming = rows.filter((row) => row.date.getTime() >= now.getTime()).length;
      const totalPresences = rows.reduce((sum, row) => sum + Number(row.presenceCount || 0), 0);
      const totalRegistrations = rows.reduce((sum, row) => sum + Number(row.registrationCount || 0), 0);
      return {
        total,
        upcoming,
        totalPresences,
        avgRegistrations: total > 0 ? Math.round((totalRegistrations / total) * 10) / 10 : 0,
      };
    };

    const buildScoped = (rows: typeof normalizedEventRows) => ({
      current: computeKpis(filterByScope(rows, "current")),
      previous: computeKpis(filterByScope(rows, "previous")),
      all: computeKpis(filterByScope(rows, "all")),
    });

    const globalRows = normalizedEventRows;
    const spotlightRows = normalizedEventRows.filter((row) => row.categoryKey.includes("spotlight"));

    const byTypeMap = new Map<
      string,
      {
        key: string;
        label: string;
        scoped: Record<BlockScope, ScopedKpis>;
      }
    >();

    normalizedEventRows
      .filter((row) => !row.categoryKey.includes("spotlight"))
      .forEach((row) => {
        const existing = byTypeMap.get(row.categoryKey);
        if (existing) return;
        const rowsForType = normalizedEventRows.filter((candidate) => candidate.categoryKey === row.categoryKey);
        byTypeMap.set(row.categoryKey, {
          key: row.categoryKey || "non-classe",
          label: row.category,
          scoped: buildScoped(rowsForType),
        });
      });

    const byType = Array.from(byTypeMap.values()).sort(
      (a, b) => b.scoped.all.total - a.scoped.all.total || a.label.localeCompare(b.label, "fr")
    );

    return {
      global: buildScoped(globalRows),
      spotlight: buildScoped(spotlightRows),
      byType,
    };
  }, [normalizedEventRows, now]);

  const eventsBasePath = useMemo(() => resolveEventsBasePath(pathname), [pathname]);
  const engagementBasePath = useMemo(() => resolveEngagementBasePath(pathname), [pathname]);
  const raidsHistoryPath = useMemo(
    () => (pathname.startsWith("/admin/communaute") ? "/admin/communaute/engagement/historique-raids" : "/admin/raids"),
    [pathname]
  );
  const anniversairesBasePath = useMemo(
    () => (pathname.startsWith("/admin/communaute") ? "/admin/communaute/anniversaires" : "/admin/events/anniversaires"),
    [pathname]
  );

  const presenceTrend = useMemo(() => {
    const parsed = parseMonthKey(selectedPresenceMonth || monthKeyFromDate(new Date()));
    if (!parsed) {
      return {
        monthOptions: [] as string[],
        currentLabel: "",
        previousLabel: "",
        dayCount: 31,
        maxY: 1,
        totalCurrent: [] as number[],
        totalPrevious: [] as number[],
        categories: [] as Array<{ name: string; color: string; current: number[]; previous: number[] }>,
      };
    }

    const currentMonthKey = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, "0")}`;
    const prevMonthKey = previousMonthKey(currentMonthKey);
    const monthKeys = Array.from(
      new Set(
        events
          .map((item) => parseDateSafe(item.event.date))
          .filter((date): date is Date => !!date)
          .map((date) => monthKeyFromDate(date))
          .concat(currentMonthKey)
      )
    ).sort((a, b) => (a < b ? 1 : -1));

    const dayCount = new Date(Date.UTC(parsed.year, parsed.monthIndex + 1, 0)).getUTCDate();
    const createSeries = () => Array.from({ length: dayCount }, () => 0);

    const totalCurrent = createSeries();
    const totalPrevious = createSeries();
    const categoryMap = new Map<
      string,
      { name: string; color: string; current: number[]; previous: number[]; totalCurrent: number }
    >();

    const getCategorySeries = (categoryName: string) => {
      const key = normalizeCategoryLabel(categoryName || "Non classé") || "non-classe";
      const existing = categoryMap.get(key);
      if (existing) return existing;
      const created = {
        name: categoryName || "Non classé",
        color: categorySeriesColor(categoryName || ""),
        current: createSeries(),
        previous: createSeries(),
        totalCurrent: 0,
      };
      categoryMap.set(key, created);
      return created;
    };

    for (const item of events) {
      const eventDate = parseDateSafe(item.event.date);
      if (!eventDate) continue;
      const eventMonthKey = monthKeyFromDate(eventDate);
      const day = eventDate.getUTCDate();
      if (day < 1 || day > dayCount) continue;
      const index = day - 1;
      const count = Number(item.presenceCount || 0);
      const category = getCategorySeries(item.event.category || "Non classé");

      if (eventMonthKey === currentMonthKey) {
        totalCurrent[index] += count;
        category.current[index] += count;
        category.totalCurrent += count;
      } else if (comparePreviousMonth && prevMonthKey && eventMonthKey === prevMonthKey) {
        totalPrevious[index] += count;
        category.previous[index] += count;
      }
    }

    const categories = Array.from(categoryMap.values())
      .filter((series) => series.current.some((value) => value > 0) || series.previous.some((value) => value > 0))
      .sort((a, b) => b.totalCurrent - a.totalCurrent || a.name.localeCompare(b.name, "fr"));

    const maxY = Math.max(
      1,
      ...totalCurrent,
      ...(comparePreviousMonth ? totalPrevious : []),
      ...categories.flatMap((series) => [...series.current, ...(comparePreviousMonth ? series.previous : [])])
    );

    return {
      monthOptions: monthKeys,
      currentLabel: formatMonthLabel(currentMonthKey),
      previousLabel: prevMonthKey ? formatMonthLabel(prevMonthKey) : "",
      dayCount,
      maxY,
      totalCurrent,
      totalPrevious,
      categories,
    };
  }, [comparePreviousMonth, events, selectedPresenceMonth]);

  useEffect(() => {
    const categoryNames = presenceTrend.categories.map((series) => series.name);
    setEnabledPresenceSeries((prev) => {
      const next: Record<string, boolean> = { all: prev.all ?? true };
      for (const name of categoryNames) {
        next[name] = prev[name] ?? true;
      }
      return next;
    });
    setComparePresenceSeries((prev) => {
      const next: Record<string, boolean> = { all: prev.all ?? true };
      for (const name of categoryNames) {
        next[name] = prev[name] ?? false;
      }
      return next;
    });
  }, [presenceTrend.categories]);

  const actionBoard = useMemo(() => {
    return [
      {
        id: "presence-validations",
        label: "Valider les présences des événements passés",
        count: metrics.events.pendingPresenceValidations,
        href: `${eventsBasePath}/participation`,
      },
      {
        id: "proposals-pending",
        label: "Traiter les propositions d'événements",
        count: metrics.events.proposalsPending,
        href: `${eventsBasePath}/propositions`,
      },
      {
        id: "follow-overdue",
        label: "Relancer les follows en retard",
        count: metrics.engagement.followOverdue,
        href: `${engagementBasePath}/follow`,
      },
      {
        id: "raids-pending",
        label: "Finaliser les raids en attente",
        count: metrics.engagement.raidsPending,
        href: pathname.startsWith("/admin/communaute")
          ? "/admin/communaute/engagement/signalements-raids"
          : "/admin/engagement/raids-a-valider",
      },
      {
        id: "points-discord",
        label: "Valider les points Discord raids",
        count: metrics.engagement.discordPointsPending,
        href: `${engagementBasePath}/points-discord`,
      },
      {
        id: "spotlight-next",
        label: "Préparer les prochains Spotlights",
        count: metrics.spotlight.upcoming,
        href: `${eventsBasePath}/spotlight`,
      },
    ]
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [engagementBasePath, eventsBasePath, metrics, pathname]);

  const loadedAtLabel = useMemo(() => {
    if (!loadedAt) return "Mise à jour en cours";
    const date = new Date(loadedAt);
    if (Number.isNaN(date.getTime())) return "Mise à jour récente";
    return `Dernière synchro: ${date.toLocaleString("fr-FR")}`;
  }, [loadedAt]);

  const presenceChartUi = useMemo(() => {
    const seriesStates = presenceTrend.categories.map((series) => ({
      ...series,
      enabled: enabledPresenceSeries[series.name] ?? true,
      compareEnabled: comparePresenceSeries[series.name] ?? false,
    }));
    const visibleCategories = seriesStates.filter((series) => series.enabled);
    const allEnabled = enabledPresenceSeries.all ?? true;
    const allCompareEnabled = comparePresenceSeries.all ?? true;

    const dayCount = presenceTrend.dayCount;
    const zeroSeries = Array.from({ length: dayCount }, () => 0);
    const displayedCurrent = allEnabled
      ? [...presenceTrend.totalCurrent]
      : visibleCategories.reduce((acc, series) => acc.map((value, index) => value + series.current[index]), [...zeroSeries]);
    const displayedPrevious = comparePreviousMonth
      ? allCompareEnabled
        ? [...presenceTrend.totalPrevious]
        : seriesStates
            .filter((series) => series.compareEnabled)
            .reduce((acc, series) => acc.map((value, index) => value + series.previous[index]), [...zeroSeries])
      : [...zeroSeries];

    const maxY = Math.max(
      1,
      ...displayedCurrent,
      ...(comparePreviousMonth ? displayedPrevious : []),
      ...visibleCategories.flatMap((series) => [
        ...series.current,
        ...(comparePreviousMonth && series.compareEnabled ? series.previous : []),
      ])
    );

    const xTicks = Array.from({ length: Math.min(6, presenceTrend.dayCount) }, (_, idx) =>
      Math.max(
        1,
        Math.round((idx / Math.max(1, Math.min(6, presenceTrend.dayCount) - 1)) * (presenceTrend.dayCount - 1)) + 1
      )
    );

    const yTicks = [maxY, Math.round(maxY / 2), 0];
    const totalCurrentValue = displayedCurrent.reduce((sum, value) => sum + value, 0);
    const totalPreviousValue = displayedPrevious.reduce((sum, value) => sum + value, 0);
    const peakValue = Math.max(0, ...displayedCurrent);
    const peakDayIndex = displayedCurrent.findIndex((value) => value === peakValue);

    return {
      allEnabled,
      allCompareEnabled,
      maxY,
      displayedCurrent,
      displayedPrevious,
      seriesStates,
      visibleCategories,
      xTicks,
      yTicks,
      totalCurrentValue,
      totalPreviousValue,
      peakValue,
      peakDayLabel: peakDayIndex >= 0 ? `J${peakDayIndex + 1}` : "-",
    };
  }, [comparePreviousMonth, comparePresenceSeries, enabledPresenceSeries, presenceTrend]);

  const scopeLabel: Record<BlockScope, string> = {
    current: "Mois en cours",
    previous: "Comparatif M-1",
    all: "Tous",
  };

  const getScope = (blockId: string): BlockScope => blockScopes[blockId] || "current";
  const setScope = (blockId: string, scope: BlockScope) =>
    setBlockScopes((prev) => ({ ...prev, [blockId]: scope }));

  return (
    <div className="text-white space-y-8">
      <div className="rounded-2xl border p-6 md:p-7" style={premiumHeroStyle}>
        <Link
          href={pathname.startsWith("/admin/communaute") ? "/admin/communaute" : "/admin/dashboard"}
          className="text-gray-300 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au Dashboard
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#fff4cf] via-[#f4d27a] to-[#d4af37] bg-clip-text text-transparent">
              Vie communautaire - Dashboard de pilotage
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Vision consolidée de la communauté: événements, Spotlight, anniversaires, UPA Event et engagement.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
            {loadedAtLabel}
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
          Chargement partiel: {loadError}
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Vue globale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Événements total</p>
            <p className="mt-2 text-3xl font-bold">{metrics.global.totalEvents}</p>
            <p className="mt-2 text-xs text-gray-400">{metrics.global.upcomingEvents} à venir</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Inscriptions total</p>
            <p className="mt-2 text-3xl font-bold">{metrics.global.totalRegistrations}</p>
            <p className="mt-2 text-xs text-gray-400">{metrics.global.totalPresence} présences validées</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Taux de publication</p>
            <p className="mt-2 text-3xl font-bold">{metrics.global.publishedRate}%</p>
            <p className="mt-2 text-xs text-gray-400">Qualité de mise en ligne des événements</p>
          </div>
          <div className={`${sectionCardClass} min-h-[138px]`} style={premiumCardStyle}>
            <p className="text-sm text-gray-400">Présences à valider</p>
            <p className={`mt-2 text-3xl font-bold ${metrics.global.pendingPresenceValidations > 0 ? "text-amber-300" : "text-emerald-300"}`}>
              {metrics.global.pendingPresenceValidations}
            </p>
            <p className="mt-2 text-xs text-gray-400">Priorité opérationnelle du jour</p>
          </div>
        </div>
        <div className={`${sectionCardClass} mt-4`} style={softCardStyle}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Courbes de présence par type d'événement</h3>
              <p className="text-xs text-gray-400">
                Données synchronisées avec le récap événements. Comparaison journalière {presenceTrend.currentLabel}
                {comparePreviousMonth && presenceTrend.previousLabel ? ` vs ${presenceTrend.previousLabel}` : ""}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPresenceMonth}
                onChange={(e) => setSelectedPresenceMonth(e.target.value)}
                className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white focus:border-[#d4af37] focus:outline-none"
              >
                {presenceTrend.monthOptions.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-gray-200">
                <input
                  type="checkbox"
                  checked={comparePreviousMonth}
                  onChange={(e) => setComparePreviousMonth(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-[#101018] text-[#d4af37] focus:ring-[#d4af37]/30"
                />
                Comparer M-1
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.06),rgba(255,255,255,0)_45%),linear-gradient(160deg,rgba(10,12,24,0.95),rgba(10,10,16,0.98))] p-4">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Total mois</p>
                <p className="text-lg font-semibold text-white">{presenceChartUi.totalCurrentValue}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Pic journalier</p>
                <p className="text-lg font-semibold text-white">
                  {presenceChartUi.peakValue} <span className="text-sm text-gray-400">({presenceChartUi.peakDayLabel})</span>
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Delta vs M-1</p>
                <p
                  className={`text-lg font-semibold ${
                    presenceChartUi.totalCurrentValue - presenceChartUi.totalPreviousValue >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {presenceChartUi.totalCurrentValue - presenceChartUi.totalPreviousValue >= 0 ? "+" : ""}
                  {presenceChartUi.totalCurrentValue - presenceChartUi.totalPreviousValue}
                </p>
              </div>
            </div>

            <div className="relative h-[340px] w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <svg viewBox="0 0 1000 340" className="h-full w-full">
                <rect x="0" y="0" width="1000" height="340" fill="transparent" />
                {presenceChartUi.yTicks.map((tick, idx) => {
                  const y = 20 + ((presenceChartUi.maxY - tick) / Math.max(1, presenceChartUi.maxY)) * 260;
                  return (
                    <g key={`grid-y-${idx}`}>
                      <line x1="0" y1={y.toFixed(2)} x2="1000" y2={y.toFixed(2)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      <text x="8" y={(y - 6).toFixed(2)} fill="rgba(203,213,225,0.7)" fontSize="11">
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {presenceChartUi.xTicks.map((day, idx) => {
                  const x = ((day - 1) / Math.max(1, presenceTrend.dayCount - 1)) * 1000;
                  return (
                    <g key={`grid-x-${idx}`}>
                      <line x1={x.toFixed(2)} y1="20" x2={x.toFixed(2)} y2="280" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <text x={x.toFixed(2)} y="312" textAnchor="middle" fill="rgba(203,213,225,0.75)" fontSize="11">
                        J{day}
                      </text>
                    </g>
                  );
                })}

                <path
                  d={areaPath(presenceChartUi.displayedCurrent, 1000, 260, presenceChartUi.maxY)}
                  transform="translate(0,20)"
                  fill="url(#totalAreaFill)"
                  opacity="0.95"
                />
                <defs>
                  <linearGradient id="totalAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(248,250,252,0.24)" />
                    <stop offset="100%" stopColor="rgba(248,250,252,0.01)" />
                  </linearGradient>
                </defs>

                {presenceChartUi.visibleCategories.map((series) => (
                  <path
                    key={`series-current-${series.name}`}
                    d={linePath(series.current, 1000, 260, presenceChartUi.maxY)}
                    transform="translate(0,20)"
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2.2"
                    opacity="0.95"
                  />
                ))}

                {presenceChartUi.allEnabled ? (
                  <path
                    d={linePath(presenceTrend.totalCurrent, 1000, 260, presenceChartUi.maxY)}
                    transform="translate(0,20)"
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="3"
                    opacity="1"
                  />
                ) : null}

                {comparePreviousMonth && (
                  <>
                    {presenceChartUi.visibleCategories
                      .filter((series) => series.compareEnabled)
                      .map((series) => (
                      <path
                        key={`series-prev-${series.name}`}
                        d={linePath(series.previous, 1000, 260, presenceChartUi.maxY)}
                        transform="translate(0,20)"
                        fill="none"
                        stroke={series.color}
                        strokeWidth="1.4"
                        strokeDasharray="5 4"
                        opacity="0.62"
                      />
                    ))}
                    {presenceChartUi.allCompareEnabled ? (
                      <path
                        d={linePath(presenceTrend.totalPrevious, 1000, 260, presenceChartUi.maxY)}
                        transform="translate(0,20)"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray="7 5"
                        opacity="0.85"
                      />
                    ) : null}
                  </>
                )}
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setEnabledPresenceSeries((prev) => ({ ...prev, all: !(prev.all ?? true) }))
                }
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${
                  presenceChartUi.allEnabled
                    ? "border-white/[0.35] bg-white/[0.12] text-white"
                    : "border-white/15 bg-white/5 text-gray-300 hover:text-white"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-slate-100" />
                Tous types ({presenceTrend.currentLabel})
              </button>
              {comparePreviousMonth && presenceTrend.previousLabel ? (
                <button
                  type="button"
                  onClick={() =>
                    setComparePresenceSeries((prev) => ({ ...prev, all: !(prev.all ?? true) }))
                  }
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${
                    presenceChartUi.allCompareEnabled
                      ? "border-white/[0.35] bg-white/[0.12] text-white"
                      : "border-white/15 bg-white/5 text-gray-300 hover:text-white"
                  }`}
                >
                  <span className="h-0.5 w-5 bg-slate-300" style={{ borderTop: "2px dashed #cbd5e1" }} />
                  M-1 ({presenceTrend.previousLabel})
                </button>
              ) : null}
              {presenceChartUi.seriesStates.map((series) => (
                <span
                  key={`legend-${series.name}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors ${
                    series.enabled
                      ? "border-white/[0.35] bg-white/[0.12] text-white"
                      : "border-white/15 bg-white/5 text-gray-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledPresenceSeries((prev) => ({ ...prev, [series.name]: !(prev[series.name] ?? true) }))
                    }
                    className="inline-flex items-center gap-2 rounded-full px-1.5 py-0.5 hover:bg-white/10"
                    title="Afficher/masquer la courbe du type"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                    {series.name}
                  </button>
                  {comparePreviousMonth ? (
                    <button
                      type="button"
                      onClick={() =>
                        setComparePresenceSeries((prev) => ({
                          ...prev,
                          [series.name]: !(prev[series.name] ?? false),
                        }))
                      }
                      className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                        series.compareEnabled
                          ? "border-white/35 bg-white/20 text-white"
                          : "border-white/15 bg-transparent text-gray-300 hover:text-white"
                      }`}
                      title="Activer/désactiver la comparaison M-1 pour ce type"
                    >
                      M-1
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">À traiter maintenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {actionBoard.length === 0 ? (
            <div className={`${sectionCardClass} text-sm text-emerald-300 xl:col-span-3`} style={softCardStyle}>
              Aucun backlog critique détecté pour le moment.
            </div>
          ) : (
            actionBoard.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`${sectionCardClass} min-h-[112px] transition hover:border-[#d4af37]/60 hover:-translate-y-[1px]`}
                style={softCardStyle}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span
                    className={`inline-flex min-w-10 justify-center rounded-full border px-2 py-1 text-xs font-semibold ${kpiBadgeTone(
                      item.count,
                      0
                    )}`}
                  >
                    {item.count}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Action directe en un clic</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          {(() => {
            const blockId = "events-global";
            const currentScope = getScope(blockId);
            const scoped = scopedEventBlocks.global[currentScope];
            return (
              <>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Événements</h3>
          </div>
          <div className="mb-3 inline-flex rounded-lg border border-white/15 bg-black/20 p-1 text-xs">
            {(Object.keys(scopeLabel) as BlockScope[]).map((scope) => (
              <button
                key={`${blockId}-${scope}`}
                type="button"
                onClick={() => setScope(blockId, scope)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  currentScope === scope ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {scopeLabel[scope]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Événements</p>
              <p className="text-2xl font-bold mt-1">{scoped.total}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moy. inscriptions</p>
              <p className="text-2xl font-bold mt-1">{scoped.avgRegistrations}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Présences total</p>
              <p className="text-2xl font-bold mt-1">{scoped.totalPresences}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">À venir</p>
              <p className="text-2xl font-bold mt-1">{scoped.upcoming}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href={`${eventsBasePath}/calendrier`} className={quickLinkClass}>
              Calendrier
            </Link>
            <Link href={`${eventsBasePath}/liste`} className={quickLinkClass}>
              Liste des événements
            </Link>
            <Link href={`${eventsBasePath}/propositions`} className={quickLinkClass}>
              Propositions
            </Link>
            <Link href={`${eventsBasePath}/recap`} className={quickLinkClass}>
              Récapitulatif
            </Link>
          </div>
              </>
            );
          })()}
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          {(() => {
            const blockId = "events-spotlight";
            const currentScope = getScope(blockId);
            const scoped = scopedEventBlocks.spotlight[currentScope];
            return (
              <>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Spotlight</h3>
          </div>
          <div className="mb-3 inline-flex rounded-lg border border-white/15 bg-black/20 p-1 text-xs">
            {(Object.keys(scopeLabel) as BlockScope[]).map((scope) => (
              <button
                key={`${blockId}-${scope}`}
                type="button"
                onClick={() => setScope(blockId, scope)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  currentScope === scope ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {scopeLabel[scope]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Sessions Spotlight</p>
              <p className="text-2xl font-bold mt-1">{scoped.total}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">À venir</p>
              <p className="text-2xl font-bold mt-1">{scoped.upcoming}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Présences total</p>
              <p className="text-2xl font-bold mt-1">{scoped.totalPresences}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Moy. inscriptions</p>
              <p className="text-2xl font-bold mt-1">{scoped.avgRegistrations}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href={`${eventsBasePath}/spotlight`} className={quickLinkClass}>
              Dashboard Spotlight
            </Link>
            <Link href={`${eventsBasePath}/spotlight/presences`} className={quickLinkClass}>
              Présences validées
            </Link>
            <Link href={`${eventsBasePath}/spotlight/analytics`} className={quickLinkClass}>
              Analytics
            </Link>
            <Link href="/admin/spotlight/evaluation" className={quickLinkClass}>
              Évaluation
            </Link>
          </div>
              </>
            );
          })()}
        </section>

        {scopedEventBlocks.byType.map((typeItem) => {
          const tone = categoryTone(typeItem.label);
          const blockId = `events-type-${typeItem.key}`;
          const currentScope = getScope(blockId);
          const scoped = typeItem.scoped[currentScope];
          return (
            <section
              key={`event-type-${typeItem.key}`}
              className={`${sectionCardClass} min-h-[340px]`}
              style={softCardStyle}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                <h3 className={`text-lg font-semibold ${tone.text}`}>{typeItem.label}</h3>
              </div>
              <div className="mb-3 inline-flex rounded-lg border border-white/15 bg-black/20 p-1 text-xs">
                {(Object.keys(scopeLabel) as BlockScope[]).map((scope) => (
                  <button
                    key={`${blockId}-${scope}`}
                    type="button"
                    onClick={() => setScope(blockId, scope)}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      currentScope === scope ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {scopeLabel[scope]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={denseStatCardClass}>
                  <p className="text-gray-400">Événements</p>
                  <p className="text-2xl font-bold mt-1">{scoped.total}</p>
                </div>
                <div className={denseStatCardClass}>
                  <p className="text-gray-400">À venir</p>
                  <p className="text-2xl font-bold mt-1">{scoped.upcoming}</p>
                </div>
                <div className={denseStatCardClass}>
                  <p className="text-gray-400">Moy. inscriptions</p>
                  <p className="text-2xl font-bold mt-1">{scoped.avgRegistrations}</p>
                </div>
                <div className={denseStatCardClass}>
                  <p className="text-gray-400">Présences total</p>
                  <p className="text-2xl font-bold mt-1">{scoped.totalPresences}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link href={`${eventsBasePath}/calendrier`} className={quickLinkClass}>
                  Calendrier
                </Link>
                <Link href={`${eventsBasePath}/participation`} className={quickLinkClass}>
                  Participation
                </Link>
                <Link href={`${eventsBasePath}/recap`} className={quickLinkClass}>
                  Récapitulatif
                </Link>
              </div>
            </section>
          );
        })}

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarHeart className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Anniversaires</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Anniversaires ce mois</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.thisMonth}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Affiliations ce mois</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.affiliateThisMonth}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Anniversaires J+30</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.next30Days}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Affiliations J+30</p>
              <p className="text-2xl font-bold mt-1">{metrics.birthdays.affiliateNext30Days}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href={`${anniversairesBasePath}/mois`} className={quickLinkClass}>
              Anniversaires du mois
            </Link>
            <Link href={`${anniversairesBasePath}/tous`} className={quickLinkClass}>
              Tous les anniversaires
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <HeartHandshake className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">UPA Event</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Participants inscrits</p>
              <p className="text-2xl font-bold mt-1">{metrics.upa.totalRegistered}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Staff actif</p>
              <p className="text-2xl font-bold mt-1">{metrics.upa.activeStaff}</p>
            </div>
            <div className={`${denseStatCardClass} col-span-2`}>
              <p className="text-gray-400">Jalons timeline ouverts</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.upa.timelineOpen > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                {metrics.upa.timelineOpen}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/upa-event" className={quickLinkClass}>
              Gestion UPA Event
            </Link>
          </div>
        </section>

        <section className={`${sectionCardClass} min-h-[340px]`} style={softCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold">Engagement</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Raids reçus</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.raidsReceived}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Raids envoyés</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.raidsSent}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Messages Discord</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.discordMessages}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Heures vocales</p>
              <p className="text-2xl font-bold mt-1">{metrics.engagement.discordVoiceHours}</p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Follows en retard</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.engagement.followOverdue > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {metrics.engagement.followOverdue}
              </p>
            </div>
            <div className={denseStatCardClass}>
              <p className="text-gray-400">Raids à valider</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.engagement.raidsPending > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {metrics.engagement.raidsPending}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href={`${engagementBasePath}/follow`} className={quickLinkClass}>
              Follow
            </Link>
            <Link href={raidsHistoryPath} className={quickLinkClass}>
              Suivi des raids
            </Link>
            <Link
              href={
                pathname.startsWith("/admin/communaute")
                  ? "/admin/communaute/engagement/signalements-raids"
                  : "/admin/engagement/raids-a-valider"
              }
              className={quickLinkClass}
            >
              Raids à valider
            </Link>
            <Link href={`${engagementBasePath}/points-discord`} className={quickLinkClass}>
              Points Discord raids
            </Link>
            <Link href="/admin/follow" className={quickLinkClass}>
              Feuilles de follow
            </Link>
          </div>
        </section>
      </div>

      {loading ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          Chargement des indicateurs Vie communautaire...
        </div>
      ) : null}

      <section className="mt-8">
        <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5" style={softCardStyle}>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#d4af37]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Accès rapides</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <Link href={`${eventsBasePath}/liens-vocaux`} className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Liens vocaux
            </Link>
            <Link href={`${eventsBasePath}/participation`} className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Présences & participation
            </Link>
            <Link href={`${eventsBasePath}/archives`} className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Archives événements
            </Link>
            <Link href="/admin/spotlight/membres" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
              Historique évaluations Spotlight
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
