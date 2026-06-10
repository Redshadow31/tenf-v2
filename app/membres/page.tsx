"use client";

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  HeartHandshake,
  Radio,
  Search,
  Shuffle,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import MemberModal from "@/components/MemberModal";
import MembresDirectoryMemberCard from "@/components/members/MembresDirectoryMemberCard";
import theme from "@/components/members/membres-theme.module.css";
import { getRoleBadgeClassName, getRoleBadgeLabel, resolvePublicDiscoveryRoleBadge } from "@/lib/roleBadgeSystem";
import { isExcludedFromMemberDiscover } from "@/lib/memberRoles";

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
  | "moderateur_autonomie"
  | "moderateur_accompagnement"
  | "moderateur_decouverte"
  | "moderateur_formation"
  | "moderateur_pause"
  | "contributeur_invite"
  | "soutien_tenf"
  | null;

const FILTERS: Array<{ key: FilterKey; label: string; hint: string }> = [
  { key: "all", label: "🎮 Tout le monde", hint: "Tous les profils, mélangés" },
  { key: "dev", label: "🌱 En développement", hint: "Chaînes qui démarrent" },
  { key: "affilie", label: "⭐ Affiliés Twitch", hint: "Affiliés officiels" },
  { key: "staff", label: "🛡 Staff TENF", hint: "Équipe qui anime" },
  { key: "discover", label: "💜 À découvrir pour toi", hint: "Connexion Twitch requise" },
];

const INITIAL_VISIBLE_COUNT = 24;
const LOAD_MORE_COUNT = 24;

// Wrapper fluide : la page contrôle ses propres marges intérieures pour
// utiliser l'espace libre à droite de la sidebar membre et rester
// scalable au zoom navigateur.
const MEMBRES_PAGE_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--membres-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--membres-px)",
  paddingRight: "var(--membres-px)",
  paddingTop: "clamp(1rem, 1.5vw, 1.75rem)",
  paddingBottom: "clamp(2rem, 3vw, 3.5rem)",
};

const MEMBRES_CONTAINER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

function twitchPreviewUrl(url: string): string {
  return url
    .replace("{width}", "640")
    .replace("{height}", "360")
    .replace("%7Bwidth%7D", "640")
    .replace("%7Bheight%7D", "360");
}

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

function publicRoleBadgeNode(role: string, options?: { grid?: boolean; affiliated?: boolean; development?: boolean }) {
  if (options?.affiliated) {
    return (
      <span className={getRoleBadgeClassName("Affilié", { grid: options.grid })}>⭐ Affilié</span>
    );
  }
  if (options?.development) {
    return (
      <span className={getRoleBadgeClassName("Développement", { grid: options.grid })}>🌱 Développement</span>
    );
  }
  const badge = resolvePublicDiscoveryRoleBadge(role, { grid: options?.grid });
  if (!badge) return null;
  return <span className={badge.className}>{badge.label}</span>;
}

function normalizeMemberRole(role: string): StaffTier {
  const normalized = normalizeText(role);

  if (normalized.includes("fondateur") || (normalized.includes("admin") && !normalized.includes("coordinateur") && !normalized.includes("adjoint"))) {
    return "admin_fondateur";
  }
  if (normalized.includes("coordinateur") || (normalized.includes("admin") && (normalized.includes("adjoint") || normalized.includes("coordinateur")))) {
    return "admin_coordinateur";
  }
  if (normalized.includes("contributeur") && normalized.includes("invite")) {
    return "contributeur_invite";
  }
  if (normalized.includes("moderateur") && normalized.includes("autonomie")) {
    return "moderateur_autonomie";
  }
  if (normalized.includes("moderateur") && normalized.includes("accompagnement")) {
    return "moderateur_accompagnement";
  }
  if (normalized.includes("moderateur") && normalized.includes("decouverte")) {
    return "moderateur_decouverte";
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
  "moderateur_autonomie",
  "moderateur_accompagnement",
  "moderateur_decouverte",
  "moderateur_formation",
  "moderateur_pause",
  "contributeur_invite",
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
      .filter(
        (member) =>
          member.followState === "not_followed" && !isExcludedFromMemberDiscover(member.role)
      )
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
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const eligible = memberCards.filter((member) => {
      if (!member.integrationDate) return false;
      const ts = new Date(member.integrationDate).getTime();
      if (Number.isNaN(ts)) return false;
      return now - ts <= thirtyDaysMs && now >= ts;
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
        filtered = filtered.filter(
          (member) =>
            member.followState === "not_followed" && !isExcludedFromMemberDiscover(member.role)
        );
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
      isLive: member.activity === "live",
      isActiveThisWeek: member.activity === "week" || member.activity === "live",
      planningStatus: member.planningStatus || "none",
      streamTags: member.streamTags || [],
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (queryModalHandled) return;
    if (activeMembers.length === 0) return;

    const requestedLogin = normalizeText(searchParams?.get("member"));
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
    <div style={MEMBRES_PAGE_STYLE}>
      <div className="space-y-8 sm:space-y-10" style={MEMBRES_CONTAINER_STYLE}>
      {/* Hero */}
      <section className={`${theme.panel} ${theme.panelPaddingLg}`} aria-labelledby="membres-hero-title">
        <div className={theme.panelOrbViolet} aria-hidden />
        <div className={theme.panelOrbGreen} aria-hidden />
        <div className={`${theme.panelInner} grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8`}>
          <div className={`${theme.glassInset} relative`} style={{ padding: "clamp(1.25rem, 2vw, 2.25rem)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={theme.badgeViolet}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Annuaire public
              </span>
              <span className={`${theme.badgeViolet} ${theme.badgeGreen}`}>
                <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                La New Family
              </span>
            </div>
            <h1
              id="membres-hero-title"
              className="mt-4 font-black leading-[1.05] tracking-tight text-white"
              style={{ fontSize: "clamp(1.85rem, 1.4rem + 1.8vw, 3.25rem)" }}
            >
              Trouve ta prochaine chaîne <span className={theme.titleGradient}>coup de cœur</span>
            </h1>
            <p
              className="mt-4 max-w-2xl leading-relaxed text-zinc-300"
              style={{ fontSize: "clamp(0.95rem, 0.9rem + 0.2vw, 1.1rem)" }}
            >
              Ici, chaque fiche raconte un peu qui anime derrière l'écran : pseudo Twitch, ambiance,
              parfois une bio. Que tu passes en mode découvreur·se ou que tu sois déjà dans la{" "}
              <strong className="font-semibold text-white">New Family</strong>, le jeu consiste à
              ouvrir les profils, tomber sur des univers différents et peut-être poser ta prochaine
              veille sur un live TENF.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-emerald-200/70 sm:text-sm">
              Astuce : tirage au sort, filtres par rôle ou recherche par jeu — tout est en bas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => openRandomMember()} className={`${theme.btnPrimary} min-h-[48px] flex-1 sm:flex-none`}>
                <Shuffle className="h-4 w-4 shrink-0" aria-hidden />
                Surprends-moi avec un profil
              </button>
              <button
                type="button"
                onClick={() => liveSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`${theme.btnLive} min-h-[48px] flex-1 sm:flex-none`}
              >
                <Radio className="h-4 w-4 shrink-0" aria-hidden />
                En live ({formatStatValue(stats.liveCount, loadingLive)})
              </button>
            </div>
            <nav className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5" aria-label="Autres découvertes TENF">
              <Link href="/lives" className={theme.linkPill}>
                Tous les lives <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
              </Link>
              <Link href="/decouvrir-createurs" className={theme.linkPill}>
                Clips <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
              </Link>
              <Link href="/evenements" className={theme.linkPill}>
                Événements <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
              </Link>
              <Link href="/auth/login" className={`${theme.badgeViolet} ${theme.badgeGreen} !normal-case`}>
                Connexion membre <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </nav>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroStatCard
              icon={Users}
              label="Côté Discord"
              value={formatStatValue(stats.totalMembers, loadingCommunityStats)}
              caption="Personnes qui font partie du projet (ordre de grandeur)."
              tone="violet"
            />
            <HeroStatCard
              icon={Sparkles}
              label="Actifs de l'entraide"
              value={formatStatValue(stats.activeCreators, loadingCommunityStats)}
              caption="Présents dans l'entraide sur la période récente."
              tone="amber"
            />
            <HeroStatCard
              icon={Radio}
              label="En direct"
              value={formatStatValue(stats.liveCount, loadingLive)}
              caption="Chaînes TENF détectées tout de suite — section dédiée ci-dessous."
              tone="red"
              live
            />
          </div>
        </div>
      </section>

      <section ref={liveSectionRef} className={`${theme.panel} ${theme.panelPadding}`}>
        <div className={theme.panelOrbGreen} aria-hidden />
        <div className={`${theme.panelInner} space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={`${theme.sectionTitle} flex items-center gap-2`}>
              <span className="relative flex h-3 w-3" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              En direct tout de suite
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Trois chaînes tirées au sort parmi les membres TENF actuellement live — aperçu vidéo, titre du stream, puis{" "}
              <strong className="font-semibold text-zinc-200">ouvre la fiche</strong> pour découvrir bio et réseaux avant
              de rejoindre le live.
            </p>
          </div>
          <Link href="/lives" className={`${theme.btnSecondary} shrink-0`}>
            Voir tous les lives TENF
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {loadingLive ? (
          <div className={`${theme.emptyState} p-8 text-sm`}>
            On synchronise les vignettes Twitch…
          </div>
        ) : liveShowcaseMembers.length > 0 ? (
          <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3 2xl:grid-cols-4">
            {liveShowcaseMembers.map((member) => {
              const stream = member.stream!;
              const followBadge = getFollowBadge(member.followState);
              const thumb = twitchPreviewUrl(stream.thumbnailUrl);
              return (
                <div key={member.twitchLogin} className="min-w-[min(100%,340px)] shrink-0 snap-center sm:min-w-0">
                  <MembresDirectoryMemberCard
                    displayName={member.displayName}
                    twitchLogin={member.twitchLogin}
                    avatarSrc={member.avatar || `https://placehold.co/128x128?text=${encodeURIComponent(member.displayName.charAt(0))}`}
                    primaryGame={`${stream.gameName || "Just Chatting"} · ${stream.viewerCount ?? 0} spectateur·rice·s`}
                    posterSrc={thumb}
                    posterAlt={`Aperçu du live de ${member.displayName}`}
                    description={stream.title?.trim() || undefined}
                    followCorner={
                      showFollowStatuses ? (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${followBadge.className}`} title={followBadge.label}>
                          {followBadge.icon}
                        </span>
                      ) : undefined
                    }
                    badgeRow={
                      <>
                        <span className="rounded-full border border-red-500/45 bg-red-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-100">
                          Live
                        </span>
                        {publicRoleBadgeNode(member.role, { grid: true })}
                      </>
                    }
                    onOpenProfile={() => handleMemberClick(member)}
                    twitchUrl={`https://www.twitch.tv/${member.twitchLogin}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${theme.emptyState} p-8`}>
            <p className="text-sm leading-relaxed">
              Personne n’est en live pour l’instant. Rafraîchis plus tard ou{" "}
              <button type="button" className={`${theme.linkAccent} font-bold`} onClick={() => openRandomMember()}>
                tire un profil au hasard
              </button>
              .
            </p>
          </div>
        )}
        </div>
      </section>

      {/* Découverte personnalisée (connecté + Twitch lié) ou sélection du jour */}
      {showFollowStatuses ? (
        <section className={`${theme.panel} ${theme.panelDiscover} ${theme.panelPadding} space-y-5`}>
          <div className={theme.panelOrbViolet} aria-hidden />
          <div className={`${theme.panelInner} space-y-5`}>
          <div>
            <h2 className={theme.sectionTitle}>Des chaînes que tu ne suis pas encore</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              On compare ton compte Twitch aux membres TENF : voici des profils sur lesquels tu n'as pas encore cliqué
              sur « suivre ». Ce n'est pas une obligation — juste une façon ludique de sortir de ta bulle et de
              découvrir des voisin·es de réseau.
            </p>
          </div>
          {discoverForYouMembers.length > 0 ? (
            <>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300/80">
                  Trois cartes tirées pour te faire envie
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {discoverForYouTopMembers.map((member) => {
                    const followBadge = getFollowBadge(member.followState);
                    return (
                      <MembresDirectoryMemberCard
                        key={`discover-top-${member.twitchLogin}`}
                        displayName={member.displayName}
                        twitchLogin={member.twitchLogin}
                        avatarSrc={member.avatar || `https://placehold.co/128x128?text=${encodeURIComponent(member.displayName.charAt(0))}`}
                        primaryGame={member.primaryGame}
                        description={member.description?.trim()}
                        followCorner={
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${followBadge.className}`} title={followBadge.label}>
                            {followBadge.icon}
                          </span>
                        }
                        badgeRow={
                          <>
                            {publicRoleBadgeNode(member.role, {
                              grid: true,
                              affiliated: member.isAffiliated,
                              development: member.isDevelopment,
                            })}
                            {member.activity !== "normal" ? (
                              <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                                Semaine chargée
                              </span>
                            ) : null}
                          </>
                        }
                        onOpenProfile={() => handleMemberClick(member)}
                        twitchUrl={`https://www.twitch.tv/${member.twitchLogin}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Raccourcis vers {discoverForYouMembers.length} profil{discoverForYouMembers.length > 1 ? "s" : ""} — clic = fiche TENF
                </p>
                <div className={`${theme.glassInset} p-4`}>
                  <div className="flex flex-wrap gap-2">
                    {discoverForYouMembers.map((member) => (
                      <div
                        key={`discover-all-${member.login}`}
                        className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] pl-1 pr-1 transition hover:border-emerald-400/35"
                      >
                        <button
                          type="button"
                          onClick={() => handleMemberClick(member)}
                          className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-emerald-500/12"
                        >
                          <img
                            src={member.avatar || `https://placehold.co/32x32?text=${member.displayName.charAt(0)}`}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover ring-1 ring-violet-500/30"
                          />
                          {member.displayName}
                          {member.activity === "live" ? (
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Souvent live en ce moment" />
                          ) : null}
                        </button>
                        <a
                          href={`https://www.twitch.tv/${member.twitchLogin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                          title="Ouvrir Twitch dans un nouvel onglet"
                          aria-label={`Chaîne Twitch de ${member.displayName}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={theme.noticeSuccess}>
              Tu suivais déjà une très grande partie des créateurs TENF — explore la grille ou{" "}
              <button type="button" className={`${theme.linkAccent} font-bold`} onClick={() => openRandomMember()}>
                tire au sort
              </button>
              .
            </div>
          )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className={theme.sectionTitle}>Pépites du jour (sans connexion Twitch)</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Tu navigues en invité·e : on te propose quand même une petite sélection pour te donner envie de fouiller
              les fiches. Connecte-toi avec Discord et lie Twitch pour débloquer le fil{" "}
              <strong className="font-semibold text-zinc-200">« chaînes que tu ne suis pas encore »</strong>.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {discoverTodayMembers.map((member) => (
              <MembresDirectoryMemberCard
                key={`fallback-${member.twitchLogin}`}
                displayName={member.displayName}
                twitchLogin={member.twitchLogin}
                avatarSrc={member.avatar || `https://placehold.co/128x128?text=${encodeURIComponent(member.displayName.charAt(0))}`}
                primaryGame={member.primaryGame}
                description={member.description?.trim()}
                badgeRow={
                  <>
                    {publicRoleBadgeNode(member.role, {
                      grid: true,
                      affiliated: member.isAffiliated,
                      development: member.isDevelopment,
                    })}
                    {member.activity !== "normal" ? (
                      <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                        Actif·ve cette semaine
                      </span>
                    ) : null}
                  </>
                }
                onOpenProfile={() => handleMemberClick(member)}
                twitchUrl={`https://www.twitch.tv/${member.twitchLogin}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Nouveaux membres — accueil chaleureux */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={theme.sectionTitle}>Nouveaux dans la communauté</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Intégrations récentes (30 derniers jours) : un super endroit pour passer dire bonjour et découvrir des
              chaînes toutes fraîches. Chaque fiche résume le style de stream et les liens utiles.
            </p>
          </div>
          {recentIntegratedMembers.length > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-200">
              <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
              {recentIntegratedMembers.length} arrivée{recentIntegratedMembers.length > 1 ? "s" : ""} ce mois-ci
            </span>
          ) : null}
        </div>

        {recentIntegratedMembers.length > 0 ? (
          <div className={`${theme.panel} ${theme.panelPadding}`}>
            <div className={`${theme.panelInner} grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`}>
              {recentIntegratedMembers.map((member) => (
                <MembresDirectoryMemberCard
                  key={`recent-integrated-${member.login}`}
                  density="compact"
                  displayName={member.displayName}
                  twitchLogin={member.twitchLogin}
                  avatarSrc={member.avatar || `https://placehold.co/96x96?text=${encodeURIComponent(member.displayName.charAt(0))}`}
                  primaryGame={member.primaryGame}
                  description={member.description?.trim()}
                  badgeRow={
                    <>
                      {publicRoleBadgeNode(member.role, {
                        grid: true,
                        affiliated: member.isAffiliated,
                        development: member.isDevelopment,
                      })}
                      {member.activity !== "normal" ? (
                        <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                          Belle dynamique
                        </span>
                      ) : null}
                    </>
                  }
                  onOpenProfile={() => handleMemberClick(member)}
                  twitchUrl={`https://www.twitch.tv/${member.twitchLogin}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`${theme.emptyState} text-sm`}>
            Pas d’arrivée très récente — explore la grille ou lance un tirage au sort.
          </div>
        )}
      </section>

      {/* Recherche + filtres */}
      <section className={`${theme.panel} ${theme.panelPadding} space-y-4`} aria-labelledby="explorer-title">
        <div className={theme.panelInner}>
        <div>
          <h2 id="explorer-title" className="text-lg font-bold text-white sm:text-xl">
            Explorer toute la communauté
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Filtre par rôle, cherche un jeu ou un mot dans la bio — puis ouvre les fiches qui t'intriguent. Tout
            fonctionne sans connexion ; certains filtres s'enrichissent une fois que tu as lié ton compte Twitch.
          </p>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pseudo Twitch, jeu, mot-clé dans la bio…"
            aria-label="Rechercher un membre par pseudo, jeu ou mot-clé"
            className={`${theme.field} py-3 pl-10 pr-4 text-sm`}
          />
          {searchQuery ? (
            <p className="mt-1.5 pl-1 text-xs text-zinc-500">
              Recherche dans les pseudos, les noms d'affichage, les jeux et les bios.
            </p>
          ) : null}
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>button]:snap-start sm:flex-wrap sm:overflow-visible"
          role="group"
          aria-label="Filtrer les membres par rôle"
        >
          {FILTERS.map((filter) => {
            const disabled = filter.key === "discover" && !showFollowStatuses;
            const tooltip = disabled
              ? "Lie ton compte Twitch pour utiliser ce filtre"
              : filter.hint;
            const isActive = activeFilter === filter.key && !disabled;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => !disabled && setActiveFilter(filter.key)}
                disabled={disabled}
                title={tooltip}
                aria-pressed={isActive}
                aria-label={disabled ? `${filter.label} — ${tooltip}` : filter.label}
                className={`${theme.pill} shrink-0 ${isActive ? theme.pillActive : ""}`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        </div>
      </section>

      {/* Grille complète */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={theme.sectionTitle}>Annuaire complet</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              <strong className="font-semibold text-zinc-200">
                {filteredMembers.length} profil{filteredMembers.length > 1 ? "s" : ""}
              </strong>{" "}
              après filtres — clique sur « Ouvrir la fiche » pour la vue détaillée (bio, réseaux, statut follow si tu
              es connecté·e).
            </p>
          </div>
          {filteredMembers.length > 0 ? (
            <span className={`${theme.matchBanner} self-start sm:self-end`}>
              <Users className="h-3.5 w-3.5" aria-hidden />
              Staff d&apos;abord, puis mélange aléatoire
            </span>
          ) : null}
        </div>

        {loading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16"
            role="status"
            aria-live="polite"
          >
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"
              aria-hidden
            />
            <p className="text-sm text-zinc-500">Chargement des créateurs TENF…</p>
          </div>
        ) : visibleMembers.length === 0 ? (
          <div className={`${theme.emptyState} p-10`}>
            <p className="text-sm leading-relaxed">
              Aucun résultat. Essaie un mot plus court, ou{" "}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className={`${theme.linkAccent} font-bold`}
              >
                réinitialise les filtres
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleMembers.map((member) => {
                const followBadge = getFollowBadge(member.followState);
                return (
                  <MembresDirectoryMemberCard
                    key={member.twitchLogin}
                    displayName={member.displayName}
                    twitchLogin={member.twitchLogin}
                    avatarSrc={member.avatar || `https://placehold.co/128x128?text=${encodeURIComponent(member.displayName.charAt(0))}`}
                    primaryGame={member.primaryGame}
                    description={member.description?.trim()}
                    followCorner={
                      showFollowStatuses ? (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${followBadge.className}`} title={followBadge.label}>
                          {followBadge.icon} <span className="sr-only">{followBadge.label}</span>
                        </span>
                      ) : undefined
                    }
                    badgeRow={
                      <>
                        {publicRoleBadgeNode(member.role, {
                          grid: true,
                          affiliated: member.isAffiliated,
                          development: member.isDevelopment,
                        })}
                        {member.activity !== "normal" ? (
                          <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "rgba(239,68,68,0.45)", color: "#fca5a5" }}>
                            Actif·ve en ce moment
                          </span>
                        ) : null}
                        <span
                          className="rounded-full border px-2 py-0.5"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                          {getPlanningLabel(member.planningStatus)}
                        </span>
                      </>
                    }
                    onOpenProfile={() => handleMemberClick(member)}
                    twitchUrl={`https://www.twitch.tv/${member.twitchLogin}`}
                  />
                );
              })}
            </div>

            {hasMoreMembers ? (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
                  className={`${theme.btnSecondary} min-h-[48px]`}
                >
                  Afficher {Math.min(LOAD_MORE_COUNT, filteredMembers.length - visibleCount)} profils de plus
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </button>
              </div>
            ) : (
              <p className="pt-2 text-center text-xs text-zinc-500">
                Tu as parcouru tous les profils correspondant à ta recherche. Tu peux changer de filtre, ou tirer un
                profil au sort plus bas.
              </p>
            )}
          </>
        )}
      </section>

      {/* Tirage au sort — même ton que le hero */}
      <section className={`${theme.panel} ${theme.panelPaddingLg} relative text-center`}>
        <div className={theme.panelOrbViolet} aria-hidden />
        <div className={theme.panelOrbGreen} aria-hidden />
        <div className={theme.panelInner}>
        <Shuffle className="mx-auto h-10 w-10 text-emerald-300" aria-hidden />
        <h2 className={`${theme.sectionTitle} mt-4`}>Pas d&apos;idée ? Laisse le hasard choisir</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
          Un clic ouvre une fiche parmi tes filtres actuels — idéal pour sortir de ta zone de confort.
        </p>
        <button type="button" onClick={() => openRandomMember(filteredMembers)} className={`${theme.btnPrimary} mt-6 min-h-[48px]`}>
          <Shuffle className="h-4 w-4" aria-hidden />
          Tirer un profil au hasard
        </button>
        <p className="mt-4 text-[11px] uppercase tracking-wider text-emerald-300/70">
          Parmi {filteredMembers.length} profil{filteredMembers.length > 1 ? "s" : ""} filtré{filteredMembers.length > 1 ? "s" : ""}
        </p>
        </div>
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
    </div>
  );
}

/* ================================================================ */
/* Sous-composant : carte statistique du hero                        */
/* ================================================================ */

type HeroStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  tone: "violet" | "amber" | "red";
  live?: boolean;
};

function HeroStatCard({ icon: Icon, label, value, caption, tone, live }: HeroStatCardProps) {
  const accent =
    tone === "violet" ? "#c4b5fd" : tone === "amber" ? "#6ee7b7" : "#f87171";
  const iconColor =
    tone === "violet" ? "text-violet-400" : tone === "amber" ? "text-emerald-400" : "text-red-400";
  return (
    <div
      className={theme.statPill}
      style={{
        borderColor: `color-mix(in srgb, ${accent} 32%, rgba(255,255,255,0.1))`,
        background: `color-mix(in srgb, ${accent} 8%, rgba(255,255,255,0.03))`,
        padding: "1rem 1.15rem",
      }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
        <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
        {label}
        {live ? (
          <span className="relative ml-auto flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs leading-snug text-zinc-400">{caption}</p>
    </div>
  );
}
