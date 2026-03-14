import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";

type NotificationReadRow = {
  id: string;
  notification_id: string;
  member_discord_id: string;
  read_at: string;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  type: string;
  updated_at: string;
};

type MemberRow = {
  discord_id: string | null;
  twitch_login: string;
  display_name: string;
  discord_username: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);

    const { count, error: countError } = await supabaseAdmin
      .from("member_notification_reads")
      .select("*", { count: "exact", head: true });
    if (countError) throw countError;

    const { data: readRows, error: readError } = await supabaseAdmin
      .from("member_notification_reads")
      .select("id,notification_id,member_discord_id,read_at")
      .order("read_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (readError) throw readError;

    const reads = (readRows || []) as NotificationReadRow[];
    if (reads.length === 0) {
      return NextResponse.json({ logs: [], total: count || 0, hasMore: false });
    }

    const notificationIds = Array.from(new Set(reads.map((row) => row.notification_id)));
    const memberDiscordIds = Array.from(new Set(reads.map((row) => row.member_discord_id)));

    const [{ data: notificationRows, error: notificationError }, { data: memberRows, error: memberError }] =
      await Promise.all([
        supabaseAdmin
          .from("member_notifications")
          .select("id,title,message,link,type,updated_at")
          .in("id", notificationIds),
        supabaseAdmin
          .from("members")
          .select("discord_id,twitch_login,display_name,discord_username")
          .in("discord_id", memberDiscordIds),
      ]);

    if (notificationError) throw notificationError;
    if (memberError) throw memberError;

    const notificationMap = new Map<string, NotificationRow>();
    ((notificationRows || []) as NotificationRow[]).forEach((row) => {
      notificationMap.set(row.id, row);
    });

    const memberMap = new Map<string, MemberRow>();
    ((memberRows || []) as MemberRow[]).forEach((row) => {
      if (row.discord_id) {
        memberMap.set(row.discord_id, row);
      }
    });

    const logs = reads.map((row) => {
      const notification = notificationMap.get(row.notification_id);
      const member = memberMap.get(row.member_discord_id);
      return {
        id: row.id,
        readAt: row.read_at,
        memberDiscordId: row.member_discord_id,
        memberDisplayName:
          member?.display_name || member?.discord_username || member?.twitch_login || row.member_discord_id,
        memberTwitchLogin: member?.twitch_login || null,
        notificationId: row.notification_id,
        notificationType: notification?.type || null,
        notificationTitle: notification?.title || "Notification supprimée",
        notificationMessage: notification?.message || "",
        notificationLink: notification?.link || null,
        notificationUpdatedAt: notification?.updated_at || null,
      };
    });

    const total = count || 0;
    return NextResponse.json({
      logs,
      total,
      hasMore: offset + logs.length < total,
    });
  } catch (error) {
    console.error("[admin/logs/notification-reads] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
