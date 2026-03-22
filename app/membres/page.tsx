"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import MemberModal from "@/components/MemberModal";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

interface PublicMember {
  twitchLogin: string;
  twitchUrl: string;
  displayName: string;
  role: string;
  isVip: boolean;
  vipBadge?: string;
  badges?: string[];
  discordId?: string;
  discordUsername?: string;
  avatar?: string;
  description?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  shadowbanLives?: boolean;
  createdAt?: string;
  integrationDate?: string;
}

type FollowState = "followed" | "not_followed" | "unknown";

type FollowStatusEntry = {
  state: FollowState;
  visual: "coeur_plein" | "coeur_vide" | "point_interrogation";
};

type LiveStream = {
  id: string;
  userLogin: string;
  userName: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  type: string;
};

type PlanningItem = {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
  twitchLogin: string;
  displayName: string;
};

type PlanningStatus = "shared" | "partial" | "none";
type MemberActivityLevel = "live" | "week" | "normal";
type FilterKey = "all" | "dev" | "affilie" | "staff" | "discover";
type StaffTier =
  | "admin_fondateur"
  | "admin_coordinateur"
  | "moderateur"
  | "moderateur_formation"
  | "moderateur_pause"
  | "soutien_tenf"
  | null;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "🎮 Tous" },
  { key: "dev", label: "🌱 Créateurs en développement" },
  { key: "affilie", label: "⭐ Affiliés Twitch" },
  { key: "staff", label: "🛡 Staff TENF" },
  { key: "discover", label: "💜 À découvrir pour toi" },
];

const INITIAL_VISIBLE_COUNT = 24;
const LOAD_MORE_COUNT = 24;

function normalizeText(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function startOfWeekMonday(date: Date): Date {
  const clone = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const day = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - day);
  return clone;
}

function endOfWeekSunday(date: Date): Date {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function isStaffCategory(role: string): boolean {
  return normalizeMemberRole(role) !== null;
}

function isAffiliated(role: string): boolean {
  return role === "Affilié";
}

function isDevelopment(role: string): boolean {
  return role === "Développement";
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function normalizeMemberRole(role: string): StaffTier {
  const normalized = normalizeText(role);

  if (normalized.includes("admin") && (normalized.includes("fondateur") || normalized === "admin")) {
    return "admin_fondateur";
  }
  if (normalized.includes("admin") && (normalized.includes("coordinateur") || normalized.includes("adjoint"))) {
    return "admin_coordinateur";
  }
  if (normalized.includes("moderateur") && normalized.includes("formation")) {
    return "moderateur_formation";
  }
  if (normalized.includes("moderateur") && normalized.includes("pause")) {
    return "moderateur_pause";
  }
  if (normalized.includes("soutien tenf") || normalized === "soutien") {
    return "soutien_tenf";
  }
  if (normalized.includes("moderateur") || normalized.includes("mentor")) {
    return "moderateur";
  }
  return null;
}

const STAFF_PRIORITY: StaffTier[] = [
  "admin_fondateur",
  "admin_coordinateur",
  "moderateur",
  "moderateur_formation",
  "moderateur_pause",
  "soutien_tenf",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function Page() {
  const searchParams = useSearchParams();
  const liveSectionRef = useRef<HTMLDivElement | null>(null);
  const sessionShuffleSeedRef = useRef<number>(Math.floor(Math.random() * 1_000_000_000));

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMembers, setActiveMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [followStatuses, setFollowStatuses] = useState<Record<string, FollowStatusEntry>>({});
  const [followStatusesState, setFollowStatusesState] = useState({
    authenticated: false,
    linked: false,
  });
  const [liveStreamsByLogin, setLiveStreamsByLogin] = useState<Record<string, LiveStream>>({});
  const [liveShowcaseLogins, setLiveShowcaseLogins] = useState<string[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [fallbackDiscoverLogins, setFallbackDiscoverLogins] = useState<string[]>([]);
  const [discordTotalMembersCount, setDiscordTotalMembersCount] = useState<number | null>(null);
  const [activeCreatorsCount, setActiveCreatorsCount] = useState<number | null>(null);
  const [loadingCommunityStats, setLoadingCommunityStats] = useState(true);
  const [queryModalHandled, setQueryModalHandled] = useState(false);

  const showFollowStatuses = followStatusesState.authenticated && followStatusesState.linked;

  const getFollowBadge = (state?: FollowState) => {
    if (state === "followed") {
      return {
        label: "Déjà suivi",
        icon: "🟢",
        className: "bg-green-500/20 text-green-300 border border-green-500/30",
      };
    }
    if (state === "not_followed") {
      return {
        label: "Pas encore suivi",
        icon: "⚪",
        className: "bg-gray-500/20 text-gray-200 border border-gray-500/30",
      };
    }
    return {
      label: "Statut inconnu",
      icon: "⚫",
      className: "bg-amber-500/20 text-amber-200 border border-amber-500/30",
    };
  };

  // Charger les membres depuis l'API publique
  useEffect(() => {
    async function loadMembers() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        // Laisser le cache HTTP de la route API agir (max-age/stale-while-revalidate)
        const response = await fetch("/api/members/public", {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setActiveMembers(data.members || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  useEffect(() => {
    async function loadCommunityStats() {
      try {
        const response = await fetch("/api/home", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return;

        const totalMembersValue = data?.stats?.totalMembers;
        const activeMembersValue = data?.stats?.activeMembers;

        if (Number.isFinite(totalMembersValue)) {
          setDiscordTotalMembersCount(Number(totalMembersValue));
        }
        if (Number.isFinite(activeMembersValue)) {
          setActiveCreatorsCount(Number(activeMembersValue));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques communauté:", error);
      } finally {
        setLoadingCommunityStats(false);
      }
    }
    loadCommunityStats();
  }, []);

  useEffect(() => {
    async function loadFollowStatuses() {
      try {
        const response = await fetch("/api/members/follow-status", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.authenticated !== true) {
          setFollowStatusesState({ authenticated: false, linked: false });
          return;
        }

        const rawStatuses = (data?.statuses || {}) as Record<
          string,
          { state?: FollowState; visual?: FollowStatusEntry["visual"] }
        >;
        const normalized: Record<string, FollowStatusEntry> = {};
        for (const [login, entry] of Object.entries(rawStatuses)) {
          const key = login.toLowerCase();
          const state = entry?.state || "unknown";
          normalized[key] = {
            state,
            visual: entry?.visual || "point_interrogation",
          };
        }
        setFollowStatuses(normalized);
        setFollowStatusesState({
          authenticated: data?.authenticated === true,
          linked: data?.linked === true,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statuts follow:", error);
        setFollowStatusesState({ authenticated: false, linked: false });
      }
    }
    loadFollowStatuses();
  }, []);

  useEffect(() => {
    async function loadLiveStreams() {
      if (activeMembers.length === 0) {
        setLiveStreamsByLogin({});
        setLiveShowcaseLogins([]);
        setLoadingLive(false);
        return;
      }

      setLoadingLive(true);
      try {
        const eligible = activeMembers
          .filter((member) => !member.shadowbanLives)
          .map((member) => member.twitchLogin)
          .filter(Boolean);

        const response = await fetch("/api/twitch/streams", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          body: JSON.stringify({ logins: eligible }),
          cache: "no-store",
        });
        const body = response.ok ? await response.json() : { streams: [] };
        const streams = Array.isArray(body.streams) ? (body.streams as LiveStream[]) : [];

        const map: Record<string, LiveStream> = {};
        for (const stream of streams) {
          if (stream.type !== "live") continue;
          map[stream.userLogin.toLowerCase()] = stream;
        }
        setLiveStreamsByLogin(map);
      } catch (error) {
        console.error("Erreur lors du chargement des lives:", error);
        setLiveStreamsByLogin({});
      } finally {
        setLoadingLive(false);
      }
    }

    loadLiveStreams();
  }, [activeMembers]);

  useEffect(() => {
    async function loadPlanningInsights() {
      try {
        const now = new Date();
        const currentMonth = getMonthKey(now);
        const nextMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() + 1, 1));

        const responses = await Promise.all([
          fetch(`/api/members/public/stream-plannings?month=${currentMonth}`, { cache: "no-store" }),
          currentMonth === nextMonth
            ? Promise.resolve(null)
            : fetch(`/api/members/public/stream-plannings?month=${nextMonth}`, { cache: "no-store" }),
        ]);

        const firstBody = responses[0] && responses[0].ok ? await responses[0].json() : { items: [] };
        const secondBody = responses[1] && responses[1].ok ? await responses[1].json() : { items: [] };

        const merged = [
          ...(Array.isArray(firstBody.items) ? firstBody.items : []),
          ...(Array.isArray(secondBody.items) ? secondBody.items : []),
        ] as PlanningItem[];
        setPlanningItems(merged);
      } catch (error) {
        console.error("Erreur lors du chargement des plannings publics:", error);
        setPlanningItems([]);
      }
    }

    loadPlanningInsights();
  }, []);

  // Debounce de la recherche (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const planningByLogin = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const weekStart = startOfWeekMonday(now).getTime();
    const weekEnd = endOfWeekSunday(now).getTime();
    const map = new Map<
      string,
      {
        totalUpcoming: number;
        weekCount: number;
        categories: Map<string, number>;
      }
    >();

    for (const item of planningItems) {
      const login = item.twitchLogin.toLowerCase();
      const current = map.get(login) || {
        totalUpcoming: 0,
        weekCount: 0,
        categories: new Map<string, number>(),
      };
      const dateMs = toDateTime(item.date, item.time).getTime();
      const category = (item.liveType || "").trim();

      if (dateMs >= nowMs) {
        current.totalUpcoming += 1;
      }
      if (dateMs >= weekStart && dateMs <= weekEnd) {
        current.weekCount += 1;
      }
      if (category) {
        current.categories.set(category, (current.categories.get(category) || 0) + 1);
      }

      map.set(login, current);
    }

    return map;
  }, [planningItems]);

  const memberCards = useMemo(() => {
    return activeMembers.map((member) => {
      const login = member.twitchLogin.toLowerCase();
      const stream = liveStreamsByLogin[login];
      const planning = planningByLogin.get(login);
      const categories = planning ? [...planning.categories.entries()].sort((a, b) => b[1] - a[1]) : [];
      const primaryGame = stream?.gameName || categories[0]?.[0] || "Communaute";
      const activity: MemberActivityLevel = stream
        ? "live"
        : (planning?.weekCount || 0) > 0
          ? "week"
          : "normal";
      const planningStatus: PlanningStatus =
        (planning?.totalUpcoming || 0) >= 3
          ? "shared"
          : (planning?.totalUpcoming || 0) >= 1
            ? "partial"
            : "none";

      return {
        ...member,
        login,
        stream,
        primaryGame,
        activity,
        planningStatus,
        isAffiliated: isAffiliated(member.role),
        isDevelopment: isDevelopment(member.role),
        staffTier: normalizeMemberRole(member.role),
        isStaff: isStaffCategory(member.role),
        followState: showFollowStatuses ? followStatuses[login]?.state || "unknown" : undefined,
        streamTags: categories.slice(0, 3).map(([name]) => name),
      };
    });
  }, [activeMembers, followStatuses, liveStreamsByLogin, planningByLogin, showFollowStatuses]);

  const liveMembers = useMemo(
    () => memberCards.filter((member) => Boolean(member.stream)),
    [memberCards]
  );

  useEffect(() => {
    if (liveMembers.length === 0) {
      setLiveShowcaseLogins([]);
      return;
    }
    const logins = shuffleArray(liveMembers.map((member) => member.login)).slice(0, 3);
    setLiveShowcaseLogins(logins);
  }, [liveMembers]);

  useEffect(() => {
    const pool = shuffleArray(memberCards.map((member) => member.login)).slice(
      0,
      Math.min(6, memberCards.length)
    );
    setFallbackDiscoverLogins(pool);
  }, [memberCards]);

  const liveShowcaseMembers = useMemo(() => {
    const byLogin = new Map(memberCards.map((member) => [member.login, member]));
    return liveShowcaseLogins
      .map((login) => byLogin.get(login))
      .filter((member): member is (typeof memberCards)[number] => Boolean(member));
  }, [liveShowcaseLogins, memberCards]);

  const discoverForYouMembers = useMemo(() => {
    if (!showFollowStatuses) return [];
    return [...memberCards]
      .filter((member) => member.followState === "not_followed")
      .sort((a, b) => {
        const activityRank = (member: (typeof memberCards)[number]) =>
          member.activity === "live" ? 3 : member.activity === "week" ? 2 : 1;
        if (activityRank(a) !== activityRank(b)) return activityRank(b) - activityRank(a);
        if (a.isAffiliated !== b.isAffiliated) return Number(b.isAffiliated) - Number(a.isAffiliated);
        return a.displayName.localeCompare(b.displayName, "fr");
      });
  }, [memberCards, showFollowStatuses]);

  const discoverForYouTopMembers = useMemo(() => {
    if (!showFollowStatuses) return [];
    return [...discoverForYouMembers]
      .sort((a, b) => {
        const rankA = hashString(`${a.login}-discover-${sessionShuffleSeedRef.current}`);
        const rankB = hashString(`${b.login}-discover-${sessionShuffleSeedRef.current}`);
        return rankA - rankB;
      })
      .slice(0, 3);
  }, [discoverForYouMembers, showFollowStatuses]);

  const discoverTodayMembers = useMemo(() => {
    if (showFollowStatuses) return [];
    const liveShowcaseSet = new Set(liveShowcaseLogins);
    const byLogin = new Map(memberCards.map((member) => [member.login, member]));
    const fallback = fallbackDiscoverLogins
      .map((login) => byLogin.get(login))
      .filter((member): member is (typeof memberCards)[number] => Boolean(member))
      .filter((member) => !liveShowcaseSet.has(member.login));
    return fallback.slice(0, 6);
  }, [fallbackDiscoverLogins, liveShowcaseLogins, memberCards, showFollowStatuses]);

  const recentIntegratedMembers = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const eligible = memberCards.filter((member) => {
      if (!member.integrationDate) return false;
      const ts = new Date(member.integrationDate).getTime();
      if (Number.isNaN(ts)) return false;
      return now - ts <= sevenDaysMs && now >= ts;
    });
    if (eligible.length <= 6) return eligible;
    return shuffleArray(eligible).slice(0, 6);
  }, [memberCards]);

  const randomRankByLogin = useMemo(() => {
    const map = new Map<string, number>();
    for (const member of memberCards) {
      const score = hashString(`${member.login}-${sessionShuffleSeedRef.current}`);
      map.set(member.login, score);
    }
    return map;
  }, [memberCards]);

  const filteredMembers = useMemo(() => {
    let filtered = [...memberCards];

    if (activeFilter === "dev") {
      filtered = filtered.filter((member) => member.isDevelopment);
    } else if (activeFilter === "affilie") {
      filtered = filtered.filter((member) => member.isAffiliated);
    } else if (activeFilter === "staff") {
      filtered = filtered.filter((member) => member.isStaff);
    } else if (activeFilter === "discover") {
      if (!showFollowStatuses) {
        filtered = [];
      } else {
        filtered = filtered.filter((member) => member.followState === "not_followed");
      }
    }

    const normalizedQuery = normalizeText(debouncedSearchQuery);
    if (normalizedQuery) {
      filtered = filtered.filter((member) => {
        return (
          normalizeText(member.twitchLogin).includes(normalizedQuery) ||
          normalizeText(member.displayName).includes(normalizedQuery) ||
          normalizeText(member.primaryGame).includes(normalizedQuery) ||
          normalizeText(member.description).includes(normalizedQuery)
        );
      });
    }

    const staff = filtered.filter((member) => member.staffTier !== null);
    const others = filtered.filter((member) => member.staffTier === null);

    staff.sort((a, b) => {
      const aTier = STAFF_PRIORITY.indexOf(a.staffTier);
      const bTier = STAFF_PRIORITY.indexOf(b.staffTier);
      if (aTier !== bTier) return aTier - bTier;
      return a.displayName.localeCompare(b.displayName, "fr");
    });

    others.sort((a, b) => {
      const rankA = randomRankByLogin.get(a.login) ?? 0;
      const rankB = randomRankByLogin.get(b.login) ?? 0;
      return rankA - rankB;
    });

    return [...staff, ...others];
  }, [activeFilter, debouncedSearchQuery, memberCards, randomRankByLogin, showFollowStatuses]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeFilter, debouncedSearchQuery]);

  useEffect(() => {
    if (activeFilter === "discover" && !showFollowStatuses) {
      setActiveFilter("all");
    }
  }, [activeFilter, showFollowStatuses]);

  const visibleMembers = filteredMembers.slice(0, visibleCount);
  const hasMoreMembers = visibleCount < filteredMembers.length;

  const stats = useMemo(() => {
    const fallbackActiveCreators = activeMembers.filter(
      (member) => isAffiliated(member.role) || isDevelopment(member.role)
    ).length;
    const totalMembers = discordTotalMembersCount;
    const activeCreators = activeCreatorsCount ?? fallbackActiveCreators;
    const liveCount = liveMembers.length;

    return { totalMembers, activeCreators, liveCount };
  }, [activeCreatorsCount, activeMembers, discordTotalMembersCount, liveMembers.length]);

  const formatStatValue = (value: number | null | undefined, isLoading: boolean): string => {
    if (isLoading) return "…";
    if (!Number.isFinite(value || 0)) return "—";
    return String(value || 0);
  };

  const getPlanningLabel = (status: PlanningStatus) => {
    if (status === "shared") return "📅 Planning partagé";
    if (status === "partial") return "📅 Planning partiel";
    return "📅 Planning non renseigné";
  };

  const openRandomMember = (pool?: typeof memberCards) => {
    const source = pool && pool.length > 0 ? pool : memberCards;
    if (source.length === 0) return;
    const selected = source[Math.floor(Math.random() * source.length)];
    handleMemberClick(selected);
  };

  const handleMemberClick = (member: (PublicMember & {
    primaryGame?: string;
    activity?: MemberActivityLevel;
    planningStatus?: PlanningStatus;
    streamTags?: string[];
    followState?: FollowState;
  })) => {
    const avatar = member.avatar || `https://placehold.co/96x96?text=${member.displayName.charAt(0)}`;
    const followState = showFollowStatuses
      ? member.followState || followStatuses[member.twitchLogin.toLowerCase()]?.state || "unknown"
      : undefined;

    setSelectedMember({
      id: member.twitchLogin,
      name: member.displayName,
      role: member.role,
      avatar: avatar,
      twitchLogin: member.twitchLogin,
      description: member.description || `Membre ${member.role} de la communauté TENF.`,
      twitchUrl: `https://www.twitch.tv/${member.twitchLogin}`,
      discordId: member.discordId,
      isVip: member.isVip,
      vipBadge: member.vipBadge,
      badges: member.badges || [],
      socials: {
        discord: member.discordId ? `https://discord.com/users/${member.discordId}` : undefined,
        instagram: member.instagram ? (member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram.replace(/^@/, '')}`) : undefined,
        twitter: member.twitter ? (member.twitter.startsWith('http') ? member.twitter : `https://twitter.com/${member.twitter.replace(/^@/, '')}`) : undefined,
        tiktok: member.tiktok ? (member.tiktok.startsWith('http') ? member.tiktok : `https://tiktok.com/@${member.tiktok.replace(/^@/, '')}`) : undefined,
      },
      followStatus: followState,
      mainGame: member.primaryGame || "Communaute",
      isAffiliated: isAffiliated(member.role),
      isActiveThisWeek: member.activity === "week" || member.activity === "live",
      planningStatus: member.planningStatus || "none",
      streamTags: member.streamTags || [],
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (queryModalHandled) return;
    if (activeMembers.length === 0) return;

    const requestedLogin = normalizeText(searchParams.get("member"));
    if (!requestedLogin) {
      setQueryModalHandled(true);
      return;
    }

    const target = activeMembers.find((member) => normalizeText(member.twitchLogin) === requestedLogin);
    if (!target) {
      setQueryModalHandled(true);
      return;
    }

    handleMemberClick(target);
    setQueryModalHandled(true);
  }, [activeMembers, queryModalHandled, searchParams]);

  return (
    <div className="space-y-8 pb-10">
      {/* HERO découverte TENF */}
      <section
        className="relative overflow-hidden rounded-2xl border p-4 sm:p-6 md:p-8 lg:p-10"
        style={{
          borderColor: "rgba(145,70,255,0.35)",
          background:
            "linear-gradient(120deg, rgba(20,20,28,0.98) 0%, rgba(42,24,62,0.9) 60%, rgba(28,18,42,0.92) 100%)",
          boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full opacity-70 blur-3xl"
          style={{ background: "rgba(145,70,255,0.4)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full opacity-50 blur-3xl"
          style={{ background: "rgba(236,72,153,0.22)" }}
        />
        <div className="relative grid items-stretch gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="relative rounded-2xl border p-4 sm:p-5 md:p-6" style={{ borderColor: "rgba(145,70,255,0.25)", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div
              className="pointer-events-none absolute -bottom-8 left-14 h-24 w-24 rounded-full blur-2xl"
              style={{ backgroundColor: "rgba(145,70,255,0.26)" }}
            />
            <div className="relative space-y-5">
              <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "rgba(145,70,255,0.45)", color: "var(--color-text-secondary)" }}>
                Découverte communautaire
              </span>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-5xl" style={{ color: "var(--color-text)" }}>
                Découvrir les créateurs{" "}
                <span style={{ color: "#c8a5ff" }}>TENF</span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed md:text-[1.03rem]" style={{ color: "var(--color-text-secondary)" }}>
                Chaque créateur ici a son univers, son rythme et son histoire.
                <br />
                La découverte fait partie de l&apos;entraide 💜
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openRandomMember()}
                  className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all min-h-[44px]"
                  style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 12px 26px rgba(145,70,255,0.34)" }}
                >
                  🎲 Découvrir un créateur
                </button>
                <button
                  type="button"
                  onClick={() => liveSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="w-full sm:w-auto rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px]"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  🔴 Voir les créateurs en live
                </button>
              </div>
              <p className="text-xs md:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Des profils variés, du live, et de belles découvertes à portée de clic.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>👥 Membres</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {formatStatValue(stats.totalMembers, loadingCommunityStats)}
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>🎮 Créateurs actifs</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {formatStatValue(stats.activeCreators, loadingCommunityStats)}
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>🔴 En live</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {formatStatValue(stats.liveCount, loadingLive)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EN LIVE MAINTENANT */}
      <section ref={liveSectionRef} className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>🔴 En live maintenant</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Des créateurs TENF sont en direct en ce moment.
          </p>
        </div>
        {loadingLive ? (
          <div className="rounded-xl border p-5 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-card)" }}>
            Chargement des lives...
          </div>
        ) : liveShowcaseMembers.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {liveShowcaseMembers.map((member) => {
              const stream = member.stream!;
              const followBadge = getFollowBadge(member.followState);
              return (
                <article
                  key={member.twitchLogin}
                  className="group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-[2px]"
                  style={{
                    borderColor: "rgba(145,70,255,0.34)",
                    backgroundColor: "var(--color-card)",
                    boxShadow: "0 14px 28px rgba(0,0,0,0.24)",
                  }}
                >
                  {showFollowStatuses ? (
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] ${followBadge.className}`}
                      title={followBadge.label}
                    >
                      {followBadge.icon} {followBadge.label}
                    </span>
                  ) : null}
                  <div className="mb-3 flex items-start gap-3">
                    <img
                      src={member.avatar || `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`}
                      alt={member.displayName}
                      className="h-12 w-12 rounded-full border object-cover"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold" style={{ color: "var(--color-text)" }}>{member.displayName}</p>
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white animate-pulse">LIVE</span>
                      </div>
                      <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>@{member.twitchLogin}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p style={{ color: "var(--color-text)" }}>🎮 {stream.gameName || "Just Chatting"}</p>
                    <p style={{ color: "var(--color-text-secondary)" }}>👀 {stream.viewerCount || 0} viewers</p>
                    <p className="line-clamp-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{stream.title || "Live TENF"}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={`https://www.twitch.tv/${member.twitchLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      🚪 Ouvrir la porte
                    </a>
                    <button
                      type="button"
                      onClick={() => handleMemberClick(member)}
                      className="w-full sm:w-auto rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Voir profil
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-xl border p-5 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
          >
            Aucun créateur TENF en direct pour le moment. Reviens un peu plus tard 💜
          </div>
        )}
      </section>

      {/* A DECOUVRIR POUR TOI / FALLBACK */}
      {showFollowStatuses ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>💜 À découvrir pour toi</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Ces créateurs TENF ne sont pas encore suivis par ton compte Twitch.
            </p>
          </div>
          {discoverForYouMembers.length > 0 ? (
            <>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
                  Sélection de 3 profils au hasard
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {discoverForYouTopMembers.map((member) => {
                    const followBadge = getFollowBadge(member.followState);
                    return (
                      <article
                        key={`discover-top-${member.twitchLogin}`}
                        className="group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-[1px]"
                        style={{
                          borderColor: "var(--color-border)",
                          backgroundColor: "var(--color-card)",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                        }}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <img
                              src={member.avatar || `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`}
                              alt={member.displayName}
                              className="h-11 w-11 rounded-full border object-cover"
                              style={{ borderColor: "var(--color-border)" }}
                            />
                            <div>
                              <p className="font-semibold" style={{ color: "var(--color-text)" }}>{member.displayName}</p>
                              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>🎮 {member.primaryGame}</p>
                            </div>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] ${followBadge.className}`}>{followBadge.icon} {followBadge.label}</span>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
                          <span className={getRoleBadgeClassName(member.role)}>{member.isAffiliated ? "⭐ Affilié" : "🌱 Développement"}</span>
                          {member.activity !== "normal" ? (
                            <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                              🔥 Actif cette semaine
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://www.twitch.tv/${member.twitchLogin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
                            🚪 Ouvrir la porte
                          </a>
                          <button
                            type="button"
                            onClick={() => handleMemberClick(member)}
                            className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          >
                            Voir profil
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
                  Toutes les chaînes à découvrir ({discoverForYouMembers.length})
                </p>
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                  <div className="flex flex-wrap gap-2">
                    {discoverForYouMembers.map((member) => (
                      <a
                        key={`discover-all-${member.login}`}
                        href={`https://www.twitch.tv/${member.twitchLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-[1px]"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        <img
                          src={member.avatar || `https://placehold.co/32x32?text=${member.displayName.charAt(0)}`}
                          alt={member.displayName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        {member.displayName}
                        {member.activity === "live" ? " 🔴" : ""}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-card)" }}
            >
              Tu suis déjà une grande partie des créateurs proposés. Bien joué 💜
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>⭐ Créateurs à découvrir aujourd&apos;hui</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Une sélection découverte du jour, même sans personnalisation Twitch.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {discoverTodayMembers.map((member) => (
              <article
                key={`fallback-${member.twitchLogin}`}
                className="group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-[1px]"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <div className="mb-3 flex items-start gap-3">
                  <img
                    src={member.avatar || `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`}
                    alt={member.displayName}
                    className="h-11 w-11 rounded-full border object-cover"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                  <div>
                    <p className="font-semibold" style={{ color: "var(--color-text)" }}>{member.displayName}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>🎮 {member.primaryGame}</p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
                  <span className={getRoleBadgeClassName(member.role)}>{member.isAffiliated ? "⭐ Affilié" : "🌱 Développement"}</span>
                  {member.activity !== "normal" ? (
                    <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                      🔥 Actif cette semaine
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://www.twitch.tv/${member.twitchLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    🚪 Ouvrir la porte
                  </a>
                  <button
                    type="button"
                    onClick={() => handleMemberClick(member)}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Voir profil
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Nouveaux createurs a decouvrir */}
      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>✨ Nouveaux créateurs à découvrir</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Une sélection de créateurs récemment intégrés à TENF.
          </p>
        </div>

        {recentIntegratedMembers.length > 0 ? (
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {recentIntegratedMembers.map((member) => (
                <article
                  key={`recent-integrated-${member.login}`}
                  className="rounded-xl border p-3"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="mb-2 flex items-start gap-2.5">
                    <img
                      src={member.avatar || `https://placehold.co/40x40?text=${member.displayName.charAt(0)}`}
                      alt={member.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {member.displayName}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        🎮 {member.primaryGame}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className={getRoleBadgeClassName(member.role)}>
                      {member.isAffiliated ? "⭐ Affilié" : member.isDevelopment ? "🌱 Développement" : getRoleBadgeLabel(member.role)}
                    </span>
                    {member.activity !== "normal" ? (
                      <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                        🔥 Actif cette semaine
                      </span>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://www.twitch.tv/${member.twitchLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      🚪 Ouvrir la porte
                    </a>
                    <button
                      type="button"
                      onClick={() => handleMemberClick(member)}
                      className="rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Voir profil
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}>
            Aucun nouveau créateur intégré cette semaine pour le moment 💜
          </div>
        )}
      </section>

      {/* Recherche + filtres */}
      <section className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un pseudo, un jeu/catégorie ou une bio..."
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: searchQuery ? "var(--color-primary)" : "var(--color-border)",
              color: "var(--color-text)",
              boxShadow: "none",
            }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>button]:snap-start sm:flex-wrap sm:overflow-visible">
          {FILTERS.map((filter) => {
            const disabled = filter.key === "discover" && !showFollowStatuses;
            const tooltip = disabled
              ? "Lie ton compte Twitch pour utiliser ce filtre"
              : undefined;
            return (
            <button
              key={filter.key}
              type="button"
              onClick={() => !disabled && setActiveFilter(filter.key)}
              disabled={disabled}
              title={tooltip}
              className="shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition-all min-h-[42px]"
              style={{
                backgroundColor: activeFilter === filter.key && !disabled ? "rgba(145,70,255,0.15)" : "var(--color-card)",
                borderColor: activeFilter === filter.key ? "rgba(145,70,255,0.6)" : "var(--color-border)",
                color: disabled
                  ? "rgba(148,163,184,0.6)"
                  : activeFilter === filter.key
                    ? "var(--color-text)"
                    : "var(--color-text-secondary)",
                opacity: disabled ? 0.65 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {filter.label}
            </button>
            );
          })}
        </div>
      </section>

      {/* Grille des membres */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Communauté TENF</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {filteredMembers.length} profil{filteredMembers.length > 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--color-primary)" }} />
          </div>
        ) : visibleMembers.length === 0 ? (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Aucun créateur trouvé avec ces filtres.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {visibleMembers.map((member) => {
                const followBadge = getFollowBadge(member.followState);
                return (
                  <article
                    key={member.twitchLogin}
                    className="group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-[2px]"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={member.avatar || `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`}
                          alt={member.displayName}
                          className="h-12 w-12 rounded-full border object-cover"
                          style={{ borderColor: "var(--color-border)" }}
                        />
                        <div>
                          <p className="font-semibold" style={{ color: "var(--color-text)" }}>{member.displayName}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>🎮 {member.primaryGame}</p>
                        </div>
                      </div>
                      {showFollowStatuses ? (
                        <span className={`rounded-full px-2 py-1 text-[10px] ${followBadge.className}`} title={followBadge.label}>
                          {followBadge.icon}
                        </span>
                      ) : null}
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
                      <span className={getRoleBadgeClassName(member.role)}>
                        {member.isAffiliated ? "⭐ Affilié" : member.isDevelopment ? "🌱 Développement" : getRoleBadgeLabel(member.role)}
                      </span>
                      {member.activity !== "normal" ? (
                        <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                          🔥 Actif cette semaine
                        </span>
                      ) : null}
                      <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                        {getPlanningLabel(member.planningStatus)}
                      </span>
                      {showFollowStatuses ? (
                        <span className={`rounded-full px-2 py-0.5 ${followBadge.className}`}>
                          {followBadge.icon} {followBadge.label}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <a
                        href={`https://www.twitch.tv/${member.twitchLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        🚪 Ouvrir la porte
                      </a>
                      <button
                        type="button"
                        onClick={() => handleMemberClick(member)}
                        className="w-full sm:w-auto rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        Voir profil
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMoreMembers ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px]"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Voir plus
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Bloc final Decouvrir au hasard */}
      <section
        className="rounded-2xl border p-6 text-center"
        style={{
          borderColor: "rgba(145,70,255,0.35)",
          background: "linear-gradient(135deg, rgba(145,70,255,0.11), rgba(145,70,255,0.03))",
        }}
      >
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>🎲 Découvrir un créateur</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Clique et découvre un créateur TENF au hasard.
        </p>
        <button
          type="button"
          onClick={() => openRandomMember(filteredMembers)}
          className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-[1px]"
          style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 10px 22px rgba(145,70,255,0.24)" }}
        >
          🎲 Découvrir
        </button>
      </section>

      {/* Modal membre */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMember(null);
          }}
          isAdmin={false}
        />
      )}
    </div>
  );
}
