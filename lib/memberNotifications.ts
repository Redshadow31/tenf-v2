import { supabaseAdmin } from "@/lib/db/supabase";

const PROFILE_VALIDATION_DEDUPE_KEY = "admin.profile-validation.pending";

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
}

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
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
        audience: "admin_access",
        type: "profile_validation_pending",
        title,
        message,
        link: "/admin/membres/validation-profil",
        metadata: { pendingCount },
        is_active: true,
        updated_at: now,
      },
      { onConflict: "dedupe_key" }
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

export async function listMemberNotifications(discordId: string): Promise<{
  notifications: MemberNotificationItem[];
  unreadCount: number;
}> {
  const { data: notificationRows, error } = await supabaseAdmin
    .from("member_notifications")
    .select("id,type,title,message,link,metadata,created_at,updated_at")
    .eq("is_active", true)
    .eq("audience", "admin_access")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const notifications = (notificationRows || []) as NotificationRow[];
  if (notifications.length === 0) {
    return { notifications: [], unreadCount: 0 };
  }

  const ids = notifications.map((item) => item.id);
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
  const formatted: MemberNotificationItem[] = notifications.map((notification) => {
    const readAt = readMap.get(notification.id) || null;
    const changedAt = notification.updated_at || notification.created_at;
    const isRead = dateValue(readAt) >= dateValue(changedAt);

    if (!isRead) unreadCount += 1;

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
    };
  });

  return { notifications: formatted, unreadCount };
}

export async function markNotificationAsRead(notificationId: string, discordId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("member_notification_reads").upsert(
    {
      notification_id: notificationId,
      member_discord_id: discordId,
      read_at: now,
    },
    { onConflict: "notification_id,member_discord_id" }
  );

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead(discordId: string): Promise<void> {
  const { data: activeRows, error: activeError } = await supabaseAdmin
    .from("member_notifications")
    .select("id")
    .eq("is_active", true)
    .eq("audience", "admin_access");

  if (activeError) {
    throw activeError;
  }

  const rows = (activeRows || []) as Array<{ id: string }>;
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
