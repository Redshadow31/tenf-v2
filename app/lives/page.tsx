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

function normalizeLoginKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
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

type RaidMetrics = {
  raidsDone: number;
  raidsReceived: number;
  uniqueTargets: number;
  uniqueRaidersReceived: number;
  raidedNewMember: boolean;
};

type UpaLiteContent = {
  general?: {
    startDate?: string;
    endDate?: string;
  };
  streamers?: Array<{
    twitchLogin?: string;
    displayName?: string;
    avatarUrl?: string;
    order?: number;
    isActive?: boolean;
  }>;
};

const NEW_MEMBER_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export default function LivesPage() {
  const [liveMembers, setLiveMembers] = useState<LiveMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventItem[]>([]);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomHint, setRandomHint] = useState<string | null>(null);
  const [spotlightLogin, setSpotlightLogin] = useState<string | null>(null);
  const [spotlightDisplayName, setSpotlightDisplayName] = useState<string | null>(null);
  const [spotlightEncouragement, setSpotlightEncouragement] = useState<string | null>(null);
  const [topRaiderLogin, setTopRaiderLogin] = useState<string | null>(null);
  const [topRaiderCount, setTopRaiderCount] = useState<number>(0);
  const [raidMetricsByLogin, setRaidMetricsByLogin] = useState<Record<string, RaidMetrics>>({});
  const [sessionShuffleSeed] = useState(() => `${Date.now()}-${Math.random()}`);
  const [followStatuses, setFollowStatuses] = useState<Record<string, FollowState>>({});
  const [showFollowStatuses, setShowFollowStatuses] = useState(false);
  const [upaContent, setUpaContent] = useState<UpaLiteContent | null>(null);

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
          const [homeResponse, allMembersResponse, eventsResponse, spotlightResponse, raidsResponse] =
            await Promise.all([
            fetchWithTimeout("/api/home", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/members/get-members", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/events", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/spotlight/live", { cache: "no-store" }, 10000),
            fetchWithTimeout("/api/discord/raids/data-v2", { cache: "no-store" }, 10000),
            ]);

          const homeBody = homeResponse.ok
            ? await homeResponse.json()
            : { stats: { totalMembers: null } };
          const allMembersBody = allMembersResponse.ok ? await allMembersResponse.json() : { members: [], total: 0 };
          const allMembersList = Array.isArray(allMembersBody.members) ? allMembersBody.members : [];
          const integrationDateByLogin = new Map<string, string>();
          allMembersList.forEach((member: any) => {
            const login = String(member?.twitchLogin || "").toLowerCase();
            if (!login) return;
            if (typeof member?.integrationDate === "string" && member.integrationDate) {
              integrationDateByLogin.set(login, member.integrationDate);
            }
          });
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
              ? normalizeLoginKey(spotlightBody.spotlight.streamerTwitchLogin)
              : null;
          setSpotlightLogin(liveSpotlightLogin);
          setSpotlightDisplayName(
            typeof spotlightBody?.spotlight?.streamerDisplayName === "string"
              ? spotlightBody.spotlight.streamerDisplayName
              : null
          );
          setSpotlightEncouragement(
            typeof spotlightBody?.spotlight?.text === "string" ? spotlightBody.spotlight.text : null
          );

          const raidsBody = raidsResponse.ok ? await raidsResponse.json() : { stats: { topRaider: null } };
          const liveTopRaiderLogin =
            typeof raidsBody?.stats?.topRaider?.twitchLogin === "string"
              ? raidsBody.stats.topRaider.twitchLogin.toLowerCase()
              : null;
          const liveTopRaiderCount =
            Number.isFinite(raidsBody?.stats?.topRaider?.count) && raidsBody.stats.topRaider.count > 0
              ? raidsBody.stats.topRaider.count
              : 0;
          setTopRaiderLogin(liveTopRaiderLogin);
          setTopRaiderCount(liveTopRaiderCount);

          const raidsFaits = Array.isArray(raidsBody?.raidsFaits) ? raidsBody.raidsFaits : [];
          const raidsRecus = Array.isArray(raidsBody?.raidsRecus) ? raidsBody.raidsRecus : [];
          const metricsMap = new Map<
            string,
            {
              raidsDone: number;
              raidsReceived: number;
              uniqueTargets: Set<string>;
              uniqueRaidersReceived: Set<string>;
              raidedNewMember: boolean;
            }
          >();

          const getOrCreateMetrics = (login: string) => {
            const normalized = login.toLowerCase();
            const existing = metricsMap.get(normalized);
            if (existing) return existing;
            const created = {
              raidsDone: 0,
              raidsReceived: 0,
              uniqueTargets: new Set<string>(),
              uniqueRaidersReceived: new Set<string>(),
              raidedNewMember: false,
            };
            metricsMap.set(normalized, created);
            return created;
          };

          raidsFaits.forEach((raid: any) => {
            const raiderLogin = String(raid?.raiderTwitchLogin || raid?.raider || "").toLowerCase();
            const targetLogin = String(raid?.targetTwitchLogin || raid?.target || "").toLowerCase();
            if (!raiderLogin || !targetLogin) return;

            const metrics = getOrCreateMetrics(raiderLogin);
            const count = Number.isFinite(raid?.count) && raid.count > 0 ? raid.count : 1;
            metrics.raidsDone += count;
            metrics.uniqueTargets.add(targetLogin);

            if (!metrics.raidedNewMember) {
              const targetIntegrationDate = integrationDateByLogin.get(targetLogin);
              const targetIntegrationTs = targetIntegrationDate ? safeToDateMs(targetIntegrationDate) : 0;
              const raidTs = safeToDateMs(String(raid?.date || ""));
              if (
                targetIntegrationTs > 0 &&
                raidTs >= targetIntegrationTs &&
                raidTs - targetIntegrationTs <= NEW_MEMBER_WINDOW_MS
              ) {
                metrics.raidedNewMember = true;
              }
            }
          });

          raidsRecus.forEach((raid: any) => {
            const targetLogin = String(raid?.targetTwitchLogin || raid?.target || "").toLowerCase();
            const raiderLogin = String(raid?.raiderTwitchLogin || raid?.raider || "").toLowerCase();
            if (!targetLogin) return;

            const metrics = getOrCreateMetrics(targetLogin);
            metrics.raidsReceived += 1;
            if (raiderLogin) {
              metrics.uniqueRaidersReceived.add(raiderLogin);
            }
          });

          const serializedMetrics: Record<string, RaidMetrics> = {};
          metricsMap.forEach((value, login) => {
            serializedMetrics[login] = {
              raidsDone: value.raidsDone,
              raidsReceived: value.raidsReceived,
              uniqueTargets: value.uniqueTargets.size,
              uniqueRaidersReceived: value.uniqueRaidersReceived.size,
              raidedNewMember: value.raidedNewMember,
            };
          });
          setRaidMetricsByLogin(serializedMetrics);

          try {
            const upaResponse = await fetchWithTimeout("/api/upa-event/content?slug=upa-event", { cache: "no-store" }, 10000);
            if (upaResponse.ok) {
              const upaBody = await upaResponse.json();
              setUpaContent((upaBody?.content || null) as UpaLiteContent | null);
            } else {
              setUpaContent(null);
            }
          } catch {
            setUpaContent(null);
          }
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
      const normalizedLogin = normalizeLoginKey(live.twitchLogin);
      const isSpotlightMatch =
        (!!spotlightLogin && normalizedLogin === normalizeLoginKey(spotlightLogin)) ||
        (!!spotlightDisplayName &&
          normalizeText(live.displayName) === normalizeText(spotlightDisplayName));
      const metrics = raidMetricsByLogin[normalizedLogin];
      const raidsDone = metrics?.raidsDone || 0;
      const raidsReceived = metrics?.raidsReceived || 0;
      const uniqueTargets = metrics?.uniqueTargets || 0;
      const uniqueRaidersReceived = metrics?.uniqueRaidersReceived || 0;
      const hasRaidActivity = raidsDone + raidsReceived > 0;
      return {
        ...live,
        isSpotlight: isSpotlightMatch,
        isTopRaider: !!topRaiderLogin && normalizedLogin === topRaiderLogin,
        topRaidsCount:
          !!topRaiderLogin && normalizedLogin === topRaiderLogin && topRaiderCount > 0
            ? topRaiderCount
            : undefined,
        raidsDoneThisMonth: raidsDone,
        raidsReceivedThisMonth: raidsReceived,
        uniqueRaidTargetsThisMonth: uniqueTargets,
        uniqueRaidersReceivedThisMonth: uniqueRaidersReceived,
        isSolidarityRaider: uniqueTargets >= 5,
        isCommunityBooster: raidsDone > 15,
        isDiscoverer: metrics?.raidedNewMember === true,
        isWarmlySupported: uniqueRaidersReceived >= 10,
        isBalancedSupport: hasRaidActivity && Math.abs(raidsDone - raidsReceived) <= 3,
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
    spotlightDisplayName,
    topRaiderLogin,
    topRaiderCount,
    raidMetricsByLogin,
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

  const upaActiveRange = useMemo(() => {
    const startRaw = upaContent?.general?.startDate || "";
    const endRaw = upaContent?.general?.endDate || "";
    if (!startRaw || !endRaw) return null;

    const start = new Date(`${startRaw}T00:00:00`);
    const end = new Date(`${endRaw}T23:59:59`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return { start, end };
  }, [upaContent?.general?.startDate, upaContent?.general?.endDate]);

  const isUpaPeriodActive = useMemo(() => {
    if (!upaActiveRange) return false;
    const now = new Date();
    return now.getTime() >= upaActiveRange.start.getTime() && now.getTime() <= upaActiveRange.end.getTime();
  }, [upaActiveRange]);

  const upaLiveMembers = useMemo(() => {
    const withoutSpotlight = filteredLives.filter((live) => {
      const normalizedLogin = normalizeLoginKey(live.twitchLogin);
      const isSpotlightMatch =
        (!!spotlightLogin && normalizedLogin === normalizeLoginKey(spotlightLogin)) ||
        (!!spotlightDisplayName && normalizeText(live.displayName) === normalizeText(spotlightDisplayName));
      return !isSpotlightMatch;
    });

    if (!isUpaPeriodActive) return [];
    const upaLogins = new Set(
      (upaContent?.streamers || [])
        .filter((member) => member?.isActive !== false)
        .map((member) => normalizeLoginKey(String(member?.twitchLogin || "")))
        .filter(Boolean)
    );
    if (upaLogins.size === 0) return [];
    return withoutSpotlight.filter((live) => upaLogins.has(normalizeLoginKey(live.twitchLogin)));
  }, [filteredLives, isUpaPeriodActive, upaContent?.streamers, spotlightDisplayName, spotlightLogin]);

  const spotlightLiveMembers = useMemo(() => {
    if (!spotlightLogin && !spotlightDisplayName) return [];
    return filteredLives.filter((live) => {
      const normalizedLogin = normalizeLoginKey(live.twitchLogin);
      const isSpotlightMatch =
        (!!spotlightLogin && normalizedLogin === normalizeLoginKey(spotlightLogin)) ||
        (!!spotlightDisplayName && normalizeText(live.displayName) === normalizeText(spotlightDisplayName));
      return isSpotlightMatch;
    });
  }, [filteredLives, spotlightDisplayName, spotlightLogin]);

  const regularLiveMembers = useMemo(() => {
    const spotlightLogins = new Set(spotlightLiveMembers.map((live) => normalizeLoginKey(live.twitchLogin)));
    const withoutSpotlight = filteredLives.filter((live) => !spotlightLogins.has(normalizeLoginKey(live.twitchLogin)));
    if (!isUpaPeriodActive || upaLiveMembers.length === 0) return withoutSpotlight;
    const upaLiveLogins = new Set(upaLiveMembers.map((live) => normalizeLoginKey(live.twitchLogin)));
    return withoutSpotlight.filter((live) => !upaLiveLogins.has(normalizeLoginKey(live.twitchLogin)));
  }, [filteredLives, isUpaPeriodActive, spotlightLiveMembers, upaLiveMembers]);

  const upaDateRangeLabel = useMemo(() => {
    if (!upaActiveRange) return "";
    return `Du ${upaActiveRange.start.toLocaleDateString("fr-FR")} au ${upaActiveRange.end.toLocaleDateString("fr-FR")}`;
  }, [upaActiveRange]);

  const upaStatusLabel = useMemo(() => {
    if (!upaActiveRange) return "";
    const now = new Date();
    const diffMs = upaActiveRange.end.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return "Dernier jour de la semaine caritative";
    return `Encore ${diffDays} jour${diffDays > 1 ? "s" : ""} de mobilisation`;
  }, [upaActiveRange]);

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
        spotlightDisplayName={spotlightDisplayName}
        spotlightText={spotlightEncouragement}
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

      {spotlightLiveMembers.length > 0 ? (
        <section
          className="rounded-3xl border p-4 md:p-6 space-y-4"
          style={{
            borderColor: "rgba(145,70,255,0.45)",
            background:
              "radial-gradient(circle at 12% 15%, rgba(145,70,255,0.22), rgba(145,70,255,0) 40%), linear-gradient(160deg, rgba(24,22,35,0.98), rgba(13,12,20,0.99))",
            boxShadow: "0 22px 52px rgba(0,0,0,0.36)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em]"
                style={{
                  borderColor: "rgba(145,70,255,0.6)",
                  color: "#d8c4ff",
                  backgroundColor: "rgba(145,70,255,0.2)",
                }}
              >
                SPOTLIGHT ACTIF
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold" style={{ color: "#efe5ff" }}>
                Mise en avant Spotlight TENF
              </h2>
              <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.82)" }}>
                Bloc visible uniquement pendant la fenetre active du Spotlight programme.
              </p>
            </div>
            <p className="text-sm font-semibold" style={{ color: "#cdb1ff" }}>
              {spotlightLiveMembers.length} live spotlight en cours
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {spotlightLiveMembers.map((live) => (
              <LiveCard key={`spotlight-${live.twitchLogin}-${live.startedAt}`} live={live} />
            ))}
          </div>
        </section>
      ) : null}

      {isUpaPeriodActive && upaLiveMembers.length > 0 ? (
        <section
          className="rounded-3xl border p-4 md:p-6 space-y-5"
          style={{
            borderColor: "rgba(212,175,55,0.42)",
            background:
              "radial-gradient(circle at 10% 20%, rgba(212,175,55,0.2), rgba(212,175,55,0) 42%), radial-gradient(circle at 85% 12%, rgba(145,70,255,0.14), rgba(145,70,255,0) 40%), linear-gradient(160deg, rgba(24,24,34,0.97), rgba(12,12,18,0.99))",
            boxShadow: "0 22px 52px rgba(0,0,0,0.38)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em]"
                style={{
                  borderColor: "rgba(212,175,55,0.55)",
                  color: "#f5df9d",
                  backgroundColor: "rgba(212,175,55,0.13)",
                }}
              >
                SEMAINE CARITATIVE UPA
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold" style={{ color: "#f7edd0" }}>
                Lives caritatifs UPA en cours
              </h2>
              <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.8)" }}>
                Mise en avant automatique pendant la periode UPA pour amplifier la visibilite des lives solidaires.
              </p>
            </div>
            <div className="rounded-xl border px-3 py-2 text-right" style={{ borderColor: "rgba(212,175,55,0.35)", backgroundColor: "rgba(212,175,55,0.08)" }}>
              <p className="text-sm font-semibold" style={{ color: "#f5df9d" }}>
                {upaLiveMembers.length} live{upaLiveMembers.length > 1 ? "s" : ""} UPA actif{upaLiveMembers.length > 1 ? "s" : ""}
              </p>
              {upaStatusLabel ? (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
                  {upaStatusLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {upaDateRangeLabel ? (
              <span
                className="inline-flex items-center rounded-full border px-3 py-1"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.84)", backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                {upaDateRangeLabel}
              </span>
            ) : null}
            <span
              className="inline-flex items-center rounded-full border px-3 py-1"
              style={{ borderColor: "rgba(145,70,255,0.35)", color: "#d9c3ff", backgroundColor: "rgba(145,70,255,0.14)" }}
            >
              Priorite solidarite
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upaLiveMembers.map((live) => (
              <LiveCard key={`upa-${live.twitchLogin}-${live.startedAt}`} live={live} />
            ))}
          </div>
        </section>
      ) : null}

      {regularLiveMembers.length > 0 ? (
        <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {regularLiveMembers.map((live) => (
            <LiveCard key={`${live.twitchLogin}-${live.startedAt}`} live={live} />
          ))}
        </section>
      ) : upaLiveMembers.length === 0 && spotlightLiveMembers.length === 0 ? (
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
      ) : null}

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
