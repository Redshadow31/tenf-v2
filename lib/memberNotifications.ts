import { supabaseAdmin } from "@/lib/db/supabase";

const PROFILE_VALIDATION_DEDUPE_KEY = "admin.profile-validation.pending";

/** Notifications réservées au dashboard admin / staff */
export const AUDIENCE_ADMIN_ACCESS = "admin_access";
/** Annonces visibles par tous les membres connectés du site */
export const AUDIENCE_COMMUNITY_BROADCAST = "community_broadcast";
/** Rappels et messages visibles uniquement par un membre (cible Discord) */
export const AUDIENCE_MEMBER_DIRECT = "member_direct";

export interface MemberNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown>;
  /** Dérivé de metadata (annonces serveur) */
  imageUrl: string | null;
  bodyFormat: "markdown" | "plain";
}

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  audience: string;
  created_at: string;
  updated_at: string;
};

type NotificationReadRow = {
  notification_id: string;
  read_at: string;
};

function dateValue(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function notificationAudiencesForUser(includeAdminAudience: boolean): string[] {
  return includeAdminAudience ? [AUDIENCE_ADMIN_ACCESS, AUDIENCE_COMMUNITY_BROADCAST] : [AUDIENCE_COMMUNITY_BROADCAST];
}

function mapMetadataToItem(
  metadata: Record<string, unknown> | null,
  notificationType: string,
): { imageUrl: string | null; bodyFormat: "markdown" | "plain" } {
  const m = metadata || {};
  const img = m.imageUrl;
  const imageUrl = typeof img === "string" && img.trim() ? img.trim() : null;
  const fmt = m.bodyFormat;
  const bodyFormat: "markdown" | "plain" =
    fmt === "plain"
      ? "plain"
      : fmt === "markdown" || notificationType === "server_announcement"
        ? "markdown"
        : "plain";
  return { imageUrl, bodyFormat };
}

export async function syncProfileValidationNotification(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("member_profile_pending")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  const pendingCount = count || 0;
  const now = new Date().toISOString();

  if (pendingCount > 0) {
    const title = "Profils en attente de validation";
    const message =
      pendingCount === 1
        ? "1 profil membre est en attente de validation."
        : `${pendingCount} profils membres sont en attente de validation.`;

    const { error: upsertError } = await supabaseAdmin.from("member_notifications").upsert(
      {
        dedupe_key: PROFILE_VALIDATION_DEDUPE_KEY,
        audience: AUDIENCE_ADMIN_ACCESS,
        type: "profile_validation_pending",
        title,
        message,
        link: "/admin/membres/validation-profil",
        metadata: { pendingCount },
        is_active: true,
        updated_at: now,
      },
      { onConflict: "dedupe_key" },
    );

    if (upsertError) {
      throw upsertError;
    }
  } else {
    const { error: disableError } = await supabaseAdmin
      .from("member_notifications")
      .update({
        is_active: false,
        metadata: { pendingCount: 0 },
        updated_at: now,
      })
      .eq("dedupe_key", PROFILE_VALIDATION_DEDUPE_KEY);

    if (disableError) {
      throw disableError;
    }
  }

  return pendingCount;
}

export async function listMemberNotifications(
  discordId: string,
  opts: { includeAdminAudience: boolean },
): Promise<{
  notifications: MemberNotificationItem[];
  unreadCount: number;
}> {
  const audiences = notificationAudiencesForUser(opts.includeAdminAudience);

  const selectCols = "id,type,title,message,link,metadata,audience,created_at,updated_at";

  const [{ data: broadcastRows, error: broadcastError }, { data: personalRows, error: personalError }] =
    await Promise.all([
      supabaseAdmin
        .from("member_notifications")
        .select(selectCols)
        .eq("is_active", true)
        .in("audience", audiences)
        .is("target_discord_id", null)
        .order("updated_at", { ascending: false })
        .limit(120),
      supabaseAdmin
        .from("member_notifications")
        .select(selectCols)
        .eq("is_active", true)
        .eq("audience", AUDIENCE_MEMBER_DIRECT)
        .eq("target_discord_id", discordId)
        .order("updated_at", { ascending: false })
        .limit(120),
    ]);

  if (broadcastError) {
    throw broadcastError;
  }
  if (personalError) {
    throw personalError;
  }

  const byId = new Map<string, NotificationRow>();
  for (const row of [...((broadcastRows || []) as NotificationRow[]), ...((personalRows || []) as NotificationRow[])]) {
    byId.set(row.id, row);
  }

  const notifications = [...byId.values()].sort(
    (a, b) => dateValue(b.updated_at || b.created_at) - dateValue(a.updated_at || a.created_at),
  );

  if (notifications.length === 0) {
    return { notifications: [], unreadCount: 0 };
  }

  const trimmed = notifications.slice(0, 120);

  const ids = trimmed.map((item) => item.id);
  const { data: readRows, error: readError } = await supabaseAdmin
    .from("member_notification_reads")
    .select("notification_id,read_at")
    .eq("member_discord_id", discordId)
    .in("notification_id", ids);

  if (readError) {
    throw readError;
  }

  const readMap = new Map<string, string>();
  ((readRows || []) as NotificationReadRow[]).forEach((row) => {
    readMap.set(row.notification_id, row.read_at);
  });

  let unreadCount = 0;
  const formatted: MemberNotificationItem[] = trimmed.map((notification) => {
    const readAt = readMap.get(notification.id) || null;
    const changedAt = notification.updated_at || notification.created_at;
    const isRead = dateValue(readAt) >= dateValue(changedAt);

    if (!isRead) unreadCount += 1;

    const { imageUrl, bodyFormat } = mapMetadataToItem(notification.metadata, notification.type);

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
      isRead,
      readAt,
      metadata: notification.metadata || {},
      imageUrl,
      bodyFormat,
    };
  });

  return { notifications: formatted, unreadCount };
}

/** Vérifie qu’un utilisateur peut lire cette notification (anti-fraude sur IDs). */
export async function memberCanAccessNotification(
  notificationId: string,
  opts: { includeAdminAudience: boolean; memberDiscordId: string },
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("member_notifications")
    .select("audience, target_discord_id")
    .eq("id", notificationId)
    .maybeSingle();

  if (error || !data) return false;
  const row = data as { audience?: string; target_discord_id?: string | null };
  const aud = String(row.audience || "");
  if (aud === AUDIENCE_COMMUNITY_BROADCAST) return true;
  if (aud === AUDIENCE_ADMIN_ACCESS) return opts.includeAdminAudience;
  if (aud === AUDIENCE_MEMBER_DIRECT) return row.target_discord_id === opts.memberDiscordId;
  return false;
}

export async function markNotificationAsRead(notificationId: string, discordId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("member_notification_reads").upsert(
    {
      notification_id: notificationId,
      member_discord_id: discordId,
      read_at: now,
    },
    { onConflict: "notification_id,member_discord_id" },
  );

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead(
  discordId: string,
  opts: { includeAdminAudience: boolean },
): Promise<void> {
  const audiences = notificationAudiencesForUser(opts.includeAdminAudience);

  const [{ data: broadcastActive, error: broadcastErr }, { data: personalActive, error: personalErr }] =
    await Promise.all([
      supabaseAdmin.from("member_notifications").select("id").eq("is_active", true).in("audience", audiences).is("target_discord_id", null),
      supabaseAdmin
        .from("member_notifications")
        .select("id")
        .eq("is_active", true)
        .eq("audience", AUDIENCE_MEMBER_DIRECT)
        .eq("target_discord_id", discordId),
    ]);

  if (broadcastErr) {
    throw broadcastErr;
  }
  if (personalErr) {
    throw personalErr;
  }

  const rows = [
    ...((broadcastActive || []) as Array<{ id: string }>),
    ...((personalActive || []) as Array<{ id: string }>),
  ];
  if (rows.length === 0) return;

  const now = new Date().toISOString();
  const payload = rows.map((row) => ({
    notification_id: row.id,
    member_discord_id: discordId,
    read_at: now,
  }));

  const { error } = await supabaseAdmin
    .from("member_notification_reads")
    .upsert(payload, { onConflict: "notification_id,member_discord_id" });

  if (error) {
    throw error;
  }
}
