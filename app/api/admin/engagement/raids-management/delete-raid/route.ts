import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { memberRepository } from "@/lib/repositories";
import { getCurrentMonthKey, getMonthKey, removeRaidFait } from "@/lib/raidStorage";
import { cacheDelete, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveMonthKey(month?: string): string {
  if (!month) return getCurrentMonthKey();
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return getCurrentMonthKey();
  const year = Number(match[1]);
  const monthNum = Number(match[2]);
  if (!year || monthNum < 1 || monthNum > 12) return getCurrentMonthKey();
  return getMonthKey(year, monthNum);
}

async function resolveDiscordId(loginOrId: string): Promise<string> {
  const input = loginOrId.trim();
  if (!input) return "";
  const member = await memberRepository.findByTwitchLogin(input.toLowerCase());
  return member?.discordId || input;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSectionAccess("/admin/engagement/raids-a-valider");
    const canManage = await hasAdvancedAdminAccess(admin.discordId);
    if (!canManage) {
      return NextResponse.json({ error: "Acces reserve aux admins avances." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const month = typeof body?.month === "string" ? body.month : "";
    const raider = typeof body?.raider === "string" ? body.raider : "";
    const target = typeof body?.target === "string" ? body.target : "";
    const date = typeof body?.date === "string" ? body.date : "";

    if (!raider || !target || !date) {
      return NextResponse.json({ error: "raider, target et date sont requis." }, { status: 400 });
    }

    const monthKey = resolveMonthKey(month);
    const raiderId = await resolveDiscordId(raider);
    const targetId = await resolveDiscordId(target);
    const deleted = await removeRaidFait(monthKey, raiderId, targetId, date);

    if (!deleted) {
      return NextResponse.json({ error: "Raid introuvable." }, { status: 404 });
    }

    await cacheDelete(cacheKey("api", "discord", "raids", "data-v2", monthKey, "v1"));
    return NextResponse.json({ success: true, message: "Raid supprime." });
  } catch (error) {
    console.error("[API Admin Engagement Raids Management Delete] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

