import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeAdminRole } from "@/lib/adminRoles";

const ADMIN_MOBILE_LINKS = [
  { key: "members", label: "Liste et gestion des membres", path: "/admin/membres-complets" },
  { key: "presences", label: "Présences événements", path: "/admin/events/presences" },
  { key: "calendar", label: "Calendrier d'intégration", path: "/admin/integration/calendrier" },
  { key: "raids", label: "Gestion des raids", path: "/admin/engagement/raids-sub/summary" },
  { key: "discord-points", label: "Points Discord", path: "/admin/events/points-discord" },
] as const;

export async function GET(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  const token = await getToken({ req: request, secret });
  const discordId = (token?.discordId as string | undefined) || "";
  const role = normalizeAdminRole((token?.role as string | null | undefined) || null);

  if (!discordId) {
    return NextResponse.json({ authenticated: false, allowed: false }, { status: 401 });
  }

  if (!role) {
    return NextResponse.json({
      authenticated: true,
      allowed: false,
      reason: "not_admin",
    });
  }

  return NextResponse.json({
    authenticated: true,
    allowed: true,
    role,
    links: ADMIN_MOBILE_LINKS,
  });
}

