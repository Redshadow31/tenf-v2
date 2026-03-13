import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { eventRepository, memberRepository } from "@/lib/repositories";
import { getMonthKey, loadRaidsFaits } from "@/lib/raidStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalize(value?: string | null): string {
  return (value || "").toLowerCase().trim().replace(/^@+/, "");
}

function isFormationCategory(category?: string | null): boolean {
  const key = normalize(category);
  return key.includes("formation");
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function profileCompletion(member: any): { completed: boolean; percent: number } {
  const checks = [
    !!member?.displayName,
    !!member?.discordUsername,
    !!member?.parrain,
    !!member?.description,
    !!member?.timezone,
  ];
  const passed = checks.filter(Boolean).length;
  const percent = Math.round((passed / checks.length) * 100);
  return { completed: percent >= 100, percent };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const member = await memberRepository.findByDiscordId(discordId);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const identity = new Set<string>(
      [member.twitchLogin, member.discordId, member.discordUsername, member.displayName, member.siteUsername]
        .filter(Boolean)
        .map((v) => normalize(v))
    );

    const now = new Date();
    const monthKey = getCurrentMonthKey();

    const raidsCurrentMonth = await loadRaidsFaits(monthKey);
    const raidsThisMonth = raidsCurrentMonth
      .filter((raid) => {
        const source = raid.source || (raid.manual ? "manual" : "twitch-live");
        if (source === "discord") return false;
        const raider = normalize(raid.raider);
        return identity.has(raider);
      })
      .reduce((total, raid) => total + (raid.count || 1), 0);

    let raidsTotal = raidsThisMonth;
    try {
      // Best effort sur les 12 derniers mois (sans dépendre d'un index blobs)
      const last12 = Array.from({ length: 12 }, (_, idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
        return getMonthKey(d.getFullYear(), d.getMonth() + 1);
      });
      const totals = await Promise.all(last12.map((key) => loadRaidsFaits(key)));
      raidsTotal = totals.flat().reduce((sum, raid) => {
        const source = raid.source || (raid.manual ? "manual" : "twitch-live");
        if (source === "discord") return sum;
        return identity.has(normalize(raid.raider)) ? sum + (raid.count || 1) : sum;
      }, 0);
    } catch {
      // fallback raidsThisMonth
    }

    const allEvents = await eventRepository.findAll(500, 0);
    const upcomingEvents = allEvents
      .filter((event) => {
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        return eventDate.getTime() > now.getTime() && event.isPublished;
      })
      .sort((a, b) => (a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()) - (b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()))
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        title: event.title,
        category: event.category,
        date: (event.date instanceof Date ? event.date : new Date(event.date)).toISOString(),
      }));

    let eventPresencesThisMonth = 0;
    let formationsValidated = 0;
    const formationHistory: Array<{ id: string; title: string; date: string }> = [];
    const eventPresenceHistory: Array<{ id: string; title: string; date: string; category: string }> = [];

    for (const event of allEvents) {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      if (Number.isNaN(eventDate.getTime())) continue;
      if (!event.isPublished) continue;
      const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
      const presences = await eventRepository.getPresences(event.id);
      const isPresent = presences.some((presence) => {
        if (!presence?.present) return false;
        return identity.has(normalize(presence.twitchLogin));
      });
      if (!isPresent) continue;

      eventPresenceHistory.push({
        id: event.id,
        title: event.title,
        category: event.category || "Evenement",
        date: eventDate.toISOString(),
      });

      if (key === monthKey) {
        eventPresencesThisMonth += 1;
      }

      if (isFormationCategory(event.category)) {
        formationsValidated += 1;
        formationHistory.push({ id: event.id, title: event.title, date: eventDate.toISOString() });
      }
    }

    const completion = profileCompletion(member);
    const participationThisMonth = raidsThisMonth + eventPresencesThisMonth;

    return NextResponse.json({
      member: {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        integrationDate: member.integrationDate ? member.integrationDate.toISOString() : null,
        parrain: member.parrain || null,
      },
      monthKey,
      stats: {
        raidsThisMonth,
        raidsTotal,
        eventPresencesThisMonth,
        participationThisMonth,
        formationsValidated,
      },
      profile: {
        completed: completion.completed,
        percent: completion.percent,
      },
      upcomingEvents,
      formationHistory,
      eventPresenceHistory,
    });
  } catch (error) {
    console.error("[members/me/overview] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
