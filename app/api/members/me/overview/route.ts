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

function compactKey(value?: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function getIdentityAliases(rawValue?: unknown): string[] {
  const normalized = normalize(rawValue);
  if (!normalized) return [];

  const aliases = new Set<string>([normalized]);
  const compact = compactKey(normalized);
  if (compact) aliases.add(compact);

  const hashIdx = normalized.indexOf("#");
  if (hashIdx > 0) {
    aliases.add(normalized.slice(0, hashIdx));
  }

  if (normalized.startsWith("<@") && normalized.endsWith(">")) {
    const mentionId = normalized.replace(/[<@!>]/g, "");
    if (mentionId) {
      aliases.add(mentionId);
      const mentionCompact = compactKey(mentionId);
      if (mentionCompact) aliases.add(mentionCompact);
    }
  }

  return Array.from(aliases);
}

function isUuidLike(value?: string): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function safeTimestamp(value?: string | null): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeMemberPresences(
  rows: Array<{ event_id: string; present: boolean; validated_at: string | null; created_at: string | null }>
): Array<{ event_id: string; present: boolean; validated_at: string | null; created_at: string | null }> {
  const byEvent = new Map<string, { event_id: string; present: boolean; validated_at: string | null; created_at: string | null }>();
  for (const row of rows) {
    const key = String(row.event_id || "");
    if (!key) continue;

    const existing = byEvent.get(key);
    if (!existing) {
      byEvent.set(key, row);
      continue;
    }

    const existingTs = Math.max(safeTimestamp(existing.validated_at), safeTimestamp(existing.created_at));
    const currentTs = Math.max(safeTimestamp(row.validated_at), safeTimestamp(row.created_at));
    if (currentTs >= existingTs) {
      byEvent.set(key, row);
    }
  }
  return Array.from(byEvent.values());
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

function buildSafeOverviewPayload(input: {
  discordId: string;
  monthKey: string;
  member?: any | null;
}) {
  const { discordId, monthKey, member } = input;
  const role = String(member?.role || "Membre");
  const displayName = String(
    member?.displayName ||
      member?.display_name ||
      member?.siteUsername ||
      member?.site_username ||
      member?.twitchLogin ||
      member?.twitch_login ||
      "Membre"
  );
  const twitchLogin = String(member?.twitchLogin || member?.twitch_login || "");
  const integrationDateRaw = member?.integrationDate || member?.integration_date || null;
  const integrationDateIso =
    integrationDateRaw instanceof Date
      ? integrationDateRaw.toISOString()
      : typeof integrationDateRaw === "string" && integrationDateRaw
        ? integrationDateRaw
        : null;

  return {
    member: {
      discordId,
      twitchLogin,
      displayName,
      role,
      profileValidationStatus: String(member?.profileValidationStatus || member?.profile_validation_status || "non_soumis"),
      onboardingStatus: String(member?.onboardingStatus || member?.onboarding_status || "termine"),
      integrationDate: integrationDateIso,
      parrain: member?.parrain || null,
      bio: String(member?.description || member?.customBio || member?.custom_bio || ""),
      socials: {
        twitch: twitchLogin ? `https://www.twitch.tv/${twitchLogin}` : "",
        discord: String(member?.discordUsername || member?.discord_username || ""),
        instagram: String(member?.instagram || ""),
        tiktok: String(member?.tiktok || ""),
        twitter: String(member?.twitter || ""),
        youtube: "",
      },
    },
    vip: {
      activeThisMonth: Boolean(member?.isVip || member?.is_vip),
      statusLabel: Boolean(member?.isVip || member?.is_vip) ? "Actif ce mois" : "Non actif ce mois",
      source: Boolean(member?.isVip || member?.is_vip) ? ("member_flag" as const) : ("none" as const),
      startsAt: null,
      endsAt: null,
    },
    monthKey,
    stats: {
      raidsThisMonth: 0,
      raidsTotal: 0,
      eventPresencesThisMonth: 0,
      participationThisMonth: 0,
      formationsValidated: 0,
      formationsValidatedThisMonth: 0,
    },
    profile: {
      completed: false,
      percent: 0,
    },
    upcomingEvents: [],
    formationHistory: [],
    eventPresenceHistory: [],
    attendance: {
      currentMonthKey: monthKey,
      previousMonthKey: getPreviousMonthKey(new Date()),
      monthlyHistory: [],
      monthEvents: [],
      monthEventsByMonth: [],
      categoryBreakdown: [],
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    let member: Awaited<ReturnType<typeof memberRepository.findByDiscordId>> = null;
    try {
      member = await memberRepository.findByDiscordId(discordId);
    } catch (repoError) {
      console.error("[members/me/overview] memberRepository.findByDiscordId failed, fallback to direct Supabase query", repoError);
      const { data, error } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("discord_id", discordId)
        .single();
      if (error) {
        console.error("[members/me/overview] direct members lookup failed", error);
      } else {
        member = data as any;
      }
    }
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }
    const authenticatedAdmin = await getAuthenticatedAdmin();
    const effectiveRole =
      (authenticatedAdmin?.role && ADMIN_ROLE_TO_MEMBER_ROLE[authenticatedAdmin.role]) || member.role;

    const identity = new Set<string>();
    [member.twitchLogin, member.discordId, member.discordUsername, member.displayName, member.siteUsername]
      .forEach((value) => getIdentityAliases(value).forEach((alias) => identity.add(alias)));

    const now = new Date();
    const monthKey = getCurrentMonthKey();

    let raidsThisMonth = 0;
    try {
      const raidsCurrentMonth = await loadRaidsFaits(monthKey);
      raidsThisMonth = raidsCurrentMonth
        .filter((raid) => {
          const source = raid.source || (raid.manual ? "manual" : "twitch-live");
          if (source === "discord") return false;
          const raiderAliases = getIdentityAliases(raid.raider);
          return raiderAliases.some((alias) => identity.has(alias));
        })
        .reduce((total, raid) => total + (raid.count || 1), 0);
    } catch {
      raidsThisMonth = 0;
    }

    try {
      const { startIso, endIso } = monthRange(monthKey);
      const normalizedLogin = normalize(member.twitchLogin);
      const normalizedTwitchId = member.twitchId ? String(member.twitchId) : null;

      const [manualRes, eventsubRes] = await Promise.all([
        supabaseAdmin
          .from("raid_declarations")
          .select("id,target_twitch_login,raid_at,status")
          .eq("member_discord_id", discordId)
          .gte("raid_at", startIso)
          .lt("raid_at", endIso)
          .limit(2000),
        normalizedTwitchId
          ? supabaseAdmin
              .from("raid_test_events")
              .select("id,to_broadcaster_user_login,event_at,processing_status")
              .or(`from_broadcaster_user_id.eq.${normalizedTwitchId},from_broadcaster_user_login.eq.${normalizedLogin}`)
              .gte("event_at", startIso)
              .lt("event_at", endIso)
              .limit(2000)
          : supabaseAdmin
              .from("raid_test_events")
              .select("id,to_broadcaster_user_login,event_at,processing_status")
              .eq("from_broadcaster_user_login", normalizedLogin)
              .gte("event_at", startIso)
              .lt("event_at", endIso)
              .limit(2000),
      ]);

      const dedupe = new Set<string>();
      for (const row of (manualRes.data || []) as Array<any>) {
        const status = String(row.status || "").toLowerCase();
        if (status === "rejected") continue;
        const ts = new Date(String(row.raid_at || "")).getTime();
        const minuteBucket = Number.isFinite(ts) ? Math.floor(ts / 60000) : String(row.raid_at || "");
        const target = normalize(row.target_twitch_login);
        dedupe.add(`manual:${target}|${minuteBucket}`);
      }
      for (const row of (eventsubRes.data || []) as Array<any>) {
        const status = String(row.processing_status || "").toLowerCase();
        if (status === "duplicate" || status === "ignored" || status === "rejected") continue;
        const ts = new Date(String(row.event_at || "")).getTime();
        const minuteBucket = Number.isFinite(ts) ? Math.floor(ts / 60000) : String(row.event_at || "");
        const target = normalize(row.to_broadcaster_user_login);
        dedupe.add(`eventsub:${target}|${minuteBucket}`);
      }

      raidsThisMonth = Math.max(raidsThisMonth, dedupe.size);
    } catch {
      // Best effort: conserve le calcul historique si les tables v2 ne sont pas disponibles.
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
        const raiderAliases = getIdentityAliases(raid.raider);
        return raiderAliases.some((alias) => identity.has(alias)) ? sum + (raid.count || 1) : sum;
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

    try {
      const { data: aliases } = await supabaseAdmin
        .from("community_events")
        .select("id,legacy_event_id")
        .not("legacy_event_id", "is", null)
        .limit(5000);
      for (const row of aliases || []) {
        const canonicalId = String((row as any).id || "");
        const legacyId = String((row as any).legacy_event_id || "");
        if (!canonicalId || !legacyId) continue;
        const canonicalEvent = eventById.get(canonicalId);
        if (canonicalEvent) {
          eventById.set(legacyId, canonicalEvent);
        }
      }
    } catch {
      // Compat: selon les environnements, legacy_event_id peut ne pas être disponible.
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

    let memberPresenceRows: Array<{ event_id: string; present: boolean; validated_at: string | null; created_at: string | null }> = [];
    try {
      const allEventIds = Array.from(new Set(allEvents.map((event) => String(event.id)).filter(Boolean)));
      const chunkSize = 200;
      const chunks: string[][] = [];
      for (let i = 0; i < allEventIds.length; i += chunkSize) {
        chunks.push(allEventIds.slice(i, i + chunkSize));
      }

      const chunkRows = await Promise.all(
        chunks.map(async (ids) => {
          const baseQuery = () =>
            supabaseAdmin
              .from("event_presences")
              .select("event_id,present,validated_at,created_at,twitch_login,discord_id")
              .eq("present", true)
              .limit(5000);

          const uuidIds = ids.filter((id) => isUuidLike(id));
          const legacyIds = ids.filter((id) => !isUuidLike(id));
          const rows: any[] = [];

          if (uuidIds.length > 0) {
            const { data } = await baseQuery().in("event_id", uuidIds);
            if (data?.length) rows.push(...data);
          }

          if (legacyIds.length > 0) {
            const { data, error } = await baseQuery().in("event_id", legacyIds);
            if (!error && data?.length) {
              rows.push(...data);
            }
          }

          return rows;
        })
      );

      const filteredRows = chunkRows
        .flat()
        .filter((row: any) => {
          const twitchAliases = getIdentityAliases(row.twitch_login);
          const discordAliases = getIdentityAliases(row.discord_id);
          return [...twitchAliases, ...discordAliases].some((alias) => identity.has(alias));
        });

      memberPresenceRows = dedupeMemberPresences(
        filteredRows.map((row: any) => ({
          event_id: String(row.event_id),
          present: Boolean(row.present),
          validated_at: row.validated_at || null,
          created_at: row.created_at || null,
        }))
      );
    } catch {
      memberPresenceRows = [];
    }

    const memberPresences = memberPresenceRows.filter((row) => row.present);

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

    const normalizedRole = normalize(member.role);
    const computedOnboardingStatus =
      member.onboardingStatus || (normalizedRole.includes("nouveau") ? "a_faire" : "termine");

    return NextResponse.json({
      member: {
        discordId: member.discordId || null,
        twitchLogin: member.twitchLogin,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: effectiveRole,
        profileValidationStatus: member.profileValidationStatus || "non_soumis",
        onboardingStatus: computedOnboardingStatus,
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
    try {
      const session = await getServerSession(authOptions);
      const discordId = session?.user?.discordId;
      if (!discordId) {
        return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
      }

      const monthKey = getCurrentMonthKey();
      const { data } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("discord_id", discordId)
        .single();

      return NextResponse.json(
        buildSafeOverviewPayload({
          discordId,
          monthKey,
          member: data || null,
        })
      );
    } catch (fallbackError) {
      console.error("[members/me/overview] fallback response failed:", fallbackError);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }
}
