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
/** Affichage membre : petit tirage aléatoire parmi les personnes sans raid retour enregistré */
const MAX_SUGGESTIONS_DISPLAYED = 4;

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

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

    const me = await memberRepository.findByDiscordIdFresh(discordId);
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

    // Uniquement celles et ceux vers qui aucun raid « sortant » toi → eux n’apparaît pas dans nos données sur la période
    const pendingEntries = [...receivedFrom.entries()].filter(([login]) => !sentTo.has(login));
    const pendingMapped = pendingEntries.map(([login, data]) => ({
      login,
      label: data.label,
      receivedCount: data.count,
      lastReceivedAt: data.lastReceivedAt,
    }));
    const suggestions = shuffleArray(pendingMapped).slice(0, MAX_SUGGESTIONS_DISPLAYED);

    return NextResponse.json({
      suggestions,
      meta: {
        monthsScanned: monthKeys.length,
        uniqueRaidersReceived: receivedFrom.size,
        pendingReturnTotal: pendingEntries.length,
        displayedCount: suggestions.length,
        sampleRandomized: true,
        sampleMax: MAX_SUGGESTIONS_DISPLAYED,
        truncated: pendingEntries.length > suggestions.length,
        explanation:
          "Basé sur le hub raids TENF (hors source Discord), avec la fusion EventSub. Ne figurent ici que des personnes qui t’ont envoyé au moins un raid sans qu’un raid de toi vers elles soit enregistré sur la même période. Jusqu’à 4 noms tirés au hasard pour garder la liste légère — actualise pour en voir d’autres s’il y en a plus.",
      },
    });
  } catch (error) {
    console.error("[members/me/raid-suggestions/return-pending] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
