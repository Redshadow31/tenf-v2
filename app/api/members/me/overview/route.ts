import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";
import { eventRepository, memberRepository } from "@/lib/repositories";
import { resolveMonthVipLogins } from "@/lib/vipCurrentMonthLogins";
import { getMonthKey, loadRaidsFaits } from "@/lib/raidStorage";
import { supabaseAdmin } from "@/lib/db/supabase";
import {
  isFormationEventCategory,
  loadMemberOverviewPresences,
  type ResolvedMemberEvent,
} from "@/lib/member/memberOverviewAttendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function memberPrivateJson(data: unknown, init?: Parameters<typeof NextResponse.json>[1]) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.headers.set("Vary", "Cookie");
  return res;
}

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

async function queryMemberPresenceRows(
  filter: "twitch" | "discord",
  value: string,
): Promise<Record<string, unknown>[]> {
  if (!value) return [];
  let query = supabaseAdmin
    .from("event_presences")
    .select("event_id,present,validated_at,created_at,twitch_login,discord_id")
    .eq("present", true)
    .limit(5000);

  query = filter === "twitch" ? query.eq("twitch_login", value.toLowerCase()) : query.eq("discord_id", value);

  const { data, error } = await query;
  if (error) {
    const message = (error.message || "").toLowerCase();
    if (message.includes("validated_at") || message.includes("column")) {
      let retryQuery = supabaseAdmin
        .from("event_presences")
        .select("event_id,present,created_at,twitch_login,discord_id")
        .eq("present", true)
        .limit(5000);
      retryQuery =
        filter === "twitch" ? retryQuery.eq("twitch_login", value.toLowerCase()) : retryQuery.eq("discord_id", value);
      const retry = await retryQuery;
      return (retry.data || []) as Record<string, unknown>[];
    }
    throw error;
  }
  return (data || []) as Record<string, unknown>[];
}

function mergeResolvedEventsIntoCalendar(
  eventById: Map<string, CalendarEventLike>,
  resolved: Map<string, ResolvedMemberEvent>,
) {
  for (const [id, event] of resolved) {
    if (eventById.has(id)) continue;
    eventById.set(id, {
      id: event.id,
      title: event.title,
      description: "",
      date: event.date,
      category: event.category,
      isPublished: true,
      createdAt: event.date,
      createdBy: "system",
    });
  }
}

type CalendarEventLike = {
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
};

function isFormationCategory(category?: string | null): boolean {
  return isFormationEventCategory(category);
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
  const twitchLogin = String(member?.twitchLogin || member?.twitch_login || "");
  const hasTwitchLinked =
    !!twitchLogin &&
    !twitchLogin.toLowerCase().startsWith("nouveau_") &&
    !twitchLogin.toLowerCase().startsWith("nouveau-");
  const displayName = member?.displayName || member?.display_name;
  const discordUsername = member?.discordUsername || member?.discord_username;
  const description = member?.description || member?.customBio || member?.custom_bio;
  const timezone = member?.timezone;
  const checks = [
    !!displayName,
    hasTwitchLinked,
    !!discordUsername,
    !!member?.parrain,
    !!description,
    !!timezone,
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
  const now = new Date();
  const last12MonthKeys = getLastMonthKeys(now, 12);
  const monthlyHistory = last12MonthKeys.map((m) => ({
    monthKey: m,
    totalEvents: 0,
    attendedEvents: 0,
    attendanceRate: 0,
  }));
  const monthEventsByMonth = last12MonthKeys.map((m) => ({ monthKey: m, events: [] }));

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
      activeThisMonth: false,
      statusLabel: "Non actif ce mois",
      source: "none" as const,
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
      monthlyHistory,
      monthEvents: [],
      monthEventsByMonth,
      categoryBreakdown: [],
      discordPointsTrackingAvailable: false,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = typeof session?.user?.discordId === "string" ? session.user.discordId.trim() : "";
    if (!discordId) {
      return memberPrivateJson({ error: "Connexion requise" }, { status: 401 });
    }

    let member: Awaited<ReturnType<typeof memberRepository.findByDiscordId>> = null;
    try {
      member = await memberRepository.findByDiscordIdFresh(discordId);
    } catch (repoError) {
      console.error("[members/me/overview] memberRepository.findByDiscordIdFresh failed, fallback to direct Supabase query", repoError);
      const { data, error } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("discord_id", discordId)
        .maybeSingle();
      if (error) {
        console.error("[members/me/overview] direct members lookup failed", error);
      } else {
        member = data as any;
      }
    }
    if (!member) {
      return memberPrivateJson({ error: "Membre introuvable" }, { status: 404 });
    }
    const rawMember = member as any;
    const memberDiscordId = String(member.discordId || rawMember.discord_id || discordId || "");
    const memberTwitchLogin = String(member.twitchLogin || rawMember.twitch_login || "");
    const memberTwitchId = member.twitchId || rawMember.twitch_id ? String(member.twitchId || rawMember.twitch_id) : null;
    const memberDisplayName = String(
      member.displayName || rawMember.display_name || member.siteUsername || rawMember.site_username || memberTwitchLogin || "Membre"
    );
    const memberRole = String(member.role || "Membre");
    const memberDiscordUsername = String(member.discordUsername || rawMember.discord_username || "");
    const memberProfileStatus = String(member.profileValidationStatus || rawMember.profile_validation_status || "non_soumis");
    const memberOnboardingStatus = String(member.onboardingStatus || rawMember.onboarding_status || "");
    const memberIntegrationRaw = member.integrationDate || rawMember.integration_date || null;
    const memberIntegrationDateIso = memberIntegrationRaw
      ? new Date(memberIntegrationRaw).toISOString()
      : null;
    const memberDescription = String(member.description || member.customBio || rawMember.custom_bio || "");
    const memberSiteUsername = String(member.siteUsername || rawMember.site_username || "");

    const authenticatedAdmin = await getAuthenticatedAdmin();
    const effectiveRole =
      (authenticatedAdmin?.role && ADMIN_ROLE_TO_MEMBER_ROLE[authenticatedAdmin.role]) || memberRole;

    const identity = new Set<string>();
    // Discord de session = source de vérité pour rapprocher les présences même si la fiche a un décalage
    getIdentityAliases(discordId).forEach((alias) => identity.add(alias));
    [memberTwitchLogin, memberDiscordId, memberDiscordUsername, memberDisplayName, memberSiteUsername]
      .forEach((value) => getIdentityAliases(value).forEach((alias) => identity.add(alias)));

    const twitchUrlRaw = String(member.twitchUrl || rawMember.twitch_url || "").trim();
    if (twitchUrlRaw) {
      try {
        const parsed = new URL(twitchUrlRaw.startsWith("http") ? twitchUrlRaw : `https://${twitchUrlRaw}`);
        if (parsed.hostname.toLowerCase().includes("twitch")) {
          const seg = parsed.pathname.split("/").filter(Boolean)[0];
          if (seg) getIdentityAliases(seg).forEach((alias) => identity.add(alias));
        }
      } catch {
        const slug = twitchUrlRaw.match(/twitch\.tv\/([^/?#]+)/i)?.[1];
        if (slug) getIdentityAliases(slug).forEach((alias) => identity.add(alias));
      }
    }

    const now = new Date();
    const monthKey = getCurrentMonthKey();

    let raidsThisMonth = 0;
    try {
      const raidsCurrentMonth = await loadRaidsFaits(monthKey);
      raidsThisMonth = raidsCurrentMonth
        .filter((raid) => {
          // countFrom=false signifie explicitement "ne pas compter ce raid fait" (imports/migrations/ajustements).
          if (raid.countFrom === false) return false;
          const raiderAliases = getIdentityAliases(raid.raider);
          return raiderAliases.some((alias) => identity.has(alias));
        })
        .reduce((total, raid) => total + (raid.count || 1), 0);
    } catch {
      raidsThisMonth = 0;
    }

    try {
      const { startIso, endIso } = monthRange(monthKey);
      const normalizedLogin = normalize(memberTwitchLogin);
      const normalizedTwitchId = memberTwitchId;

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
        if (raid.countFrom === false) return sum;
        const raiderAliases = getIdentityAliases(raid.raider);
        return raiderAliases.some((alias) => identity.has(alias)) ? sum + (raid.count || 1) : sum;
      }, 0);
    } catch {
      // fallback raidsThisMonth
    }

    // Événements publiés = même périmètre que le calendrier membre ; fallback si périmètre vide (dev / données atypiques)
    let allEvents: Awaited<ReturnType<typeof eventRepository.findPublished>> = [];
    try {
      allEvents = await eventRepository.findPublished(1000, 0);
    } catch {
      allEvents = [];
    }
    if (!allEvents.length) {
      try {
        allEvents = await eventRepository.findAll(1000, 0);
      } catch {
        allEvents = [];
      }
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
      const { presenceRows, resolvedEvents } = await loadMemberOverviewPresences({
        identity,
        discordId,
        memberTwitchLogin,
        getIdentityAliases,
        getMemberPresencesWithEvents: (login) => eventRepository.getMemberPresencesWithEvents(login),
        queryPresenceRows: queryMemberPresenceRows,
      });
      memberPresenceRows = presenceRows;
      mergeResolvedEventsIntoCalendar(eventById as Map<string, CalendarEventLike>, resolvedEvents);

      for (const row of presenceRows) {
        const rawId = String(row.event_id || "");
        if (!rawId || eventById.has(rawId)) continue;
        try {
          const fetched = await eventRepository.findById(rawId);
          if (fetched?.id) {
            eventById.set(String(fetched.id), fetched as CalendarEventLike);
          }
        } catch {
          /* best effort */
        }
      }
    } catch (presenceLoadError) {
      console.warn("[members/me/overview] loadMemberOverviewPresences failed:", presenceLoadError);
      memberPresenceRows = [];
    }

    const memberPresences = memberPresenceRows.filter((row) => row.present);

    /** Toutes les clés d'event (legacy + UUID canonique) pour lesquelles le membre est compté présent */
    const attendedEventKeys = new Set<string>();
    for (const presence of memberPresences) {
      const rawId = String(presence.event_id || "");
      if (!rawId) continue;
      attendedEventKeys.add(rawId);
      const resolved = eventById.get(rawId);
      if (resolved?.id) attendedEventKeys.add(String(resolved.id));
    }

    const seenForPresenceHistory = new Set<string>();
    for (const presence of memberPresences) {
      const rawId = String(presence.event_id || "");
      if (!rawId) continue;
      const event = eventById.get(rawId);
      if (!event) continue;
      const canonicalId = String(event.id);
      if (seenForPresenceHistory.has(canonicalId)) continue;
      seenForPresenceHistory.add(canonicalId);

      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      if (Number.isNaN(eventDate.getTime())) continue;

      const key = getMonthKeyFromDate(eventDate);
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

    const trackedEventIds = new Set<string>();
    const trackedEvents: Array<{ id: string; title: string; date: Date; category: string }> = [];

    function pushTrackedEvent(event: CalendarEventLike | (typeof allEvents)[number]) {
      const id = String(event.id || "");
      if (!id || trackedEventIds.has(id)) return;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      if (Number.isNaN(eventDate.getTime())) return;
      trackedEventIds.add(id);
      trackedEvents.push({
        id,
        title: event.title || "Evenement",
        date: eventDate,
        category: event.category || "Evenement",
      });
    }

    for (const event of allEvents) pushTrackedEvent(event as CalendarEventLike);
    for (const presence of memberPresences) {
      const event = eventById.get(String(presence.event_id || ""));
      if (event) pushTrackedEvent(event);
    }

    const memberTwitchLoginNormalized = normalize(memberTwitchLogin);
    let discordPointsBackendAvailable = false;
    let discordPointsEventIdsAwarded = new Set<string>();
    if (memberTwitchLoginNormalized) {
      try {
        const { data: discordRows, error: discordErr } = await supabaseAdmin
          .from("event_discord_points")
          .select("event_id")
          .eq("twitch_login", memberTwitchLoginNormalized)
          .eq("status", "awarded")
          .limit(3000);
        if (discordErr) {
          const msg = String(discordErr.message || "").toLowerCase();
          const tableMissing =
            msg.includes("does not exist") ||
            msg.includes("42p01") ||
            msg.includes("could not find the table") ||
            msg.includes("schema cache");
          if (!tableMissing) {
            console.warn("[members/me/overview] event_discord_points:", discordErr.message);
          }
        } else {
          discordPointsBackendAvailable = true;
          discordPointsEventIdsAwarded = new Set(
            (discordRows || []).map((row: { event_id?: string }) => String(row.event_id || "")).filter(Boolean)
          );
        }
      } catch {
        discordPointsBackendAvailable = false;
      }
    }

    const last12MonthKeys = getLastMonthKeys(now, 12);
    const monthlyHistory = last12MonthKeys.map((month) => {
      const monthEvents = trackedEvents.filter((event) => getMonthKeyFromDate(event.date) === month);
      const totalEvents = monthEvents.length;
      const attendedEvents = monthEvents.reduce(
        (count, event) => count + (attendedEventKeys.has(event.id) ? 1 : 0),
        0
      );
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
        .filter((event) => getMonthKeyFromDate(event.date) === key)
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((event) => {
          const normalizedCategory = normalize(event.category);
          const attended = attendedEventKeys.has(event.id);
          let discordPointsStatus: "awarded" | "pending" | null = null;
          if (attended && discordPointsBackendAvailable) {
            discordPointsStatus = discordPointsEventIdsAwarded.has(event.id) ? "awarded" : "pending";
          }
          return {
            id: event.id,
            title: event.title,
            date: event.date.toISOString(),
            category: event.category,
            attended,
            isKeyEvent: normalizedCategory.includes("spotlight") || isFormationCategory(event.category),
            discordPointsStatus,
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
    let vipSource: "vip_month" | "none" = "none";
    const memberLoginNorm = normalize(memberTwitchLogin);
    if (memberLoginNorm) {
      try {
        const monthVipLogins = await resolveMonthVipLogins(monthKey);
        vipActiveThisMonth = monthVipLogins.some((login) => normalize(login) === memberLoginNorm);
        if (vipActiveThisMonth) vipSource = "vip_month";
      } catch (error) {
        console.warn("[members/me/overview] VIP month resolve failed:", error);
      }
    }

    const normalizedRole = normalize(memberRole);
    const computedOnboardingStatus =
      memberOnboardingStatus || (normalizedRole.includes("nouveau") ? "a_faire" : "termine");

    return memberPrivateJson({
      member: {
        discordId: memberDiscordId || null,
        twitchLogin: memberTwitchLogin,
        displayName: memberDisplayName,
        role: effectiveRole,
        profileValidationStatus: memberProfileStatus || "non_soumis",
        onboardingStatus: computedOnboardingStatus,
        integrationDate: memberIntegrationDateIso,
        parrain: member.parrain || null,
        bio: memberDescription,
        socials: {
          twitch: memberTwitchLogin ? `https://www.twitch.tv/${memberTwitchLogin}` : "",
          discord: memberDiscordUsername || "",
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
        discordPointsTrackingAvailable: discordPointsBackendAvailable,
      },
    });
  } catch (error) {
    console.error("[members/me/overview] GET error:", error);
    if (error instanceof Error) {
      console.error("[members/me/overview] Error stack:", error.stack);
    }
    try {
      const session = await getServerSession(authOptions);
      const discordIdFb = typeof session?.user?.discordId === "string" ? session.user.discordId.trim() : "";
      if (!discordIdFb) {
        return memberPrivateJson({ error: "Connexion requise" }, { status: 401 });
      }

      const monthKey = getCurrentMonthKey();
      const { data } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("discord_id", discordIdFb)
        .maybeSingle();

      return memberPrivateJson(
        buildSafeOverviewPayload({
          discordId: discordIdFb,
          monthKey,
          member: data || null,
        })
      );
    } catch (fallbackError) {
      console.error("[members/me/overview] fallback response failed:", fallbackError);
      return memberPrivateJson({ error: "Erreur serveur" }, { status: 500 });
    }
  }
}
