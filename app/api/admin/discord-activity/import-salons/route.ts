import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import {
  getDiscordActivityForMonth,
  replaceDiscordActivitySalonsForMonth,
  updateDiscordActivityForMonth,
} from "@/lib/discordActivityStorage";
import { cacheDelete, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecordNumbers(v: unknown): v is Record<string, number> {
  if (!v || typeof v !== "object") return false;
  return Object.values(v as Record<string, unknown>).every((x) => typeof x === "number" && !Number.isNaN(x));
}

function uniqNormalizedStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const set = new Set<string>();
  for (const x of arr) {
    if (typeof x !== "string") continue;
    const t = x.trim().toLowerCase();
    if (t) set.add(t);
  }
  return [...set];
}

/**
 * POST — Import stats par salon pour un mois.
 * Body: { month, replace?, messagesByChannel?, vocalsMinutesByChannel?, staffNormalizedKeysMessages?, staffNormalizedKeysVocals? }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const month = body.month as string | undefined;
    const replace = Boolean(body.replace);
    const messagesByChannel = body.messagesByChannel;
    const vocalsMinutesByChannel = body.vocalsMinutesByChannel;
    const staffMsg =
      body.staffNormalizedKeysMessages !== undefined
        ? uniqNormalizedStrings(body.staffNormalizedKeysMessages)
        : undefined;
    const staffVoc =
      body.staffNormalizedKeysVocals !== undefined
        ? uniqNormalizedStrings(body.staffNormalizedKeysVocals)
        : undefined;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Le mois doit être au format YYYY-MM" }, { status: 400 });
    }

    const hasMsg = messagesByChannel !== undefined;
    const hasVoc = vocalsMinutesByChannel !== undefined;
    if (!hasMsg && !hasVoc) {
      return NextResponse.json(
        { error: "Fournir messagesByChannel et/ou vocalsMinutesByChannel" },
        { status: 400 }
      );
    }

    if (hasMsg && !isRecordNumbers(messagesByChannel)) {
      return NextResponse.json({ error: "messagesByChannel doit être un objet nombre → nombre" }, { status: 400 });
    }
    if (hasVoc && !isRecordNumbers(vocalsMinutesByChannel)) {
      return NextResponse.json(
        { error: "vocalsMinutesByChannel doit être un objet nombre → nombre (minutes)" },
        { status: 400 }
      );
    }

    if (replace) {
      await replaceDiscordActivitySalonsForMonth(month, {
        ...(hasMsg ? { messagesByChannel: messagesByChannel as Record<string, number> } : {}),
        ...(hasVoc ? { vocalsMinutesByChannel: vocalsMinutesByChannel as Record<string, number> } : {}),
        ...(hasMsg && staffMsg !== undefined ? { salonStaffNormalizedKeysMessages: staffMsg } : {}),
        ...(hasVoc && staffVoc !== undefined ? { salonStaffNormalizedKeysVocals: staffVoc } : {}),
      });
    } else {
      const current = await getDiscordActivityForMonth(month);
      const mergedStaffMsg =
        hasMsg && staffMsg !== undefined
          ? uniqNormalizedStrings([...(current?.salonStaffNormalizedKeysMessages || []), ...staffMsg])
          : undefined;
      const mergedStaffVoc =
        hasVoc && staffVoc !== undefined
          ? uniqNormalizedStrings([...(current?.salonStaffNormalizedKeysVocals || []), ...staffVoc])
          : undefined;

      await updateDiscordActivityForMonth(month, {
        ...(hasMsg ? { messagesByChannel: messagesByChannel as Record<string, number> } : {}),
        ...(hasVoc ? { vocalsMinutesByChannel: vocalsMinutesByChannel as Record<string, number> } : {}),
        ...(mergedStaffMsg !== undefined ? { salonStaffNormalizedKeysMessages: mergedStaffMsg } : {}),
        ...(mergedStaffVoc !== undefined ? { salonStaffNormalizedKeysVocals: mergedStaffVoc } : {}),
      });
    }

    await cacheDelete(cacheKey("api", "admin", "discord-activity", "data", month, "v1"));

    return NextResponse.json({
      success: true,
      message: `Salons enregistrés pour ${month}${replace ? " (remplacement)" : ""}.`,
    });
  } catch (error) {
    console.error("[API Discord Activity Import Salons] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
