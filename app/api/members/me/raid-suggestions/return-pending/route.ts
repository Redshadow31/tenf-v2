import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { loadRaidsFaits, loadRaidsRecus } from "@/lib/raidStorage";
import { mergeMatchedRaidTestEventsForMonth } from "@/lib/raidEventsubMerge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_MONTHS_SCAN = 48;
const BATCH_MONTHS = 4;
const MAX_SUGGESTIONS = 24;

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

function normalize(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function enumeratePastMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return keys;
}

async function fetchAllMembersForRaidResolution() {
  const allMembers: Array<{
    discordId?: string | null;
    twitchLogin: string;
    displayName?: string | null;
    siteUsername?: string | null;
  }> = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const chunk = await memberRepository.findAll(PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    allMembers.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return allMembers;
}

function buildLookups(
  members: Array<{
    discordId?: string | null;
    twitchLogin: string;
    displayName?: string | null;
    siteUsername?: string | null;
  }>
) {
  const discordIdTo = new Map<string, { login: string; label: string }>();
  const twitchTo = new Map<string, { login: string; label: string }>();
  for (const m of members) {
    const login = normalize(m.twitchLogin || "");
    if (!login) continue;
    const label = String(m.displayName || m.siteUsername || m.twitchLogin || login);
    const info = { login, label };
    twitchTo.set(login, info);
    if (m.discordId) discordIdTo.set(String(m.discordId).trim(), info);
  }
  return { discordIdTo, twitchTo };
}

function resolveParty(
  raw: string,
  lookups: ReturnType<typeof buildLookups>
): { login: string; label: string } {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { login: "", label: "" };
  const byDiscord = lookups.discordIdTo.get(trimmed);
  if (byDiscord) return byDiscord;
  const low = normalize(trimmed);
  const byTwitch = lookups.twitchTo.get(low);
  if (byTwitch) return byTwitch;
  return { login: low, label: trimmed };
}

async function loadMergedMonth(monthKey: string) {
  let raidsFaits = await loadRaidsFaits(monthKey);
  let raidsRecus = await loadRaidsRecus(monthKey);
  raidsFaits = raidsFaits.filter((r) => r.source !== "discord");
  raidsRecus = raidsRecus.filter((r) => r.source !== "discord");
  const merged = await mergeMatchedRaidTestEventsForMonth(monthKey, raidsFaits, raidsRecus);
  return { raidsFaits: merged.raidsFaits, raidsRecus: merged.raidsRecus };
}

async function mapInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const me = await memberRepository.findByDiscordId(discordId);
    const myLogin = normalize(me?.twitchLogin || "");
    if (!myLogin) {
      return NextResponse.json({ error: "Pseudo Twitch introuvable sur ton profil." }, { status: 400 });
    }

    const members = await fetchAllMembersForRaidResolution();
    const lookups = buildLookups(members);

    const monthKeys = enumeratePastMonthKeys(MAX_MONTHS_SCAN);
    const monthly = await mapInBatches(monthKeys, BATCH_MONTHS, async (monthKey) => ({
      monthKey,
      ...(await loadMergedMonth(monthKey)),
    }));

    const receivedFrom = new Map<string, { label: string; count: number; lastReceivedAt: string }>();
    const sentTo = new Set<string>();

    for (const { raidsFaits, raidsRecus } of monthly) {
      for (const raid of raidsRecus) {
        const target = resolveParty(raid.target, lookups);
        const raider = resolveParty(raid.raider, lookups);
        if (!target.login || target.login !== myLogin) continue;
        if (!raider.login || raider.login === myLogin) continue;

        const prev = receivedFrom.get(raider.login) || {
          label: raider.label,
          count: 0,
          lastReceivedAt: raid.date,
        };
        prev.count += 1;
        if (new Date(raid.date).getTime() > new Date(prev.lastReceivedAt).getTime()) {
          prev.lastReceivedAt = raid.date;
        }
        prev.label = raider.label || prev.label;
        receivedFrom.set(raider.login, prev);
      }

      for (const raid of raidsFaits) {
        const raider = resolveParty(raid.raider, lookups);
        const target = resolveParty(raid.target, lookups);
        if (raider.login !== myLogin || !target.login) continue;
        sentTo.add(target.login);
      }
    }

    const pendingEntries = [...receivedFrom.entries()].filter(([login]) => !sentTo.has(login));
    const suggestions = pendingEntries
      .map(([login, data]) => ({
        login,
        label: data.label,
        receivedCount: data.count,
        lastReceivedAt: data.lastReceivedAt,
      }))
      .sort((a, b) => {
        if (b.receivedCount !== a.receivedCount) return b.receivedCount - a.receivedCount;
        return new Date(b.lastReceivedAt).getTime() - new Date(a.lastReceivedAt).getTime();
      })
      .slice(0, MAX_SUGGESTIONS);

    return NextResponse.json({
      suggestions,
      meta: {
        monthsScanned: monthKeys.length,
        uniqueRaidersReceived: receivedFrom.size,
        pendingReturnTotal: pendingEntries.length,
        truncated: pendingEntries.length > suggestions.length,
        explanation:
          "Basé sur les données hub raids (hors source Discord), fusion EventSub incluse — même périmètre que les stats globales. Personnes qui t’ont raidé au moins une fois sans aucun raid retour enregistré de ta part sur la période analysée.",
      },
    });
  } catch (error) {
    console.error("[members/me/raid-suggestions/return-pending] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
