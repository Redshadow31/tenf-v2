import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { loadDiscordActivity } from "@/lib/discordActivityStorage";
import { salonChannelStaffTotals, splitSalonsForDisplay } from "@/lib/discordActivityChannelsAggregate";
import {
  loadDiscordActivitySalonSettings,
  type DiscordActivitySalonSettings,
} from "@/lib/discordActivitySalonSettingsStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sumMessages(messagesByUser: Record<string, number> | undefined): number {
  if (!messagesByUser) return 0;
  return Object.values(messagesByUser).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
}

function sumVoiceHours(
  vocalsByUser: Record<string, { hoursDecimal?: number }> | undefined
): number {
  if (!vocalsByUser) return 0;
  return Object.values(vocalsByUser).reduce((s, v) => s + (v?.hoursDecimal || 0), 0);
}

/**
 * GET — Synthèse mensuelle : totaux membres + répartition salons (optionnelle).
 * Query: mergeStaff=1|0, topPublic=8
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mergeStaff = searchParams.get("mergeStaff") !== "0";
    const topPublic = Math.min(25, Math.max(3, Number.parseInt(searchParams.get("topPublic") || "8", 10) || 8));

    const storage = await loadDiscordActivity();
    const settings: DiscordActivitySalonSettings = await loadDiscordActivitySalonSettings();

    const months = Object.keys(storage)
      .filter((k) => /^\d{4}-\d{2}$/.test(k))
      .sort();

    const rows = months.map((month) => {
      const d = storage[month];
      const totalMessages = sumMessages(d?.messagesByUser);
      const totalVoiceHours = sumVoiceHours(d?.vocalsByUser);

      const salonsMessages = splitSalonsForDisplay(
        d?.messagesByChannel,
        settings.staffNameSubstrings,
        settings.staffBucketLabel,
        {
          mergeStaff,
          topPublic,
          extraStaffNormalizedKeys: d?.salonStaffNormalizedKeysMessages,
        }
      );

      const salonsVocals = splitSalonsForDisplay(
        d?.vocalsMinutesByChannel,
        settings.staffNameSubstrings,
        settings.staffBucketLabel,
        {
          mergeStaff,
          topPublic,
          extraStaffNormalizedKeys: d?.salonStaffNormalizedKeysVocals,
        }
      );

      const msgSalon = salonChannelStaffTotals(
        d?.messagesByChannel,
        settings.staffNameSubstrings,
        d?.salonStaffNormalizedKeysMessages
      );
      const vocSalon = salonChannelStaffTotals(
        d?.vocalsMinutesByChannel,
        settings.staffNameSubstrings,
        d?.salonStaffNormalizedKeysVocals
      );
      const staffSalonMessagesPct =
        msgSalon.total > 0 ? Math.round((msgSalon.staff / msgSalon.total) * 1000) / 10 : null;
      const staffSalonVocalsPct =
        vocSalon.total > 0 ? Math.round((vocSalon.staff / vocSalon.total) * 1000) / 10 : null;

      return {
        month,
        totalMessages,
        totalVoiceHours,
        hasSalonMessages: Boolean(d?.messagesByChannel && Object.keys(d.messagesByChannel).length > 0),
        hasSalonVocals: Boolean(
          d?.vocalsMinutesByChannel && Object.keys(d.vocalsMinutesByChannel).length > 0
        ),
        staffSalonMessagesPct,
        staffSalonVocalsPct,
        salonsMessages,
        salonsVocals,
      };
    });

    return NextResponse.json({
      success: true,
      mergeStaff,
      topPublic,
      rows,
    });
  } catch (error) {
    console.error("[API Discord Activity Timeline] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
