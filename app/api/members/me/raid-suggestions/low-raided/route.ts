import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { getCurrentMonthKey, loadRaidsRecus } from "@/lib/raidStorage";

function normalize(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function isActiveGestionMember(member: { isActive?: boolean; role?: string }): boolean {
  // Aligne le bloc "membres peu raides" sur la logique metier de la page admin/membres/gestion:
  // actif = statut Actif et hors segment "Nouveau".
  return member.isActive === true && String(member.role || "") !== "Nouveau";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const me = await memberRepository.findByDiscordId(discordId);
    const myLogin = normalize(me?.twitchLogin || "");

    const members = await memberRepository.findAll(2000, 0);
    const monthKey = getCurrentMonthKey();
    const raidsRecus = await loadRaidsRecus(monthKey);

    const discordIdToLogin = new Map<string, string>();
    for (const member of members) {
      if (member.discordId) discordIdToLogin.set(String(member.discordId), normalize(member.twitchLogin));
    }

    const receivedCountByLogin = new Map<string, number>();
    for (const raid of raidsRecus || []) {
      const targetRaw = normalize(String(raid.target || ""));
      if (!targetRaw) continue;
      const targetLogin = discordIdToLogin.get(targetRaw) || targetRaw;
      receivedCountByLogin.set(targetLogin, (receivedCountByLogin.get(targetLogin) || 0) + 1);
    }

    const candidates = members
      .filter((member) => isActiveGestionMember(member))
      .map((member) => {
        const login = normalize(member.twitchLogin);
        return {
          login,
          label: member.displayName || member.twitchLogin,
          receivedCount: receivedCountByLogin.get(login) || 0,
        };
      })
      .filter((item) => item.login && item.login !== myLogin)
      .sort((a, b) => {
        if (a.receivedCount !== b.receivedCount) return a.receivedCount - b.receivedCount;
        return a.label.localeCompare(b.label, "fr");
      })
      .slice(0, 8);

    return NextResponse.json({
      month: monthKey,
      suggestions: candidates,
    });
  } catch (error) {
    console.error("[members/me/raid-suggestions/low-raided] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

