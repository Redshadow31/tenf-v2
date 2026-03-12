import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import { getTwitchUsers, type TwitchUser } from "@/lib/twitch";

const SUPABASE_PAGE_SIZE = 1000;
const SUPABASE_MAX_PAGES = 20;

type AvatarQuality = "good" | "fallback" | "missing";

function normalizeLogin(value?: string | null): string | undefined {
  if (!value) return undefined;
  const v = String(value).trim().toLowerCase();
  return v.length > 0 ? v : undefined;
}

function getSavedAvatarFromMember(member: any): string | undefined {
  const fromStatus = member?.twitchStatus?.profileImageUrl;
  if (typeof fromStatus !== "string") return undefined;
  const normalized = fromStatus.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function getDiscordDefaultAvatar(discordId?: string): string | undefined {
  if (!discordId) return undefined;
  const numericId = Number.parseInt(discordId, 10);
  if (Number.isNaN(numericId)) return undefined;
  return `https://cdn.discordapp.com/embed/avatars/${numericId % 5}.png`;
}

function classifyAvatar(url?: string): AvatarQuality {
  if (!url) return "missing";
  const normalized = url.toLowerCase();
  if (
    normalized.includes("placehold.co") ||
    normalized.includes("text=twitch") ||
    normalized.includes("unavatar.io") ||
    normalized.includes("user-default-pictures-uv")
  ) {
    return "fallback";
  }
  return "good";
}

async function fetchAllSupabaseMembers(): Promise<any[]> {
  const allMembers: any[] = [];
  for (let page = 0; page < SUPABASE_MAX_PAGES; page++) {
    const offset = page * SUPABASE_PAGE_SIZE;
    const chunk = await memberRepository.findAll(SUPABASE_PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    allMembers.push(...chunk);
    if (chunk.length < SUPABASE_PAGE_SIZE) break;
  }
  return allMembers;
}

export async function GET() {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const members = await fetchAllSupabaseMembers();
    const twitchLogins = Array.from(
      new Set(
        members
          .map((m) => normalizeLogin(m.twitchLogin))
          .filter((v): v is string => typeof v === "string")
      )
    );

    let twitchUsers: TwitchUser[] = [];
    try {
      twitchUsers = await getTwitchUsers(twitchLogins);
    } catch {
      twitchUsers = [];
    }

    const fetchedMap = new Map(
      twitchUsers.map((u) => [u.login.toLowerCase(), u.profile_image_url] as const)
    );

    const rows = members.map((member) => {
      const login = normalizeLogin(member.twitchLogin) || "";
      const savedAvatar = getSavedAvatarFromMember(member);
      const fetchedAvatar = login ? fetchedMap.get(login) : undefined;
      const savedQuality = classifyAvatar(savedAvatar);
      const fetchedQuality = classifyAvatar(fetchedAvatar);
      const hasIssue = fetchedQuality !== "good";

      return {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        role: member.role,
        isActive: member.isActive,
        discordId: member.discordId,
        savedAvatar,
        savedAvatarQuality: savedQuality,
        fetchedAvatar,
        fetchedAvatarQuality: fetchedQuality,
        hasIssue,
        previewAvatar:
          savedAvatar ||
          fetchedAvatar ||
          getDiscordDefaultAvatar(member.discordId) ||
          `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin || "?")
            .charAt(0)
            .toUpperCase()}`,
      };
    });

    const issueCount = rows.filter((r) => r.hasIssue).length;
    return NextResponse.json({
      members: rows,
      total: rows.length,
      issueCount,
    });
  } catch (error) {
    console.error("[Admin Members Images] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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
    const loginsRaw = Array.isArray(body?.twitchLogins) ? body.twitchLogins : [];
    const requestedLogins = Array.from(
      new Set(loginsRaw.map((v: string) => normalizeLogin(v)).filter(Boolean))
    ) as string[];

    if (requestedLogins.length === 0) {
      return NextResponse.json(
        { error: "Aucun membre sélectionné." },
        { status: 400 }
      );
    }

    const members = await fetchAllSupabaseMembers();
    const membersByLogin = new Map<string, any>();
    members.forEach((m) => {
      const login = normalizeLogin(m.twitchLogin);
      if (login) membersByLogin.set(login, m);
    });

    const targets = requestedLogins.filter((login) => membersByLogin.has(login));
    if (targets.length === 0) {
      return NextResponse.json(
        { error: "Aucun membre correspondant trouvé." },
        { status: 404 }
      );
    }

    const twitchUsers = await getTwitchUsers(targets);
    const fetchedMap = new Map(
      twitchUsers.map((u) => [u.login.toLowerCase(), u.profile_image_url] as const)
    );

    let updated = 0;
    let failed = 0;
    let missing = 0;
    const details: Array<{ twitchLogin: string; status: "updated" | "failed" | "missing"; reason?: string }> = [];

    for (const login of targets) {
      const member = membersByLogin.get(login);
      if (!member) {
        missing++;
        details.push({ twitchLogin: login, status: "missing", reason: "Membre introuvable" });
        continue;
      }

      const fetchedAvatar = fetchedMap.get(login);
      if (classifyAvatar(fetchedAvatar) !== "good") {
        failed++;
        details.push({ twitchLogin: login, status: "failed", reason: "Photo Twitch absente/non conforme" });
        continue;
      }

      const existingStatus = (member.twitchStatus || {}) as Record<string, unknown>;
      await memberRepository.update(member.twitchLogin, {
        twitchStatus: {
          ...existingStatus,
          profileImageUrl: fetchedAvatar,
          profileImageSource: "twitch_api",
          profileImageUpdatedAt: new Date().toISOString(),
          profileImageError: undefined,
        } as any,
        updatedBy: admin.discordId,
      });

      updated++;
      details.push({ twitchLogin: login, status: "updated" });
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
      missing,
      totalRequested: requestedLogins.length,
      totalProcessed: targets.length,
      details,
    });
  } catch (error) {
    console.error("[Admin Members Images] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

