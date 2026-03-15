"use client";

import { useEffect, useMemo, useState } from "react";
import CommunityStatsSection from "@/components/lives/CommunityStatsSection";
import JoinTENFSection from "@/components/lives/JoinTENFSection";
import LiveCard from "@/components/lives/LiveCard";
import LivesFilters from "@/components/lives/LivesFilters";
import LivesHero from "@/components/lives/LivesHero";
import LivesPhilosophyBanner from "@/components/lives/LivesPhilosophyBanner";
import UpcomingEventsSection from "@/components/lives/UpcomingEventsSection";
import type { LiveMember, LiveStream, PublicEventItem } from "@/components/lives/types";

function normalizeText(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function safeToDateMs(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getLivePriority(live: LiveMember): number {
  if (live.isSpotlight) return 3;
  if (live.isBirthdayToday) return 2;
  if (live.isAffiliateAnniversaryToday) return 1;
  return 0;
}

type FollowState = "followed" | "not_followed" | "unknown";
type FollowStatusEntry = {
  state?: FollowState;
};

export default function LivesPage() {
  const [liveMembers, setLiveMembers] = useState<LiveMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventItem[]>([]);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomHint, setRandomHint] = useState<string | null>(null);
  const [spotlightLogin, setSpotlightLogin] = useState<string | null>(null);
  const [sessionShuffleSeed] = useState(() => `${Date.now()}-${Math.random()}`);
  const [followStatuses, setFollowStatuses] = useState<Record<string, FollowState>>({});
  const [showFollowStatuses, setShowFollowStatuses] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 12000
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    async function loadFollowStatuses() {
      try {
        const response = await fetch("/api/members/follow-status", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.authenticated !== true || data?.linked !== true) {
          setFollowStatuses({});
          setShowFollowStatuses(false);
          return;
        }

        const rawStatuses = (data?.statuses || {}) as Record<string, FollowStatusEntry>;
        const normalizedStatuses: Record<string, FollowState> = {};
        for (const [login, entry] of Object.entries(rawStatuses)) {
          normalizedStatuses[login.toLowerCase()] = entry?.state || "unknown";
        }

        setFollowStatuses(normalizedStatuses);
        setShowFollowStatuses(true);
      } catch (error) {
        console.error("[Lives Page] Erreur chargement follow status:", error);
        setFollowStatuses({});
        setShowFollowStatuses(false);
      }
    }

    loadFollowStatuses();
  }, []);

  useEffect(() => {
    async function fetchLivesAndContext() {
      try {
        setError(null);

        const membersResponse = await fetchWithTimeout("/api/members/public", { cache: "no-store" }, 12000);
        const membersBody = await membersResponse.json();
        const members = Array.isArray(membersBody.members) ? membersBody.members : [];
        const twitchLogins = members.map((member: any) => member.twitchLogin).filter(Boolean);

        const streamsResponse = await fetchWithTimeout(
          "/api/twitch/streams",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
            body: JSON.stringify({ logins: twitchLogins }),
            cache: "no-store",
          },
          15000
        );
        const streamsBody = streamsResponse.ok ? await streamsResponse.json() : { streams: [] };
        const streams: LiveStream[] = Array.isArray(streamsBody.streams) ? streamsBody.streams : [];

        const mappedLives = streams
          .filter((stream) => stream.type === "live")
          .map((stream) => {
            const member = members.find(
              (item: any) => String(item.twitchLogin || "").toLowerCase() === stream.userLogin.toLowerCase()
            );
            if (!member || member.shadowbanLives === true) return null;

            const avatar = member.avatar || `https://placehold.co/44x44?text=${stream.userLogin.charAt(0).toUpperCase()}`;
            return {
              twitchLogin: member.twitchLogin,
              twitchUrl: `https://www.twitch.tv/${stream.userLogin}`,
              displayName: stream.userName || member.displayName || member.twitchLogin,
              game: stream.gameName || "Categorie inconnue",
              title: stream.title || "",
              viewerCount: stream.viewerCount || 0,
              startedAt: stream.startedAt,
              thumbnailUrl:
                stream.thumbnailUrl
                  ?.replace("{width}", "640")
                  ?.replace("{height}", "360") || "https://placehold.co/640x360?text=Live+TENF",
              avatar,
              role: member.role || "Membre",
              isVip: member.isVip === true,
              isBirthdayToday: member.isBirthdayToday === true,
              isAffiliateAnniversaryToday: member.isAffiliateAnniversaryToday === true,
              followState: showFollowStatuses
                ? followStatuses[String(member.twitchLogin || "").toLowerCase()] || "unknown"
                : undefined,
              integrationDate:
                typeof member.integrationDate === "string" ? member.integrationDate : undefined,
            } as LiveMember;
          })
          .filter((item): item is LiveMember => item !== null);

        setLiveMembers(mappedLives);

        try {
          const [homeResponse, allMembersResponse, eventsResponse, spotlightResponse] = await Promise.all([
            fetchWithTimeout("/api/home", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/members/get-members", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/events", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/spotlight/live", { cache: "no-store" }, 10000),
          ]);

          const homeBody = homeResponse.ok
            ? await homeResponse.json()
            : { stats: { totalMembers: null } };
          const allMembersBody = allMembersResponse.ok ? await allMembersResponse.json() : { members: [], total: 0 };
          const allMembersList = Array.isArray(allMembersBody.members) ? allMembersBody.members : [];
          const membersTotal =
            Number.isFinite(homeBody?.stats?.totalMembers) && homeBody?.stats?.totalMembers >= 0
              ? homeBody.stats.totalMembers
              : Number.isFinite(allMembersBody.total)
                ? allMembersBody.total
                : allMembersList.length;
          const activeCount =
            Number.isFinite(homeBody?.stats?.activeMembers) && homeBody?.stats?.activeMembers >= 0
              ? homeBody.stats.activeMembers
              : null;
          setTotalMembers(membersTotal);
          setActiveMembers(activeCount);

          const eventsBody = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
          const events = Array.isArray(eventsBody.events) ? eventsBody.events : [];
          const now = Date.now();
          const nextEvents = events
            .filter((event: any) => safeToDateMs(event.date) > now)
            .sort((a: any, b: any) => safeToDateMs(a.date) - safeToDateMs(b.date))
            .slice(0, 3)
            .map((event: any) => ({
              id: String(event.id),
              title: event.title || "Evenement TENF",
              date: event.date,
              category: event.category || "Communaute",
            }));
          setUpcomingEvents(nextEvents);

          const spotlightBody = spotlightResponse.ok ? await spotlightResponse.json() : { spotlight: null };
          const liveSpotlightLogin =
            typeof spotlightBody?.spotlight?.streamerTwitchLogin === "string"
              ? spotlightBody.spotlight.streamerTwitchLogin.toLowerCase()
              : null;
          setSpotlightLogin(liveSpotlightLogin);
        } catch (contextError) {
          console.warn("[Lives Page] Contexte indisponible:", contextError);
        }
      } catch (err) {
        console.error("[Lives Page] Error fetching data:", err);
        setLiveMembers([]);
        setError("Impossible de charger les lives pour le moment.");
      } finally {
        setLoading(false);
      }
    }

    fetchLivesAndContext();
    const interval = setInterval(fetchLivesAndContext, 60000);
    return () => clearInterval(interval);
  }, []);

  const availableGames = useMemo(
    () => Array.from(new Set(liveMembers.map((live) => live.game).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [liveMembers]
  );
  const availableRoles = useMemo(
    () => Array.from(new Set(liveMembers.map((live) => live.role).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [liveMembers]
  );

  const filteredLives = useMemo(() => {
    let result = [...liveMembers];
    const normalizedSearch = normalizeText(search);

    if (normalizedSearch) {
      result = result.filter((live) => {
        const name = normalizeText(live.displayName);
        const login = normalizeText(live.twitchLogin);
        return name.includes(normalizedSearch) || login.includes(normalizedSearch);
      });
    }

    if (selectedGame !== "all") {
      result = result.filter((live) => live.game === selectedGame);
    }
    if (selectedRole !== "all") {
      result = result.filter((live) => live.role === selectedRole);
    }

    const withPriority = result.map((live) => {
      const normalizedLogin = live.twitchLogin.toLowerCase();
      return {
        ...live,
        isSpotlight: !!spotlightLogin && normalizedLogin === spotlightLogin,
        followState: showFollowStatuses
          ? followStatuses[normalizedLogin] || "unknown"
          : undefined,
      };
    });

    withPriority.sort((a, b) => {
      const priorityDiff = getLivePriority(b) - getLivePriority(a);
      if (priorityDiff !== 0) return priorityDiff;

      const aHash = stableHash(`${sessionShuffleSeed}:${a.twitchLogin.toLowerCase()}:${safeToDateMs(a.startedAt)}`);
      const bHash = stableHash(`${sessionShuffleSeed}:${b.twitchLogin.toLowerCase()}:${safeToDateMs(b.startedAt)}`);
      return aHash - bHash;
    });

    return withPriority;
  }, [
    liveMembers,
    search,
    selectedGame,
    selectedRole,
    spotlightLogin,
    sessionShuffleSeed,
    followStatuses,
    showFollowStatuses,
  ]);

  const handlePickRandomLive = () => {
    if (filteredLives.length === 0) {
      setRandomHint("Aucun live disponible avec les filtres actuels.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredLives.length);
    const selected = filteredLives[randomIndex];
    setRandomHint(`Selection aleatoire: ${selected.displayName}`);
    window.open(selected.twitchUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (filteredLives.length === 0) {
      setRandomHint("Aucun live ne correspond aux filtres actuels.");
    } else {
      setRandomHint(null);
    }
  }, [filteredLives.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Lives en direct
        </h1>
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des lives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <LivesHero
        displayedLivesCount={filteredLives.length}
        onPickRandomLive={handlePickRandomLive}
        randomDisabled={filteredLives.length === 0}
        eventsHref="/events2"
      />

      <LivesPhilosophyBanner />

      <LivesFilters
        search={search}
        onSearchChange={setSearch}
        selectedGame={selectedGame}
        onGameChange={setSelectedGame}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        games={availableGames}
        roles={availableRoles}
      />

      {error ? (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            borderColor: "rgba(239,68,68,0.4)",
            color: "#fca5a5",
            backgroundColor: "rgba(239,68,68,0.08)",
          }}
        >
          {error}
        </div>
      ) : null}

      {randomHint ? (
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {randomHint}
        </p>
      ) : null}

      <CommunityStatsSection
        liveCount={liveMembers.length}
        totalMembers={totalMembers}
        activeMembers={activeMembers}
      />

      {filteredLives.length > 0 ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLives.map((live) => (
            <LiveCard key={`${live.twitchLogin}-${live.startedAt}`} live={live} />
          ))}
        </section>
      ) : (
        <section
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-base font-medium" style={{ color: "var(--color-text)" }}>
            Aucun live ne correspond aux filtres actuels.
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Ajuste la recherche ou les filtres de jeu/role.
          </p>
        </section>
      )}

      <UpcomingEventsSection events={upcomingEvents} allEventsHref="/events2" />

      <JoinTENFSection href="/rejoindre" />

      <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
        <div
          className="rounded-2xl border p-2 shadow-2xl backdrop-blur-sm"
          style={{
            borderColor: "rgba(145, 70, 255, 0.45)",
            backgroundColor: "rgba(18, 18, 24, 0.92)",
          }}
        >
          <button
            type="button"
            onClick={handlePickRandomLive}
            disabled={filteredLives.length === 0}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            🎲 Decouvrir un live au hasard
          </button>
        </div>
      </div>
    </div>
  );
}
