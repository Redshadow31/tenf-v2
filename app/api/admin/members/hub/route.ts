import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { cacheGet, cacheKey, cacheSetWithNamespace } from "@/lib/cache";
import { loadMembersHubPayload } from "@/lib/admin/members/loadMembersHubPayload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HUB_NAMESPACE = "admin_members_hub";
const HUB_TTL_SECONDS = 60;

export async function GET() {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
    }

    const hubCacheKey = cacheKey("api", "admin", "members", "hub", "v1", admin.discordId, admin.role);
    const cached = await cacheGet<Awaited<ReturnType<typeof loadMembersHubPayload>>>(hubCacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
      });
    }

    const payload = await loadMembersHubPayload(admin);
    await cacheSetWithNamespace(HUB_NAMESPACE, hubCacheKey, payload, HUB_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("[API Admin Members Hub] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
