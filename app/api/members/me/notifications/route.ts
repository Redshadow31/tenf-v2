import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedAdmin } from "@/lib/requireAdmin";
import {
  listMemberNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  memberCanAccessNotification,
  syncProfileValidationNotification,
} from "@/lib/memberNotifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const admin = await getAuthenticatedAdmin();
    const includeAdminAudience = !!admin;

    let notifications: Awaited<ReturnType<typeof listMemberNotifications>>["notifications"] = [];
    let unreadCount = 0;
    try {
      if (includeAdminAudience) {
        await syncProfileValidationNotification();
      }
      const payload = await listMemberNotifications(discordId, { includeAdminAudience });
      notifications = payload.notifications;
      unreadCount = payload.unreadCount;
    } catch (notificationError) {
      console.error("[members/me/notifications] fallback to empty list:", notificationError);
    }

    return NextResponse.json({
      hasAdminAccess: includeAdminAudience,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[members/me/notifications] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const admin = await getAuthenticatedAdmin();
    const includeAdminAudience = !!admin;

    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body?.notificationId === "string" ? body.notificationId.trim() : "";
    const markAll = body?.markAll === true;

    if (markAll) {
      await markAllNotificationsAsRead(discordId, { includeAdminAudience });
    } else if (notificationId) {
      const allowed = await memberCanAccessNotification(notificationId, includeAdminAudience);
      if (!allowed) {
        return NextResponse.json({ error: "Notification inaccessible" }, { status: 403 });
      }
      await markNotificationAsRead(notificationId, discordId);
    } else {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    let notifications: Awaited<ReturnType<typeof listMemberNotifications>>["notifications"] = [];
    let unreadCount = 0;
    try {
      const payload = await listMemberNotifications(discordId, { includeAdminAudience });
      notifications = payload.notifications;
      unreadCount = payload.unreadCount;
    } catch (notificationError) {
      console.error("[members/me/notifications] post fallback to empty list:", notificationError);
    }
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("[members/me/notifications] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
