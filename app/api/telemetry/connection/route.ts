import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { type ConnectionType } from "@/lib/connectionLogs";
import { getClientIpDiagnostics, getReferer } from "@/lib/connection-logs/network";
import { resolveIpGeolocationWithDiagnostics } from "@/lib/services/ipGeolocationService";
import { recordSessionConnection } from "@/lib/services/connectionLogService";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TELEMETRY_IP_POLICY = {
  name: "telemetry-connection-ip",
  limit: 240,
  windowSeconds: 60,
} as const;

const TELEMETRY_SESSION_POLICY = {
  name: "telemetry-connection-session",
  limit: 90,
  windowSeconds: 60,
} as const;

export async function POST(request: NextRequest) {
  try {
    const ipLimit = await checkRateLimit({
      request,
      policy: TELEMETRY_IP_POLICY,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many telemetry requests" },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    ensureConnectionLogsCleanupScheduler();
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path.slice(0, 256) : "/";
    const sessionFromBody = typeof body?.sessionKey === "string" ? body.sessionKey : "";
    const userAgent = request.headers.get("user-agent");

    const sessionId = sessionFromBody || randomUUID();
    const sessionLimit = await checkRateLimit({
      request,
      policy: TELEMETRY_SESSION_POLICY,
      identity: `${session?.user?.discordId || "guest"}:${sessionId}`,
    });
    if (!sessionLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many telemetry requests" },
        {
          status: 429,
          headers: { "Retry-After": String(sessionLimit.retryAfterSeconds) },
        }
      );
    }

    const connectionType: ConnectionType = session?.user?.discordId ? "discord" : "guest";
    const ipDiagnostics = getClientIpDiagnostics(request);
    const geoResolution = await resolveIpGeolocationWithDiagnostics({
      request,
      ipAddress: ipDiagnostics.ipAddress,
      ipReason: ipDiagnostics.reason,
    });

    await recordSessionConnection({
      sessionId,
      path,
      referer: getReferer(request),
      userAgent,
      connectionType,
      userId: session?.user?.discordId || null,
      username: session?.user?.username || null,
      isDiscordAuth: Boolean(session?.user?.discordId),
      ipAddress: ipDiagnostics.ipAddress,
      geo: {
        ...geoResolution.geo,
        status: geoResolution.diagnostics.status,
        reason: geoResolution.diagnostics.reason,
      },
    });

    const response = NextResponse.json({ success: true, sessionId });
    response.cookies.set("tenf_visit_id", sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[telemetry/connection] error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
