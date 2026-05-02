import { supabaseAdmin } from "@/lib/db/supabase";
import { sendDiscordDm } from "@/lib/discordBotDm";
import { fetchAllGuildMemberDiscordIds } from "@/lib/discordGuildMemberIds";
import {
  AUDIENCE_ADMIN_ACCESS,
  AUDIENCE_COMMUNITY_BROADCAST,
} from "@/lib/memberNotifications";
import { absoluteSiteUrl } from "@/lib/siteBaseUrl";
import { listDashboardStaffDiscordIds } from "@/lib/staffDashboardDiscordRecipients";

export type DbAnnouncementAudience = "staff" | "community";

export interface StaffAnnouncementPublic {
  id: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  audience: DbAnnouncementAudience;
  authorDiscordId: string;
  authorDisplayName: string | null;
  createdAt: string;
  updatedAt: string;
}

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  image_url: string | null;
  audience: string;
  author_discord_id: string;
  author_display_name: string | null;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

function mapRow(row: AnnouncementRow): StaffAnnouncementPublic {
  const aud = row.audience === "community" ? "community" : "staff";
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    link: row.link,
    imageUrl: row.image_url,
    audience: aud,
    authorDiscordId: row.author_discord_id,
    authorDisplayName: row.author_display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function defaultNotificationLink(audience: DbAnnouncementAudience): string {
  return audience === "staff" ? "/admin/mon-compte" : "/member/notifications";
}

function notificationAudienceForDb(audience: DbAnnouncementAudience): string {
  return audience === "staff" ? AUDIENCE_ADMIN_ACCESS : AUDIENCE_COMMUNITY_BROADCAST;
}

export async function listActiveStaffAnnouncements(
  limit = 50,
  filter?: { audience?: DbAnnouncementAudience },
): Promise<StaffAnnouncementPublic[]> {
  let q = supabaseAdmin
    .from("staff_announcements")
    .select(
      "id,title,body,link,image_url,audience,author_discord_id,author_display_name,notification_id,created_at,updated_at,is_active",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter?.audience) {
    q = q.eq("audience", filter.audience);
  }

  const { data, error } = await q;

  if (error) throw error;
  return ((data || []) as AnnouncementRow[]).map(mapRow);
}

async function insertMemberNotificationForAnnouncement(
  announcementId: string,
  params: {
    title: string;
    body: string;
    link: string | null;
    authorDiscordId: string;
    imageUrl: string | null;
    audience: DbAnnouncementAudience;
  },
): Promise<string> {
  const dedupeKey = `staff.announcement.${announcementId}`;
  const audience = notificationAudienceForDb(params.audience);
  const link = params.link?.trim() || defaultNotificationLink(params.audience);
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("member_notifications")
    .insert({
      dedupe_key: dedupeKey,
      audience,
      type: "server_announcement",
      title: params.title.trim(),
      message: params.body.trim(),
      link,
      metadata: {
        staffAnnouncementId: announcementId,
        authorDiscordId: params.authorDiscordId,
        bodyFormat: "markdown",
        imageUrl: params.imageUrl || undefined,
        announcementAudience: params.audience,
      },
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw error;
  return String(data.id);
}

async function syncNotificationRow(
  notificationId: string,
  params: {
    title: string;
    body: string;
    link: string | null;
    imageUrl: string | null;
    audience: DbAnnouncementAudience;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const link = params.link?.trim() || defaultNotificationLink(params.audience);

  const { data: prev, error: fetchMetaErr } = await supabaseAdmin
    .from("member_notifications")
    .select("metadata")
    .eq("id", notificationId)
    .maybeSingle();

  if (fetchMetaErr) throw fetchMetaErr;

  const meta = {
    ...((prev?.metadata as Record<string, unknown>) || {}),
    bodyFormat: "markdown",
    imageUrl: params.imageUrl || undefined,
    announcementAudience: params.audience,
  };

  const { error } = await supabaseAdmin
    .from("member_notifications")
    .update({
      title: params.title.trim(),
      message: params.body.trim(),
      link,
      metadata: meta,
      updated_at: now,
    })
    .eq("id", notificationId);

  if (error) throw error;
}

async function broadcastDiscordDm(params: {
  scope: DbAnnouncementAudience;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
}): Promise<{ attempted: number; failed: number }> {
  const token = String(process.env.DISCORD_BOT_TOKEN || "").trim();
  if (!token) {
    console.warn("[staffAnnouncements] DISCORD_BOT_TOKEN manquant — pas de DM.");
    return { attempted: 0, failed: 0 };
  }

  let recipients: string[];
  if (params.scope === "staff") {
    recipients = await listDashboardStaffDiscordIds();
  } else {
    recipients = await fetchAllGuildMemberDiscordIds(token);
  }

  const detailPath = params.scope === "staff" ? "/admin/mon-compte" : "/member/notifications";
  const lines = [
    "**Annonce TENF**",
    "",
    `**${params.title.trim()}**`,
    "",
    params.body.trim(),
  ];
  if (params.link?.trim()) lines.push("", params.link.trim());
  if (params.imageUrl?.trim()) {
    lines.push("", `Visuel : ${absoluteSiteUrl(params.imageUrl.trim())}`);
  }
  lines.push("", `— ${absoluteSiteUrl(detailPath)}`);

  let content = lines.join("\n");
  if (content.length > 1950) {
    content = `${content.slice(0, 1940)}…`;
  }

  let failed = 0;
  let attempted = 0;
  for (const discordId of recipients) {
    attempted += 1;
    const ok = await sendDiscordDm(token, discordId, content);
    if (!ok) failed += 1;
    await new Promise((r) => setTimeout(r, 115));
  }
  return { attempted, failed };
}

export async function createStaffAnnouncement(params: {
  title: string;
  body: string;
  link?: string | null;
  imageUrl?: string | null;
  audience: DbAnnouncementAudience;
  authorDiscordId: string;
  authorDisplayName?: string | null;
  sendDiscordDm?: boolean;
}): Promise<StaffAnnouncementPublic & { discordDm?: { attempted: number; failed: number } }> {
  const title = params.title.trim();
  const body = params.body.trim();
  if (!title || !body) {
    throw new Error("Titre et message requis.");
  }

  const audience: DbAnnouncementAudience = params.audience === "community" ? "community" : "staff";
  const imageUrl = params.imageUrl?.trim() || null;

  const now = new Date().toISOString();
  const { data: inserted, error: insErr } = await supabaseAdmin
    .from("staff_announcements")
    .insert({
      title,
      body,
      link: params.link?.trim() || null,
      image_url: imageUrl,
      audience,
      author_discord_id: params.authorDiscordId,
      author_display_name: params.authorDisplayName?.trim() || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id,title,body,link,image_url,audience,author_discord_id,author_display_name,notification_id,created_at,updated_at,is_active",
    )
    .single();

  if (insErr || !inserted) throw insErr || new Error("Insertion impossible.");

  const row = inserted as AnnouncementRow;
  let notificationId: string;
  try {
    notificationId = await insertMemberNotificationForAnnouncement(row.id, {
      title,
      body,
      link: params.link ?? null,
      authorDiscordId: params.authorDiscordId,
      imageUrl,
      audience,
    });
  } catch (e) {
    await supabaseAdmin.from("staff_announcements").delete().eq("id", row.id);
    throw e;
  }

  const { error: updErr } = await supabaseAdmin
    .from("staff_announcements")
    .update({ notification_id: notificationId, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (updErr) {
    console.error("[staffAnnouncements] notification_id link failed:", updErr);
  }

  let discordDm: { attempted: number; failed: number } | undefined;
  if (params.sendDiscordDm) {
    discordDm = await broadcastDiscordDm({
      scope: audience,
      title,
      body,
      link: params.link ?? null,
      imageUrl,
    });
    await supabaseAdmin
      .from("staff_announcements")
      .update({
        discord_dm_sent_at: new Date().toISOString(),
        discord_dm_attempted: discordDm.attempted,
        discord_dm_failed: discordDm.failed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }

  return { ...mapRow({ ...row, notification_id: notificationId }), discordDm };
}

export async function updateStaffAnnouncement(
  id: string,
  params: {
    title?: string;
    body?: string;
    link?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
  },
): Promise<void> {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("staff_announcements")
    .select(
      "id,title,body,link,image_url,audience,author_discord_id,author_display_name,notification_id,created_at,updated_at,is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!existing) throw new Error("Annonce introuvable.");

  const row = existing as AnnouncementRow;
  const audience: DbAnnouncementAudience = row.audience === "community" ? "community" : "staff";
  const title = params.title !== undefined ? params.title.trim() : row.title;
  const body = params.body !== undefined ? params.body.trim() : row.body;
  const link = params.link !== undefined ? params.link?.trim() || null : row.link;
  const imageUrl =
    params.imageUrl !== undefined ? params.imageUrl?.trim() || null : row.image_url;
  const isActive = params.isActive !== undefined ? params.isActive : row.is_active;

  if (!title || !body) {
    throw new Error("Titre et message requis.");
  }

  const now = new Date().toISOString();
  const { error: upErr } = await supabaseAdmin
    .from("staff_announcements")
    .update({
      title,
      body,
      link,
      image_url: imageUrl,
      is_active: isActive,
      updated_at: now,
    })
    .eq("id", id);

  if (upErr) throw upErr;

  if (row.notification_id) {
    await syncNotificationRow(row.notification_id, { title, body, link, imageUrl, audience });
    const { error: nErr } = await supabaseAdmin
      .from("member_notifications")
      .update({ is_active: isActive, updated_at: now })
      .eq("id", row.notification_id);
    if (nErr) console.error("[staffAnnouncements] sync notification active:", nErr);
  }
}
