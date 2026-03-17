import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";

type MemberDiscordRow = {
  twitchLogin: string;
  displayName?: string;
  discordId?: string;
  discordUsername?: string;
};

type VerifyResult = {
  twitchLogin: string;
  displayName: string;
  discordId: string;
  storedDiscordUsername: string | null;
  fetchedDiscordUsername: string | null;
  status: "same" | "updated" | "different" | "not_found" | "error";
  error?: string;
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;
const DEFAULT_POST_LIMIT = 20;
const MAX_POST_LIMIT = 30;
const DISCORD_MAX_RETRIES = 2;
const DISCORD_MIN_WAIT_MS = 150;
const DISCORD_MAX_WAIT_MS = 1200;
const REQUEST_TIME_BUDGET_MS = 12000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseRetryAfterMs(response: Response): Promise<number> {
  const headerValue = Number(response.headers.get("retry-after"));
  if (Number.isFinite(headerValue) && headerValue > 0) {
    return Math.round(headerValue * 1000);
  }

  const bodyText = await response.text().catch(() => "");
  try {
    const body = JSON.parse(bodyText) as { retry_after?: number };
    if (Number.isFinite(body.retry_after) && Number(body.retry_after) > 0) {
      return Math.round(Number(body.retry_after) * 1000);
    }
  } catch {
    // Ignorer les JSON invalides, on bascule sur une valeur par défaut.
  }

  return 400;
}

async function fetchAllMembersWithDiscordId(): Promise<MemberDiscordRow[]> {
  const all: MemberDiscordRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const chunk = await memberRepository.findAll(PAGE_SIZE, offset);
    if (!chunk.length) break;
    for (const member of chunk) {
      if (!member.discordId) continue;
      all.push({
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        discordId: member.discordId,
        discordUsername: member.discordUsername,
      });
    }
    if (chunk.length < PAGE_SIZE) break;
  }
  return all;
}

async function fetchDiscordUsernameById(discordId: string, botToken: string): Promise<{ ok: true; username: string } | { ok: false; reason: string }> {
  for (let attempt = 0; attempt <= DISCORD_MAX_RETRIES; attempt += 1) {
    const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: "no-store",
    });

    if (response.status === 429) {
      const retryAfterMs = await parseRetryAfterMs(response);
      if (attempt >= DISCORD_MAX_RETRIES) {
        return { ok: false, reason: `Discord API 429: rate limit persistant apres ${DISCORD_MAX_RETRIES + 1} tentatives.` };
      }
      const waitMs = Math.min(DISCORD_MAX_WAIT_MS, Math.max(DISCORD_MIN_WAIT_MS, retryAfterMs));
      await sleep(waitMs);
      continue;
    }

    if (response.status === 404) {
      return { ok: false, reason: "Utilisateur Discord introuvable (404)." };
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, reason: `Discord API ${response.status}${body ? `: ${body.slice(0, 120)}` : ""}` };
    }

    const data = (await response.json()) as { username?: string; global_name?: string | null };
    const username = String(data.global_name || data.username || "").trim();
    if (!username) {
      return { ok: false, reason: "Pseudo Discord vide." };
    }
    return { ok: true, username };
  }

  return { ok: false, reason: "Erreur inattendue Discord API." };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const members = await fetchAllMembersWithDiscordId();
    members.sort((a, b) => (a.displayName || a.twitchLogin).localeCompare(b.displayName || b.twitchLogin, "fr"));

    return NextResponse.json({
      success: true,
      total: members.length,
      members,
    });
  } catch (error) {
    console.error("[admin/members/discord-data] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const DISCORD_BOT_TOKEN = String(process.env.DISCORD_BOT_TOKEN || "").trim();
    if (!DISCORD_BOT_TOKEN) {
      return NextResponse.json({ error: "DISCORD_BOT_TOKEN manquant." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const twitchLoginsInput = Array.isArray(body?.twitchLogins) ? body.twitchLogins : [];
    const updateMismatches = body?.updateMismatches !== false;
    const runOnAll = Boolean(body?.all);
    const offsetRaw = Number(body?.offset);
    const limitRaw = Number(body?.limit);
    const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;
    const limitCandidate = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_POST_LIMIT;
    const limit = Math.min(MAX_POST_LIMIT, limitCandidate);

    const members = await fetchAllMembersWithDiscordId();
    const byLogin = new Map(members.map((m) => [m.twitchLogin.toLowerCase(), m]));
    const selected = runOnAll
      ? members
      : twitchLoginsInput
          .map((v: unknown) => byLogin.get(String(v || "").trim().toLowerCase()))
          .filter((v: MemberDiscordRow | undefined): v is MemberDiscordRow => Boolean(v));

    const uniqueSelected: MemberDiscordRow[] = [];
    const seen = new Set<string>();
    for (const member of selected) {
      const key = member.twitchLogin.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueSelected.push(member);
    }

    const selectedWindow = uniqueSelected.slice(offset, offset + limit);
    const startedAt = Date.now();
    let processedInWindow = 0;
    const results: VerifyResult[] = [];
    let updated = 0;
    let same = 0;
    let different = 0;
    let notFound = 0;
    let errors = 0;
    for (const member of selectedWindow) {
      if (Date.now() - startedAt >= REQUEST_TIME_BUDGET_MS) {
        break;
      }

      if (!member.discordId) continue;
      const stored = String(member.discordUsername || "").trim();

      const fetched = await fetchDiscordUsernameById(member.discordId, DISCORD_BOT_TOKEN);
      if (!fetched.ok) {
        const isNotFound = fetched.reason.includes("404");
        results.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          discordId: member.discordId,
          storedDiscordUsername: stored || null,
          fetchedDiscordUsername: null,
          status: isNotFound ? "not_found" : "error",
          error: fetched.reason,
        });
        if (isNotFound) notFound += 1;
        else errors += 1;
        processedInWindow += 1;
        continue;
      }

      const current = fetched.username.trim();
      if (stored.toLowerCase() === current.toLowerCase()) {
        results.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          discordId: member.discordId,
          storedDiscordUsername: stored || null,
          fetchedDiscordUsername: current,
          status: "same",
        });
        same += 1;
        processedInWindow += 1;
        continue;
      }

      different += 1;
      if (updateMismatches) {
        await memberRepository.update(member.twitchLogin, {
          discordUsername: current,
          updatedBy: admin.discordId,
        });
        updated += 1;
        results.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          discordId: member.discordId,
          storedDiscordUsername: stored || null,
          fetchedDiscordUsername: current,
          status: "updated",
        });
      } else {
        results.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          discordId: member.discordId,
          storedDiscordUsername: stored || null,
          fetchedDiscordUsername: current,
          status: "different",
        });
      }
      processedInWindow += 1;
    }

    const reachedWindowEnd = processedInWindow >= selectedWindow.length;
    const nextOffset = offset + processedInWindow;
    const hasMore = !reachedWindowEnd || nextOffset < uniqueSelected.length;

    return NextResponse.json({
      success: true,
      message: updateMismatches
        ? `Verification terminee: ${updated} pseudo(s) synchronise(s).`
        : "Verification terminee (mode lecture seule).",
      processed: processedInWindow,
      same,
      different,
      updated,
      notFound,
      errors,
      truncated: hasMore,
      totalSelected: uniqueSelected.length,
      offset,
      limit,
      nextOffset,
      hasMore,
      results,
    });
  } catch (error) {
    console.error("[admin/members/discord-data] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
