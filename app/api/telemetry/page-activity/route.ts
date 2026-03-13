import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getValidHeartbeatSessionId } from "@/lib/services/heartbeatGuard";
import { recordPageActivity, type PageActivityEventType } from "@/lib/services/pageActivityService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_ACTIVITY_IP_POLICY = {
  name: "telemetry-page-activity-ip",
  limit: 240,
  windowSeconds: 60,
} as const;

const PAGE_ACTIVITY_SESSION_POLICY = {
  name: "telemetry-page-activity-session",
  limit: 120,
  windowSeconds: 60,
} as const;

function parseEventType(value: unknown): PageActivityEventType {
  return value === "click" ? "click" : "page_view";
}

export async function POST(request: NextRequest) {
  try {
    const ipLimit = await checkRateLimit({
      request,
      policy: PAGE_ACTIVITY_IP_POLICY,
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

    const body = await request.json().catch(() => ({}));
    const sessionId = getValidHeartbeatSessionId(request, body?.sessionKey);
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session invalide" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const sessionLimit = await checkRateLimit({
      request,
      policy: PAGE_ACTIVITY_SESSION_POLICY,
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

    const path = typeof body?.path === "string" ? body.path : "/";
    const title = typeof body?.title === "string" ? body.title : null;
    const target = typeof body?.target === "string" ? body.target : null;
    const eventType = parseEventType(body?.eventType);

    const tracked = await recordPageActivity({
      sessionId,
      path,
      title,
      target,
      eventType,
      userId: session?.user?.discordId || null,
      username: session?.user?.username || null,
      isAuthenticated: Boolean(session?.user?.discordId),
    });

    return NextResponse.json({ success: true, tracked });
  } catch (error) {
    console.error("[telemetry/page-activity] error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
