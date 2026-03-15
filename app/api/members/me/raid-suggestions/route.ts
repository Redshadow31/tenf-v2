import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { getCurrentMonthKey, loadRaidsFaits } from "@/lib/raidStorage";

type SuggestionRow = {
  login: string;
  label: string;
  segment: "Actif" | "Nouveau membre" | "Inactif" | "Historique raids" | "Communaute";
  role: "Moderateur" | "Staff" | "Membre";
};

function normalize(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function isModeratorRole(role?: string): boolean {
  const key = normalize(String(role || ""));
  return key.includes("moderateur");
}

function isStaffRole(role?: string): boolean {
  const key = normalize(String(role || ""));
  return key.includes("staff") || key.includes("fondateur") || key.includes("admin");
}

function toRoleBadge(role?: string): "Moderateur" | "Staff" | "Membre" {
  if (isModeratorRole(role)) return "Moderateur";
  if (isStaffRole(role)) return "Staff";
  return "Membre";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }
    const me = await memberRepository.findByDiscordId(discordId);
    const myLogin = normalize(me?.twitchLogin || "");

    const { searchParams } = new URL(request.url);
    const query = normalize(searchParams.get("query") || "");

    const members = await memberRepository.findAll(2000, 0);
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const monthKey = getCurrentMonthKey();
    const raidsFaits = await loadRaidsFaits(monthKey);

    const discordIdToLogin = new Map<string, string>();
    for (const member of members) {
      const login = normalize(member.twitchLogin);
      if (!login) continue;
      if (member.discordId) discordIdToLogin.set(String(member.discordId), login);
    }

    const historyTargets = new Set<string>();
    for (const raid of raidsFaits || []) {
      const raiderRaw = normalize(String(raid.raider || ""));
      const targetRaw = normalize(String(raid.target || ""));
      if (!raiderRaw || !targetRaw) continue;
      const raiderLogin = discordIdToLogin.get(raiderRaw) || raiderRaw;
      const targetLogin = discordIdToLogin.get(targetRaw) || targetRaw;
      if (myLogin && raiderLogin === myLogin) {
        historyTargets.add(targetLogin);
      }
    }

    const rows: SuggestionRow[] = [];
    for (const member of members) {
      const login = normalize(member.twitchLogin);
      if (!login) continue;
      if (query && !login.includes(query) && !normalize(member.displayName || "").includes(query)) continue;

      const createdAtMs = member.createdAt instanceof Date ? member.createdAt.getTime() : 0;
      const isNew = createdAtMs > 0 && now - createdAtMs <= thirtyDaysMs;
      const segment: SuggestionRow["segment"] = historyTargets.has(login)
        ? "Historique raids"
        : member.isActive
          ? "Actif"
          : isNew
            ? "Nouveau membre"
            : "Inactif";

      rows.push({
        login,
        label: member.displayName || member.twitchLogin,
        segment,
        role: toRoleBadge(member.role),
      });
    }

    rows.sort((a, b) => {
      const order = ["Historique raids", "Actif", "Nouveau membre", "Inactif", "Communaute"];
      const rankDiff = order.indexOf(a.segment) - order.indexOf(b.segment);
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label, "fr");
    });

    return NextResponse.json({
      query,
      suggestions: rows.slice(0, 30),
      // Toujours proposer une saisie libre en dernier choix.
      allowCustomTarget: true,
      customTargetLabel: "Autre streamer...",
    });
  } catch (error) {
    console.error("[members/me/raid-suggestions] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

