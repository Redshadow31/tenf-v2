import { NextRequest, NextResponse } from "next/server";
import { requireSectionAccess } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import {
  loadRaidsFaits,
  loadRaidsRecus,
  saveRaidsFaits,
  saveRaidsRecus,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
  type RaidFait,
  type RaidRecu,
} from "@/lib/raidStorage";
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSectionAccess("/admin/engagement/raids-a-valider");
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }
    const canManage = await hasAdvancedAdminAccess(admin.discordId);
    if (!canManage) {
      return NextResponse.json({ error: "Acces reserve aux admins avances." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const monthKey = resolveMonthKey(typeof body?.month === "string" ? body.month : undefined);

    const raidsFaits = await loadRaidsFaits(monthKey);
    const raidsRecus = await loadRaidsRecus(monthKey);

    const keyFait = (r: RaidFait) => `${r.raider}|${r.target}|${r.date}`;
    const keyRecu = (r: RaidRecu) => `${r.target}|${r.raider}|${r.date}`;

    const seenFaits = new Set<string>();
    const dedupedFaits: RaidFait[] = [];
    for (const raid of raidsFaits) {
      const key = keyFait(raid);
      if (seenFaits.has(key)) continue;
      seenFaits.add(key);
      dedupedFaits.push(raid);
    }

    const seenRecus = new Set<string>();
    const dedupedRecus: RaidRecu[] = [];
    for (const raid of raidsRecus) {
      const key = keyRecu(raid);
      if (seenRecus.has(key)) continue;
      seenRecus.add(key);
      dedupedRecus.push(raid);
    }

    const removedFaits = raidsFaits.length - dedupedFaits.length;
    const removedRecus = raidsRecus.length - dedupedRecus.length;
    const totalRemoved = removedFaits + removedRecus;

    if (totalRemoved > 0) {
      await saveRaidsFaits(monthKey, dedupedFaits);
      await saveRaidsRecus(monthKey, dedupedRecus);
      await recalculateAlerts(monthKey);
      await cacheDelete(cacheKey("api", "discord", "raids", "data-v2", monthKey, "v1"));
    }

    return NextResponse.json({
      message: totalRemoved > 0 ? "Doublons supprimes." : "Aucun doublon a supprimer.",
      removed: {
        total: totalRemoved,
        raidsFaits: removedFaits,
        raidsRecus: removedRecus,
      },
    });
  } catch (error) {
    console.error("[API Admin Engagement Raids Management Deduplicate] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

