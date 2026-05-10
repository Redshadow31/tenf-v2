import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { loadDiscordActivity } from "@/lib/discordActivityStorage";
import { formatVocalDurationFr, vocalEntryToMinutes } from "@/lib/discordActivityVocal";
import {
  buildDiscordStorageIdentityMap,
  coerceMessageCount,
  normalizeKey,
  remapAndAggregateEntries,
} from "@/lib/discordActivityIdentityMap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET — Historique mensuel messages + vocal Discord pour le membre connecté (même stockage que l’admin).
 * Rattachement : twitch_login + discord_id + discord_username uniquement (voir `buildDiscordStorageIdentityMap`).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const member = await memberRepository.findByDiscordId(session.user.discordId);
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    const memberLogin = normalizeKey(member.twitchLogin);
    if (!memberLogin) {
      return NextResponse.json({ error: "Profil incomplet (login Twitch)" }, { status: 400 });
    }

    const allMembers = await memberRepository.findAllBatched();
    const identityToLogin = buildDiscordStorageIdentityMap(allMembers);

    const storage = await loadDiscordActivity();
    const months = Object.keys(storage)
      .filter((k) => /^\d{4}-\d{2}$/.test(k))
      .sort((a, b) => b.localeCompare(a));

    const rows = months.map((month) => {
      const data = storage[month];
      if (!data) {
        return {
          month,
          messages: 0,
          vocalMinutes: 0,
          vocalDisplay: formatVocalDurationFr(0),
          vocalHoursDecimal: 0,
        };
      }

      const messagesByUser = data.messagesByUser || {};
      const vocalsByUser = data.vocalsByUser || {};

      const rawMessagesEntries = Object.entries(messagesByUser)
        .map(([k, v]) => ({ key: k, value: coerceMessageCount(v) }))
        .filter((entry) => entry.key && Number.isFinite(entry.value));

      const messagesEntries = remapAndAggregateEntries(rawMessagesEntries, identityToLogin);
      const msgRow = messagesEntries.find((e) => normalizeKey(e.key) === memberLogin);
      const messages = msgRow?.value ?? 0;

      const rawVocalsEntries = Object.entries(vocalsByUser)
        .map(([k, v]) => ({
          key: k,
          value: vocalEntryToMinutes(v),
        }))
        .filter((entry) => entry.key && Number.isFinite(entry.value));

      const vocalsEntries = remapAndAggregateEntries(rawVocalsEntries, identityToLogin);
      const vocRow = vocalsEntries.find((e) => normalizeKey(e.key) === memberLogin);
      const vocalMinutes = vocRow?.value ?? 0;

      return {
        month,
        messages,
        vocalMinutes,
        vocalDisplay: formatVocalDurationFr(vocalMinutes),
        vocalHoursDecimal: Math.round((vocalMinutes / 60) * 10) / 10,
      };
    });

    const res = NextResponse.json({
      success: true,
      displayName: member.displayName || member.twitchLogin,
      twitchLogin: member.twitchLogin,
      months: rows,
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (error) {
    console.error("[members/me/discord-activity] GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}
