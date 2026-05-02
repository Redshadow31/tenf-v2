import { addDays, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { supabaseAdmin } from "@/lib/db/supabase";
import { loadIntegrations, loadRegistrations } from "@/lib/integrationStorage";
import { AUDIENCE_MEMBER_DIRECT } from "@/lib/memberNotifications";
import { eventRepository } from "@/lib/repositories";
import { formatEventDateTimeInTimezone, PARIS_TIMEZONE } from "@/lib/timezone";

type Phase = "eve" | "day";

function calendarKeyParisFromUtc(iso: string): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatInTimeZone(d, PARIS_TIMEZONE, "yyyy-MM-dd");
}

function previousCalendarDayKeyParis(eventDayKey: string): string {
  const ref = fromZonedTime(`${eventDayKey}T12:00:00`, PARIS_TIMEZONE);
  const prev = addDays(ref, -1);
  return formatInTimeZone(prev, PARIS_TIMEZONE, "yyyy-MM-dd");
}

/** Date d'intégration souvent stockée en yyyy-MM-dd : ancrage midi heure de Paris. */
function integrationStartsAtIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    try {
      return fromZonedTime(`${trimmed}T12:00:00`, PARIS_TIMEZONE).toISOString();
    } catch {
      return null;
    }
  }
  const d = parseISO(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Crée / met à jour les rappels personnels (veille + jour J) pour les événements et réunions d’intégration
 * auxquels le membre est inscrit. Désactive les lignes devenues obsolètes.
 * À appeler lors du chargement des notifications (session membre).
 */
export async function syncRegistrationReminderNotificationsForMember(params: {
  discordId: string;
  twitchLogin: string;
}): Promise<void> {
  const { discordId } = params;
  const twitch = params.twitchLogin.trim().toLowerCase();
  const now = new Date().toISOString();
  const todayKey = formatInTimeZone(new Date(), PARIS_TIMEZONE, "yyyy-MM-dd");

  const desiredKeys = new Set<string>();
  const upserts: Record<string, unknown>[] = [];

  const pushReminder = (opts: {
    kind: "event" | "integration";
    resourceId: string;
    title: string;
    startsAtIso: string;
    phase: Phase;
    link: string;
  }) => {
    const eventDayKey = calendarKeyParisFromUtc(opts.startsAtIso);
    if (!eventDayKey) return;

    const eveTargetDay = previousCalendarDayKeyParis(eventDayKey);
    const isEveWindow = todayKey === eveTargetDay;
    const isDayWindow = todayKey === eventDayKey;

    if (opts.phase === "eve" && !isEveWindow) return;
    if (opts.phase === "day" && !isDayWindow) return;

    const dedupeKey =
      opts.kind === "event"
        ? `reg_reminder:event:${opts.resourceId}:${discordId}:${opts.phase}`
        : `reg_reminder:integration:${opts.resourceId}:${discordId}:${opts.phase}`;

    desiredKeys.add(dedupeKey);

    const { fullLabel } = formatEventDateTimeInTimezone(opts.startsAtIso, PARIS_TIMEZONE);
    const title =
      opts.phase === "eve" ? `Demain : ${opts.title}` : `Aujourd'hui : ${opts.title}`;
    const message =
      opts.phase === "eve"
        ? `Rappel : tu es inscrit(e) à « ${opts.title} ». Rendez-vous demain (${fullLabel}).`
        : `C'est aujourd'hui : « ${opts.title} » (${fullLabel}).`;

    upserts.push({
      dedupe_key: dedupeKey,
      audience: AUDIENCE_MEMBER_DIRECT,
      target_discord_id: discordId,
      type: opts.phase === "eve" ? "registration_reminder_eve" : "registration_reminder_day",
      title,
      message,
      link: opts.link,
      metadata: {
        reminderKind: opts.kind,
        resourceId: opts.resourceId,
        phase: opts.phase,
        startsAt: opts.startsAtIso,
      },
      is_active: true,
      updated_at: now,
    });
  };

  let events: Array<{ eventId: string; title: string; startsAtIso: string }> = [];
  try {
    events = await eventRepository.listPublishedRegisteredEventsForMember({
      discordId,
      twitchLogin: twitch,
    });
  } catch (e) {
    console.warn("[memberRegistrationReminders] événements:", e);
  }

  for (const ev of events) {
    pushReminder({
      kind: "event",
      resourceId: ev.eventId,
      title: ev.title,
      startsAtIso: ev.startsAtIso,
      phase: "eve",
      link: "/member/evenements/inscriptions",
    });
    pushReminder({
      kind: "event",
      resourceId: ev.eventId,
      title: ev.title,
      startsAtIso: ev.startsAtIso,
      phase: "day",
      link: "/member/evenements/inscriptions",
    });
  }

  try {
    const integrations = await loadIntegrations();
    for (const int of integrations) {
      if (!int.isPublished) continue;
      const regs = await loadRegistrations(int.id);
      const mine = regs.find(
        (r) =>
          (r.discordId && r.discordId === discordId) ||
          r.twitchLogin.trim().toLowerCase() === twitch,
      );
      if (!mine) continue;

      const startsAtIso = integrationStartsAtIso(int.date);
      if (!startsAtIso) continue;

      pushReminder({
        kind: "integration",
        resourceId: int.id,
        title: int.title,
        startsAtIso,
        phase: "eve",
        link: "/integration",
      });
      pushReminder({
        kind: "integration",
        resourceId: int.id,
        title: int.title,
        startsAtIso,
        phase: "day",
        link: "/integration",
      });
    }
  } catch (e) {
    console.warn("[memberRegistrationReminders] intégrations:", e);
  }

  if (upserts.length > 0) {
    const keys = upserts.map((u) => u.dedupe_key as string);
    const { data: existingRows } = await supabaseAdmin
      .from("member_notifications")
      .select("dedupe_key,title,message,link,is_active")
      .in("dedupe_key", keys);

    const existingMap = new Map(
      (existingRows || []).map((r: { dedupe_key: string; title: string; message: string; link: string | null; is_active: boolean }) => [
        r.dedupe_key,
        { title: r.title, message: r.message, link: r.link, is_active: r.is_active },
      ]),
    );

    const toWrite = upserts.filter((row) => {
      const ex = existingMap.get(row.dedupe_key as string);
      if (!ex) return true;
      return (
        ex.title !== row.title ||
        ex.message !== row.message ||
        ex.link !== row.link ||
        ex.is_active !== true
      );
    });

    if (toWrite.length > 0) {
      const { error } = await supabaseAdmin.from("member_notifications").upsert(toWrite, { onConflict: "dedupe_key" });
      if (error) {
        console.warn("[memberRegistrationReminders] upsert:", error.message);
      }
    }
  }

  const { data: activeRows, error: selErr } = await supabaseAdmin
    .from("member_notifications")
    .select("dedupe_key")
    .eq("target_discord_id", discordId)
    .eq("audience", AUDIENCE_MEMBER_DIRECT)
    .eq("is_active", true)
    .like("dedupe_key", "reg_reminder:%");

  if (selErr) {
    console.warn("[memberRegistrationReminders] lecture rappels actifs:", selErr.message);
    return;
  }

  const toDeactivate = (activeRows || [])
    .map((r: { dedupe_key: string }) => r.dedupe_key)
    .filter((k) => !desiredKeys.has(k));

  if (toDeactivate.length === 0) return;

  const { error: deactErr } = await supabaseAdmin
    .from("member_notifications")
    .update({ is_active: false, updated_at: now })
    .in("dedupe_key", toDeactivate);

  if (deactErr) {
    console.warn("[memberRegistrationReminders] désactivation:", deactErr.message);
  }
}
