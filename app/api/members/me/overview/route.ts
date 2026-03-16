import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";
import { eventRepository, memberRepository, vipRepository } from "@/lib/repositories";
import { getMonthKey, loadRaidsFaits } from "@/lib/raidStorage";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMIN_ROLE_TO_MEMBER_ROLE: Record<string, string> = {
  FONDATEUR: "Admin",
  ADMIN_COORDINATEUR: "Admin Coordinateur",
  MODERATEUR: "Modérateur",
  MODERATEUR_EN_FORMATION: "Modérateur en formation",
  MODERATEUR_EN_PAUSE: "Modérateur en pause",
  SOUTIEN_TENF: "Soutien TENF",
};

function normalize(value?: unknown): string {
  return String(value ?? "").toLowerCase().trim().replace(/^@+/, "");
}

function isFormationCategory(category?: string | null): boolean {
  const key = normalize(category);
  return key.includes("formation");
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toIsoMonthKey(value: Date): string {
  return value.toISOString().slice(0, 7);
}

function getMonthKeyFromDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonthKey(from: Date): string {
  return getMonthKeyFromDate(new Date(from.getFullYear(), from.getMonth() - 1, 1));
}

function getLastMonthKeys(from: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const cursor = new Date(from.getFullYear(), from.getMonth() - index, 1);
    return getMonthKeyFromDate(cursor);
  }).reverse();
}

async function loadEventsWithoutCache(): Promise<
  Array<{
    id: string;
    title: string;
    description: string;
    date: Date;
    category: string;
    location?: string;
    isPublished: boolean;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
  }>
> {
  const tryQuery = async (
    table: "community_events" | "events",
    orderColumn: "starts_at" | "date"
  ) => {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: false })
      .limit(1000);
    if (error) return null;
    return data || [];
  };

  const rows =
    (await tryQuery("community_events", "starts_at")) ??
    (await tryQuery("community_events", "date")) ??
    (await tryQuery("events", "date")) ??
    (await tryQuery("events", "starts_at")) ??
    [];

  return rows.map((row: any) => ({
    id: String(row.id),
    title: row.title || "Sans titre",
    description: row.description || "",
    date: new Date(row.starts_at || row.date || row.created_at || new Date().toISOString()),
    category: row.category || "Non classé",
    location: row.location || undefined,
    isPublished: row.is_published ?? row.isPublished ?? false,
    createdAt: new Date(row.created_at || new Date().toISOString()),
    createdBy: row.created_by || "system",
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }));
}

function profileCompletion(member: any): { completed: boolean; percent: number } {
  const hasTwitchLinked =
    !!member?.twitchLogin &&
    !String(member.twitchLogin).toLowerCase().startsWith("nouveau_") &&
    !String(member.twitchLogin).toLowerCase().startsWith("nouveau-");
  const checks = [
    !!member?.displayName,
    hasTwitchLinked,
    !!member?.discordUsername,
    !!member?.parrain,
    !!member?.description,
    !!member?.timezone,
  ];
  const passed = checks.filter(Boolean).length;
  const percent = Math.round((passed / checks.length) * 100);
  return { completed: percent >= 100, percent };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const member = await memberRepository.findByDiscordId(discordId);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }
    const authenticatedAdmin = await getAuthenticatedAdmin();
    const effectiveRole =
      (authenticatedAdmin?.role && ADMIN_ROLE_TO_MEMBER_ROLE[authenticatedAdmin.role]) || member.role;

    const identity = new Set<string>(
      [member.twitchLogin, member.discordId, member.discordUsername, member.displayName, member.siteUsername]
        .filter(Boolean)
        .map((v) => normalize(v))
    );

    const now = new Date();
    const monthKey = getCurrentMonthKey();

    let raidsThisMonth = 0;
    try {
      const raidsCurrentMonth = await loadRaidsFaits(monthKey);
      raidsThisMonth = raidsCurrentMonth
        .filter((raid) => {
          const source = raid.source || (raid.manual ? "manual" : "twitch-live");
          if (source === "discord") return false;
          const raider = normalize(raid.raider);
          return identity.has(raider);
        })
        .reduce((total, raid) => total + (raid.count || 1), 0);
    } catch {
      raidsThisMonth = 0;
    }

    let raidsTotal = raidsThisMonth;
    try {
      // Best effort sur les 12 derniers mois (sans dépendre d'un index blobs)
      const last12 = Array.from({ length: 12 }, (_, idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
        return getMonthKey(d.getFullYear(), d.getMonth() + 1);
      });
      const totals = await Promise.all(last12.map((key) => loadRaidsFaits(key)));
      raidsTotal = totals.flat().reduce((sum, raid) => {
        const source = raid.source || (raid.manual ? "manual" : "twitch-live");
        if (source === "discord") return sum;
        return identity.has(normalize(raid.raider)) ? sum + (raid.count || 1) : sum;
      }, 0);
    } catch {
      // fallback raidsThisMonth
    }

    let allEvents: Awaited<ReturnType<typeof eventRepository.findAll>> = [];
    try {
      allEvents = await eventRepository.findAll(1000, 0);
    } catch {
      allEvents = [];
    }
    if (!allEvents.length) {
      try {
        allEvents = await loadEventsWithoutCache();
      } catch {
        allEvents = [];
      }
    }
    const eventById = new Map<string, (typeof allEvents)[number]>();
    for (const event of allEvents) {
      if (!event?.id) continue;
      eventById.set(String(event.id), event);
    }

    const upcomingEvents = allEvents
      .filter((event) => {
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        return eventDate.getTime() > now.getTime() && event.isPublished;
      })
      .sort((a, b) => (a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()) - (b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()))
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        title: event.title,
        category: event.category,
        date: (event.date instanceof Date ? event.date : new Date(event.date)).toISOString(),
      }));

    let eventPresencesThisMonth = 0;
    let formationsValidated = 0;
    let formationsValidatedThisMonth = 0;
    const formationHistory: Array<{ id: string; title: string; date: string }> = [];
    const eventPresenceHistory: Array<{ id: string; title: string; date: string; category: string }> = [];

    let memberPresences: Array<{ event_id: string; validated_at: string | null; created_at: string | null }> = [];
    try {
      const { data } = await supabaseAdmin
        .from("event_presences")
        .select("event_id,validated_at,created_at,twitch_login,present")
        .eq("present", true)
        .eq("twitch_login", normalize(member.twitchLogin))
        .limit(2000);
      memberPresences = (data || []).map((row: any) => ({
        event_id: String(row.event_id),
        validated_at: row.validated_at || null,
        created_at: row.created_at || null,
      }));
    } catch {
      memberPresences = [];
    }

    const seenEvents = new Set<string>();
    for (const presence of memberPresences) {
      if (seenEvents.has(presence.event_id)) continue;
      seenEvents.add(presence.event_id);

      const event = eventById.get(presence.event_id);
      if (!event) continue;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      if (Number.isNaN(eventDate.getTime())) continue;

      const key = toIsoMonthKey(eventDate);
      eventPresenceHistory.push({
        id: event.id,
        title: event.title,
        category: event.category || "Evenement",
        date: eventDate.toISOString(),
      });
      if (key === monthKey) eventPresencesThisMonth += 1;
      if (isFormationCategory(event.category)) {
        formationsValidated += 1;
        if (key === monthKey) formationsValidatedThisMonth += 1;
        formationHistory.push({ id: event.id, title: event.title, date: eventDate.toISOString() });
      }
    }

    eventPresenceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    formationHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const trackedEvents = allEvents
      .map((event) => {
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        if (Number.isNaN(eventDate.getTime())) {
          return null;
        }
        return {
          id: String(event.id),
          title: event.title || "Evenement",
          date: eventDate,
          category: event.category || "Evenement",
        };
      })
      .filter((event): event is { id: string; title: string; date: Date; category: string } => Boolean(event));

    const last12MonthKeys = getLastMonthKeys(now, 12);
    const monthlyHistory = last12MonthKeys.map((month) => {
      const monthEvents = trackedEvents.filter((event) => toIsoMonthKey(event.date) === month);
      const totalEvents = monthEvents.length;
      const attendedEvents = monthEvents.reduce((count, event) => count + (seenEvents.has(event.id) ? 1 : 0), 0);
      const attendanceRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0;
      return {
        monthKey: month,
        totalEvents,
        attendedEvents,
        attendanceRate,
      };
    });

    const monthEventsByMonth = last12MonthKeys.map((key) => ({
      monthKey: key,
      events: trackedEvents
        .filter((event) => toIsoMonthKey(event.date) === key)
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((event) => {
          const normalizedCategory = normalize(event.category);
          return {
            id: event.id,
            title: event.title,
            date: event.date.toISOString(),
            category: event.category,
            attended: seenEvents.has(event.id),
            isKeyEvent: normalizedCategory.includes("spotlight") || isFormationCategory(event.category),
          };
        }),
    }));

    const monthEvents = monthEventsByMonth.find((entry) => entry.monthKey === monthKey)?.events || [];

    const categoryAccumulator = new Map<string, { totalEvents: number; attendedEvents: number }>();
    for (const event of monthEvents) {
      const current = categoryAccumulator.get(event.category) || { totalEvents: 0, attendedEvents: 0 };
      current.totalEvents += 1;
      if (event.attended) current.attendedEvents += 1;
      categoryAccumulator.set(event.category, current);
    }
    const categoryBreakdown = Array.from(categoryAccumulator.entries())
      .map(([category, values]) => ({
        category,
        totalEvents: values.totalEvents,
        attendedEvents: values.attendedEvents,
        attendanceRate: values.totalEvents > 0 ? Math.round((values.attendedEvents / values.totalEvents) * 100) : 0,
      }))
      .sort((a, b) => b.totalEvents - a.totalEvents || b.attendanceRate - a.attendanceRate);

    const previousMonthKey = getPreviousMonthKey(now);

    const completion = profileCompletion(member);
    const participationThisMonth = raidsThisMonth + eventPresencesThisMonth;
    let vipActiveThisMonth = false;
    let vipSource: "vip_history" | "member_flag" | "none" = "none";
    try {
      const vipMonthEntries = await vipRepository.findByMonth(monthKey);
      vipActiveThisMonth = vipMonthEntries.some((entry) => normalize(entry.twitchLogin) === normalize(member.twitchLogin));
      if (vipActiveThisMonth) vipSource = "vip_history";
    } catch {
      // Fallback sur le flag membre si l'historique VIP n'est pas accessible
      vipActiveThisMonth = !!member.isVip;
      vipSource = vipActiveThisMonth ? "member_flag" : "none";
    }

    if (!vipActiveThisMonth && member.isVip) {
      vipActiveThisMonth = true;
      vipSource = "member_flag";
    }

    return NextResponse.json({
      member: {
        discordId: member.discordId || null,
        twitchLogin: member.twitchLogin,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: effectiveRole,
        profileValidationStatus: member.profileValidationStatus || "non_soumis",
        integrationDate: member.integrationDate ? member.integrationDate.toISOString() : null,
        parrain: member.parrain || null,
        bio: member.description || member.customBio || "",
        socials: {
          twitch: member.twitchLogin ? `https://www.twitch.tv/${member.twitchLogin}` : "",
          discord: member.discordUsername || "",
          instagram: member.instagram || "",
          tiktok: member.tiktok || "",
          twitter: member.twitter || "",
          youtube: "",
        },
      },
      vip: {
        activeThisMonth: vipActiveThisMonth,
        statusLabel: vipActiveThisMonth ? "Actif ce mois" : "Non actif ce mois",
        source: vipSource,
        startsAt: null,
        endsAt: null,
      },
      monthKey,
      stats: {
        raidsThisMonth,
        raidsTotal,
        eventPresencesThisMonth,
        participationThisMonth,
        formationsValidated,
        formationsValidatedThisMonth,
      },
      profile: {
        completed: completion.completed,
        percent: completion.percent,
      },
      upcomingEvents,
      formationHistory,
      eventPresenceHistory,
      attendance: {
        currentMonthKey: monthKey,
        previousMonthKey,
        monthlyHistory,
        monthEvents,
        monthEventsByMonth,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("[members/me/overview] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
