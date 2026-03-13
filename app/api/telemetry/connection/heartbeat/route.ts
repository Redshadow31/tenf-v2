import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getReferer } from "@/lib/connection-logs/network";
import { heartbeatSession, recordSessionConnection } from "@/lib/services/connectionLogService";
import { resolveIpGeolocation } from "@/lib/services/ipGeolocationService";
import { getClientIp } from "@/lib/connection-logs/network";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { getValidHeartbeatSessionId, isHeartbeatRateLimited } from "@/lib/services/heartbeatGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    ensureConnectionLogsCleanupScheduler();
    const body = await request.json().catch(() => ({}));
    const sessionId = getValidHeartbeatSessionId(request, body?.sessionKey || body?.sessionId);
    if (!sessionId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 400 });
    }

    if (isHeartbeatRateLimited(sessionId)) {
      return NextResponse.json({ success: true, throttled: true }, { status: 202 });
    }

    const path = typeof body?.path === "string" ? body.path.slice(0, 256) : undefined;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.discordId || null;
    const username = session?.user?.username || null;
    const connectionType = userId ? "discord" : "guest";

    const updated = await heartbeatSession({
      sessionId,
      path,
      referer: getReferer(request),
      userId,
      username,
      isDiscordAuth: Boolean(userId),
      connectionType,
    });

    if (!updated) {
      const ipAddress = getClientIp(request);
      const geo = await resolveIpGeolocation({ request, ipAddress });
      await recordSessionConnection({
        sessionId,
        userId,
        username,
        isDiscordAuth: Boolean(userId),
        connectionType,
        ipAddress,
        userAgent: request.headers.get("user-agent"),
        path: path || "/",
        referer: getReferer(request),
        geo,
      });
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("[telemetry/connection/heartbeat] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
