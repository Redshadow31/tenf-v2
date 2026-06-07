"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ComponentProps, type CSSProperties } from "react";
import { Dice5, ExternalLink, HeartHandshake, RefreshCcw, Sparkles } from "lucide-react";
import CharityProgressBar from "@/components/lives/CharityProgressBar";
import JoinTENFSection from "@/components/lives/JoinTENFSection";
import LiveCard from "@/components/lives/LiveCard";
import LivesDiscoveryPanel from "@/components/lives/LivesDiscoveryPanel";
import RandomRaidModal from "@/components/lives/RandomRaidModal";
import type { LivesQuickFilter, LivesSortMode } from "@/components/lives/livesDiscoveryTypes";
import LivesHero from "@/components/lives/LivesHero";
import LivesPhilosophyBanner from "@/components/lives/LivesPhilosophyBanner";
import theme from "@/components/lives/lives-theme.module.css";
import UpcomingEventsSection from "@/components/lives/UpcomingEventsSection";
import MemberModal from "@/components/MemberModal";
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

type CharityStatsPayload = {
  available: boolean;
  raised?: number;
  displayGoal?: number;
  currency?: string;
  campaignGoal?: number;
};

type UpaLiteContent = {
  general?: {
    startDate?: string;
    endDate?: string;
    charityCampaignUrl?: string;
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

const LIVE_MEMBER_MODAL_BANNER =
  "Tu es sur la page Lives TENF : ce créateur est détecté en direct ici. La fiche réunit bio, planning annoncé et réseaux — complément idéal avant d'ouvrir le chat Twitch.";

// Wrapper fluide : la page contrôle ses propres marges intérieures pour
// occuper l'espace libre et rester scalable au zoom navigateur.
const LIVES_PAGE_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--lives-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--lives-px)",
  paddingRight: "var(--lives-px)",
  paddingTop: "clamp(1rem, 1.5vw, 1.75rem)",
  paddingBottom: "clamp(6rem, 4vw, 3.5rem)",
};

const LIVES_CONTAINER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

function liveMemberToModalPayload(
  live: LiveMember,
  followState: FollowState | undefined
): ComponentProps<typeof MemberModal>["member"] {
  const avatar =
    live.avatar || `https://placehold.co/96x96?text=${encodeURIComponent(live.displayName.charAt(0))}`;
  const instagram = live.instagram;
  const twitter = live.twitter;
  const tiktok = live.tiktok;

  return {
    id: live.twitchLogin,
    name: live.displayName,
    role: live.role,
    avatar,
    twitchLogin: live.twitchLogin,
    description: live.description?.trim() || `Membre ${live.role} de la communauté TENF.`,
    twitchUrl: live.twitchUrl,
    discordId: live.discordId,
    isVip: live.isVip,
    vipBadge: live.vipBadge,
    badges: live.badges || [],
    socials: {
      discord: live.discordId ? `https://discord.com/users/${live.discordId}` : undefined,
      instagram: instagram
        ? instagram.startsWith("http")
          ? instagram
          : `https://instagram.com/${instagram.replace(/^@/, "")}`
        : undefined,
      twitter: twitter ? (twitter.startsWith("http") ? twitter : `https://twitter.com/${twitter.replace(/^@/, "")}`) : undefined,
      tiktok: tiktok ? (tiktok.startsWith("http") ? tiktok : `https://tiktok.com/@${tiktok.replace(/^@/, "")}`) : undefined,
    },
    followStatus: followState,
    mainGame: live.game || "Communauté",
    isAffiliated: live.role === "Affilié",
    isLive: true,
    isActiveThisWeek: true,
    planningStatus: "none",
    streamTags: live.game ? [live.game] : [],
  };
}

export default function LivesPageClient() {
  const [liveMembers, setLiveMembers] = useState<LiveMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventItem[]>([]);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomHint, setRandomHint] = useState<string | null>(null);
  const [randomRaidLive, setRandomRaidLive] = useState<LiveMember | null>(null);
  const [randomRaidOpen, setRandomRaidOpen] = useState(false);
  const [spotlightLogin, setSpotlightLogin] = useState<string | null>(null);
  const [spotlightDisplayName, setSpotlightDisplayName] = useState<string | null>(null);
  const [spotlightEncouragement, setSpotlightEncouragement] = useState<string | null>(null);
  const [topRaiderLogin, setTopRaiderLogin] = useState<string | null>(null);
  const [topRaiderCount, setTopRaiderCount] = useState<number>(0);
  const [raidMetricsByLogin, setRaidMetricsByLogin] = useState<Record<string, RaidMetrics>>({});
  const [tenfExplorerByLogin, setTenfExplorerByLogin] = useState<Record<string, boolean>>({});
  const [sessionShuffleSeed] = useState(() => `${Date.now()}-${Math.random()}`);
  const [followStatuses, setFollowStatuses] = useState<Record<string, FollowState>>({});
  const [showFollowStatuses, setShowFollowStatuses] = useState(false);
  const [upaContent, setUpaContent] = useState<UpaLiteContent | null>(null);
  const [streamlabsGoalWidgetSrc, setStreamlabsGoalWidgetSrc] = useState("");
  const [charityStats, setCharityStats] = useState<CharityStatsPayload | null>(null);

  const [liveMemberModalOpen, setLiveMemberModalOpen] = useState(false);
  const [liveMemberModalMember, setLiveMemberModalMember] = useState<ComponentProps<typeof MemberModal>["member"] | null>(
    null
  );

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [quickFilter, setQuickFilter] = useState<LivesQuickFilter>("all");
  const [sortMode, setSortMode] = useState<LivesSortMode>("tenf");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    let cancelled = false;
    async function loadStreamlabsWidgetSrc() {
      try {
        const response = await fetch("/api/lives/streamlabs-charity-widget", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { widgetSrc?: string };
        if (cancelled || typeof data?.widgetSrc !== "string") return;
        setStreamlabsGoalWidgetSrc(data.widgetSrc);
      } catch {
        /* widget optionnel */
      }
    }
    loadStreamlabsWidgetSrc();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCharityStats() {
      try {
        const response = await fetch("/api/lives/streamlabs-charity-stats", { cache: "no-store" });
        const data = (await response.json()) as CharityStatsPayload;
        if (cancelled) return;
        if (
          data?.available === true &&
          typeof data.raised === "number" &&
          typeof data.displayGoal === "number" &&
          typeof data.currency === "string"
        ) {
          setCharityStats(data);
        } else {
          setCharityStats({ available: false });
        }
      } catch {
        if (!cancelled) setCharityStats({ available: false });
      }
    }
    loadCharityStats();
    const intervalId = setInterval(loadCharityStats, 120_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

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
              description: typeof member.description === "string" ? member.description : undefined,
              discordId: member.discordId,
              instagram: member.instagram,
              tiktok: member.tiktok,
              twitter: member.twitter,
              badges: Array.isArray(member.badges) ? member.badges : undefined,
              vipBadge: typeof member.vipBadge === "string" ? member.vipBadge : undefined,
            } as LiveMember;
          })
          .filter((item): item is LiveMember => item !== null);

        setLiveMembers(mappedLives);

        if (mappedLives.length > 0) {
          try {
            const coverageResponse = await fetchWithTimeout(
              "/api/lives/follow-coverage",
              {
                method: "POST",
                headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
                body: JSON.stringify({ logins: mappedLives.map((live) => live.twitchLogin) }),
                cache: "no-store",
              },
              10000
            );
            if (coverageResponse.ok && !cancelled) {
              const coverageBody = await coverageResponse.json();
              const rawCoverage =
                coverageBody?.coverage && typeof coverageBody.coverage === "object"
                  ? coverageBody.coverage
                  : {};
              const explorerMap: Record<string, boolean> = {};
              Object.entries(rawCoverage).forEach(([login, entry]) => {
                const normalizedLogin = normalizeLoginKey(login);
                if (!normalizedLogin) return;
                explorerMap[normalizedLogin] =
                  typeof entry === "object" &&
                  entry !== null &&
                  (entry as { isTenfExplorer?: boolean }).isTenfExplorer === true;
              });
              setTenfExplorerByLogin(explorerMap);
            }
          } catch (coverageError) {
            console.warn("[Lives Page] Couverture follows indisponible:", coverageError);
            if (!cancelled) setTenfExplorerByLogin({});
          }
        } else if (!cancelled) {
          setTenfExplorerByLogin({});
        }

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
        if (!cancelled) {
          setLoading(false);
          setIsRefreshing(false);
          setLastSyncedAt(new Date());
        }
      }
    }

    fetchLivesAndContext();
    const interval = setInterval(() => setRefreshKey((key) => key + 1), 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshKey]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((key) => key + 1);
  };

  const scrollToLivesGrid = () => {
    document.getElementById("lives-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const availableGames = useMemo(
    () => Array.from(new Set(liveMembers.map((live) => live.game).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [liveMembers]
  );
  const availableRoles = useMemo(
    () => Array.from(new Set(liveMembers.map((live) => live.role).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [liveMembers]
  );

  const gameCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveMembers.forEach((live) => {
      if (!live.game) return;
      counts[live.game] = (counts[live.game] || 0) + 1;
    });
    return counts;
  }, [liveMembers]);

  const topGame = useMemo(() => {
    let label: string | null = null;
    let count = 0;
    for (const [game, gameCount] of Object.entries(gameCounts)) {
      if (gameCount > count) {
        label = game;
        count = gameCount;
      }
    }
    return { label, count };
  }, [gameCounts]);

  const matchesQuickFilter = useMemo(() => {
    return (live: LiveMember, filter: LivesQuickFilter): boolean => {
      if (filter === "all") return true;
      const login = normalizeLoginKey(live.twitchLogin);
      if (filter === "spotlight") {
        return (
          live.isSpotlight === true ||
          (!!spotlightLogin && login === normalizeLoginKey(spotlightLogin)) ||
          (!!spotlightDisplayName &&
            normalizeText(live.displayName) === normalizeText(spotlightDisplayName))
        );
      }
      if (filter === "celebrations") {
        return live.isBirthdayToday === true || live.isAffiliateAnniversaryToday === true;
      }
      if (filter === "not_followed") {
        return showFollowStatuses && followStatuses[login] === "not_followed";
      }
      return true;
    };
  }, [followStatuses, showFollowStatuses, spotlightDisplayName, spotlightLogin]);

  const quickFilterCounts = useMemo(() => {
    const counts: Record<LivesQuickFilter, number> = {
      all: liveMembers.length,
      spotlight: 0,
      celebrations: 0,
      not_followed: 0,
    };
    liveMembers.forEach((live) => {
      if (matchesQuickFilter(live, "spotlight")) counts.spotlight += 1;
      if (matchesQuickFilter(live, "celebrations")) counts.celebrations += 1;
      if (matchesQuickFilter(live, "not_followed")) counts.not_followed += 1;
    });
    return counts;
  }, [liveMembers, matchesQuickFilter]);

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return "Synchronisation en cours…";
    return `Mis à jour à ${lastSyncedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }, [lastSyncedAt]);

  const filteredLives = useMemo(() => {
    let result = [...liveMembers];
    const normalizedSearch = normalizeText(deferredSearch);

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

    if (quickFilter !== "all") {
      result = result.filter((live) => matchesQuickFilter(live, quickFilter));
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
        isTenfExplorer: tenfExplorerByLogin[normalizedLogin] === true,
        isWarmlySupported: uniqueRaidersReceived >= 10,
        isBalancedSupport: hasRaidActivity && Math.abs(raidsDone - raidsReceived) <= 3,
        followState: showFollowStatuses
          ? followStatuses[normalizedLogin] || "unknown"
          : undefined,
      };
    });

    const sortByTenf = (a: (typeof withPriority)[number], b: (typeof withPriority)[number]) => {
      const priorityDiff = getLivePriority(b) - getLivePriority(a);
      if (priorityDiff !== 0) return priorityDiff;
      const aHash = stableHash(`${sessionShuffleSeed}:${a.twitchLogin.toLowerCase()}:${safeToDateMs(a.startedAt)}`);
      const bHash = stableHash(`${sessionShuffleSeed}:${b.twitchLogin.toLowerCase()}:${safeToDateMs(b.startedAt)}`);
      return aHash - bHash;
    };

    if (sortMode === "viewers") {
      withPriority.sort((a, b) => b.viewerCount - a.viewerCount || sortByTenf(a, b));
    } else if (sortMode === "recent") {
      withPriority.sort(
        (a, b) => safeToDateMs(a.startedAt) - safeToDateMs(b.startedAt) || sortByTenf(a, b)
      );
    } else if (sortMode === "alpha") {
      withPriority.sort(
        (a, b) => a.displayName.localeCompare(b.displayName, "fr") || sortByTenf(a, b)
      );
    } else {
      withPriority.sort(sortByTenf);
    }

    return withPriority;
  }, [
    liveMembers,
    deferredSearch,
    selectedGame,
    selectedRole,
    quickFilter,
    sortMode,
    matchesQuickFilter,
    spotlightLogin,
    spotlightDisplayName,
    topRaiderLogin,
    topRaiderCount,
    raidMetricsByLogin,
    tenfExplorerByLogin,
    sessionShuffleSeed,
    followStatuses,
    showFollowStatuses,
  ]);

  const pickRandomFilteredLive = (): LiveMember | null => {
    if (filteredLives.length === 0) return null;
    return filteredLives[Math.floor(Math.random() * filteredLives.length)];
  };

  const handlePickRandomLive = () => {
    const selected = pickRandomFilteredLive();
    if (!selected) {
      setRandomHint("Aucun live ne correspond aux filtres actuels.");
      return;
    }
    setRandomHint(`Sélection aléatoire : ${selected.displayName} — bonne découverte !`);
    window.open(selected.twitchUrl, "_blank", "noopener,noreferrer");
  };

  const handlePickRandomRaid = () => {
    const selected = pickRandomFilteredLive();
    if (!selected) {
      setRandomHint("Aucun live ne correspond aux filtres actuels — élargis la sélection pour un raid.");
      return;
    }
    setRandomRaidLive(selected);
    setRandomRaidOpen(true);
    setRandomHint(null);
  };

  const handlePickAnotherRandomRaid = () => {
    const selected = pickRandomFilteredLive();
    if (selected) setRandomRaidLive(selected);
  };

  function openLiveMemberModal(live: LiveMember) {
    const loginKey = String(live.twitchLogin || "").toLowerCase();
    const followState = showFollowStatuses ? followStatuses[loginKey] || "unknown" : undefined;
    setLiveMemberModalMember(liveMemberToModalPayload(live, followState));
    setLiveMemberModalOpen(true);
  }

  useEffect(() => {
    if (liveMembers.length > 0 && filteredLives.length === 0) {
      setRandomHint("Aucun live ne correspond aux filtres actuels — élargis la recherche pour relancer un tirage.");
    } else {
      setRandomHint(null);
    }
  }, [filteredLives.length, liveMembers.length]);

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
  const spotlightLive = spotlightLiveMembers[0] || null;

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

  const upaCharityCampaignHref = useMemo(() => {
    const raw = String(upaContent?.general?.charityCampaignUrl || "").trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }, [upaContent?.general?.charityCampaignUrl]);

  if (loading) {
    return (
      <div style={LIVES_PAGE_STYLE}>
        <div className="space-y-6" style={LIVES_CONTAINER_STYLE}>
          <div className={`${theme.panel} ${theme.panelPaddingLg}`}>
            <div className={theme.panelOrbViolet} aria-hidden />
            <div className={`${theme.panelInner} space-y-3`}>
            <p className={theme.badgeViolet}>On synchronise avec Twitch…</p>
            <h1
              className="mt-3 font-extrabold tracking-tight"
              style={{ color: "var(--color-text)", fontSize: "clamp(1.6rem, 1.2rem + 1.5vw, 2.5rem)" }}
            >
              Les lives TENF arrivent…
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              On vérifie qui est en direct sur Twitch, on prépare les vignettes et on compose la sélection — quelques
              secondes maximum.
            </p>
            <div
              className="mt-6 h-1 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              role="status"
              aria-live="polite"
              aria-label="Chargement des lives en cours"
            >
              <span className="block h-full w-1/2 animate-pulse bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
            </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-32 animate-pulse rounded-2xl ${theme.glassCard} ${theme.glassCardViolet}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={LIVES_PAGE_STYLE}>
      <div className="space-y-6 sm:space-y-8" style={LIVES_CONTAINER_STYLE}>
      <LivesHero
        displayedLivesCount={filteredLives.length}
        onPickRandomLive={handlePickRandomLive}
        randomDisabled={filteredLives.length === 0}
        eventsHref="/evenements"
        spotlightDisplayName={spotlightDisplayName}
        spotlightText={spotlightEncouragement}
      />

      <LivesPhilosophyBanner />

      <LivesDiscoveryPanel
        search={search}
        onSearchChange={setSearch}
        selectedGame={selectedGame}
        onGameChange={setSelectedGame}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        games={availableGames}
        gameCounts={gameCounts}
        roles={availableRoles}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        quickFilterCounts={quickFilterCounts}
        showNotFollowedFilter={showFollowStatuses}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        filteredCount={filteredLives.length}
        totalLiveCount={liveMembers.length}
        totalMembers={totalMembers}
        activeMembers={activeMembers}
        topGameLabel={topGame.label}
        topGameCount={topGame.count}
        lastSyncedLabel={lastSyncedLabel}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        onScrollToLives={scrollToLivesGrid}
        onPickRandomLive={handlePickRandomLive}
        onPickRandomRaid={handlePickRandomRaid}
        randomDisabled={filteredLives.length === 0}
        spotlightDisplayName={spotlightDisplayName}
      />

      {error ? (
        <div className={theme.alertError} role="alert">
          <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="mt-0.5 text-xs text-red-200/80">
              On retente automatiquement toutes les minutes. Tu peux aussi rafraîchir la page.
            </p>
          </div>
        </div>
      ) : null}

      {randomHint ? (
        <p className={`${theme.badgeViolet} text-xs sm:text-sm`} role="status" aria-live="polite">
          <Dice5 className="h-3.5 w-3.5" aria-hidden />
          {randomHint}
        </p>
      ) : null}

      <div id="lives-grid" className="scroll-mt-24 space-y-6 sm:space-y-8">
      {spotlightLive ? (
        <section
          className={`${theme.panel} ${theme.panelSpotlight} ${theme.panelPadding}`}
          aria-labelledby="spotlight-section-title"
        >
          <div className={theme.panelOrbFuchsia} aria-hidden />
          <div className={theme.panelOrbViolet} aria-hidden />
          <div className={`${theme.panelInner} grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center`}>
            <div className="space-y-3">
              <p className={theme.badgeViolet}>
                <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                Spotlight TENF en cours
              </p>
              <h2
                id="spotlight-section-title"
                className="font-bold"
                style={{ color: "#efe5ff", fontSize: "clamp(1.4rem, 1.1rem + 1vw, 2.1rem)" }}
              >
                On met tout l'amour sur ce live ce soir
              </h2>
              <p
                className="leading-relaxed"
                style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(0.9rem, 0.85rem + 0.15vw, 1rem)" }}
              >
                Une seule chaîne est mise en avant à la fois pour concentrer la visibilité et offrir un vrai moment de
                soutien à un membre. C'est notre façon de dire « on est là pour toi ce soir ».
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`${theme.glassInset} ${theme.glassInsetViolet} p-3`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">
                    Au streamer Spotlight
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-violet-100/85">
                    Ta voix compte ici. On est avec toi et on soutient ton énergie — pas de pression, juste un vrai
                    moment partagé.
                  </p>
                </div>
                <div className={`${theme.glassInset} p-3`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                    À la communauté
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-300/90">
                    Viens comme tu es : un message bienveillant, un follow ou quelques minutes de présence peuvent
                    vraiment faire la différence.
                  </p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md">
              <LiveCard
                key={`spotlight-${spotlightLive.twitchLogin}-${spotlightLive.startedAt}`}
                live={spotlightLive}
                onOpenMemberProfile={() => openLiveMemberModal(spotlightLive)}
              />
            </div>
          </div>
        </section>
      ) : null}

      {isUpaPeriodActive && upaLiveMembers.length > 0 ? (
        <section
          className={`space-y-5 ${theme.panel} ${theme.panelAmber} ${theme.panelPadding}`}
          aria-labelledby="upa-section-title"
        >
          <div className={theme.panelOrbViolet} aria-hidden />
          <div className={`${theme.panelInner} space-y-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={theme.badgeAmber}>
                <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                Semaine caritative UPA
              </p>
              <h2
                id="upa-section-title"
                className="mt-2 font-bold"
                style={{ color: "#f7edd0", fontSize: "clamp(1.4rem, 1.1rem + 1vw, 2.1rem)" }}
              >
                Lives caritatifs UPA en cours
              </h2>
              <p
                className="max-w-2xl leading-relaxed"
                style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(0.9rem, 0.85rem + 0.15vw, 1rem)" }}
              >
                On met automatiquement en avant les lives qui se mobilisent pendant la semaine UPA : ton clic, ton
                message ou un petit don peuvent faire avancer la cagnotte.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#e9d79a" }}>
                <Sparkles className="h-4 w-4" aria-hidden />
                Cause soutenue : Ligue contre le cancer
              </p>
            </div>
            <div className={`${theme.glassInset} ${theme.glassInsetAmber} px-3 py-2 text-right`}>
              <p className="text-sm font-bold" style={{ color: "#f5df9d" }}>
                {upaLiveMembers.length} live{upaLiveMembers.length > 1 ? "s" : ""} UPA actif
                {upaLiveMembers.length > 1 ? "s" : ""}
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
              <span className={theme.badgeNeutral}>{upaDateRangeLabel}</span>
            ) : null}
            <span className={theme.badgeViolet}>Priorité solidarité</span>
          </div>

          {charityStats?.available === true &&
          typeof charityStats.raised === "number" &&
          typeof charityStats.displayGoal === "number" &&
          typeof charityStats.currency === "string" ? (
            <div className={`${theme.glassCard} ${theme.glassCardAmber} px-4 py-5`}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#f5df9d" }}>
                Cagnotte en direct
              </p>
              <CharityProgressBar
                raised={charityStats.raised}
                displayGoal={charityStats.displayGoal}
                currency={charityStats.currency}
              />
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Mise à jour automatique toutes les 2 minutes environ — chaque don apparaît en quasi-direct.
              </p>
            </div>
          ) : null}

          {upaCharityCampaignHref ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <a
                href={upaCharityCampaignHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.btnAmber} group w-full sm:w-auto`}
              >
                <HeartHandshake className="h-4 w-4" aria-hidden />
                Suivre la cagnotte en direct
                <ExternalLink className="h-3.5 w-3.5 opacity-70 transition group-hover:opacity-100" aria-hidden />
              </a>
              <p className="text-xs sm:max-w-md" style={{ color: "rgba(255,255,255,0.72)" }}>
                Les dons et le total collecté se mettent à jour sur la page officielle de la campagne (Streamlabs
                Charity).
              </p>
            </div>
          ) : null}

          {streamlabsGoalWidgetSrc && !upaCharityCampaignHref ? (
            <a
              href={streamlabsGoalWidgetSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline focus-visible:underline"
              style={{ color: "#e9d79a" }}
            >
              Voir l'objectif dans le widget Streamlabs
              <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
            </a>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
            {upaLiveMembers.map((live) => (
              <LiveCard
                key={`upa-${live.twitchLogin}-${live.startedAt}`}
                live={live}
                onOpenMemberProfile={() => openLiveMemberModal(live)}
              />
            ))}
          </div>
          </div>
        </section>
      ) : null}

      {regularLiveMembers.length > 0 ? (
        <section aria-labelledby="regular-lives-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="regular-lives-title"
                className="font-bold tracking-tight"
                style={{ color: "var(--color-text)", fontSize: "clamp(1.2rem, 1rem + 0.7vw, 1.6rem)" }}
              >
                Tous les lives TENF
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {regularLiveMembers.length} chaîne{regularLiveMembers.length > 1 ? "s" : ""} en direct — ouvre une
                fiche pour découvrir la personne avant d'arriver sur Twitch.
              </p>
            </div>
            <span className={`${theme.badgeNeutral} self-start sm:self-end`}>
              <Sparkles className={`h-3.5 w-3.5 ${theme.iconViolet}`} aria-hidden />
              Mises en avant en haut, puis ordre aléatoire
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
            {regularLiveMembers.map((live) => (
              <LiveCard
                key={`${live.twitchLogin}-${live.startedAt}`}
                live={live}
                onOpenMemberProfile={() => openLiveMemberModal(live)}
              />
            ))}
          </div>
        </section>
      ) : upaLiveMembers.length === 0 && spotlightLiveMembers.length === 0 ? (
        <section className={`${theme.panel} ${theme.panelPadding} text-center`}>
          <div className={theme.panelOrbViolet} aria-hidden />
          <div className={`${theme.panelInner} space-y-4`}>
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${theme.glassInset} ${theme.glassInsetViolet}`}
            aria-hidden
          >
            <Sparkles className={`h-6 w-6 ${theme.iconViolet}`} />
          </div>
          <p className="mt-4 text-base font-bold" style={{ color: "var(--color-text)" }}>
            Personne en live avec ces filtres
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Soit la communauté est plus calme ce moment-ci, soit tes filtres sont trop précis.
            {topGame.label && topGame.count > 0 ? (
              <>
                {" "}
                En ce moment, <strong style={{ color: "var(--color-text)" }}>{topGame.label}</strong> concentre{" "}
                {topGame.count} live{topGame.count > 1 ? "s" : ""}.
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedGame("all");
              setSelectedRole("all");
              setQuickFilter("all");
            }}
            className={`${theme.btnSecondary} mt-4`}
          >
            Réinitialiser tous les filtres
          </button>
          </div>
        </section>
      ) : null}
      </div>

      <UpcomingEventsSection events={upcomingEvents} allEventsHref="/evenements" />

      <JoinTENFSection href="/rejoindre" />
      </div>

      {/* FAB mobile — repris uniquement quand au moins un live est cliquable */}
      <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
        <div
          className={`rounded-2xl border p-2 shadow-2xl ${theme.panel}`}
          style={{ borderColor: "rgba(145, 70, 255, 0.45)" }}
        >
          <button
            type="button"
            onClick={handlePickRandomLive}
            disabled={filteredLives.length === 0}
            aria-label={
              filteredLives.length === 0
                ? "Aucun live à tirer au sort pour l'instant"
                : `Découvrir un live au hasard parmi ${filteredLives.length} lives`
            }
            className={`${theme.btnPrimary} group w-full`}
          >
            <Dice5 className="h-4 w-4 transition group-hover:rotate-12" aria-hidden />
            Découvrir un live au hasard
            {filteredLives.length > 0 ? (
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
                {filteredLives.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <RandomRaidModal
        live={randomRaidLive}
        isOpen={randomRaidOpen}
        onClose={() => {
          setRandomRaidOpen(false);
          setRandomRaidLive(null);
        }}
        onPickAnother={handlePickAnotherRandomRaid}
        onOpenMemberProfile={
          randomRaidLive
            ? () => {
                setRandomRaidOpen(false);
                openLiveMemberModal(randomRaidLive);
              }
            : undefined
        }
      />

      {liveMemberModalMember ? (
        <MemberModal
          member={liveMemberModalMember}
          isOpen={liveMemberModalOpen}
          contextBanner={LIVE_MEMBER_MODAL_BANNER}
          onClose={() => {
            setLiveMemberModalOpen(false);
            setLiveMemberModalMember(null);
          }}
        />
      ) : null}
    </div>
  );
}
