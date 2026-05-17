"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  HeartHandshake,
  Info,
  LayoutGrid,
  List,
  Loader2,
  Radio,
  RefreshCcw,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import MemberModal from "@/components/MemberModal";

type PublicPlanning = {
  id: string;
  date: string;
  time: string;
  endTime?: string;
  liveType: string;
  title?: string;
  twitchLogin: string;
  displayName: string;
  avatarUrl?: string;
  twitchUrl?: string;
};

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const QUICK_RANGES = [
  { key: "today", label: "Aujourd'hui", hint: "Les lives du jour" },
  { key: "week", label: "Cette semaine", hint: "Du lundi au dimanche" },
  { key: "weekend", label: "Ce week-end", hint: "Samedi & dimanche" },
  { key: "month", label: "Vue calendrier", hint: "Grille du mois complet" },
] as const;
type FollowState = "followed" | "not_followed" | "unknown";

type QuickRange = (typeof QUICK_RANGES)[number]["key"];
type ViewMode = "calendar" | "agenda";

/**
 * Wrapper fluide : la page contrôle ses propres marges intérieures pour
 * utiliser tout l'espace disponible à droite de la sidebar membre et
 * rester scalable au zoom navigateur.
 */
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--cal-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--cal-px)",
  paddingRight: "var(--cal-px)",
  paddingTop: "clamp(0.75rem, 1.5vw, 1.5rem)",
  paddingBottom: "clamp(2rem, 3vw, 3.5rem)",
};

const PAGE_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getLiveTypeTone(liveType: string): { dot: string; chipStyle: CSSProperties } {
  const normalized = normalizeText(liveType || "");
  if (normalized.includes("fortnite") || normalized.includes("gaming") || normalized.includes("jeu")) {
    return { dot: "#f59e0b", chipStyle: { borderColor: "rgba(245,158,11,0.45)", color: "#fcd34d" } };
  }
  if (normalized.includes("just chatting") || normalized.includes("discussion")) {
    return { dot: "#60a5fa", chipStyle: { borderColor: "rgba(96,165,250,0.45)", color: "#bfdbfe" } };
  }
  if (normalized.includes("musique") || normalized.includes("karaoke")) {
    return { dot: "#f472b6", chipStyle: { borderColor: "rgba(244,114,182,0.45)", color: "#f9a8d4" } };
  }
  if (normalized.includes("formation") || normalized.includes("coach")) {
    return { dot: "#34d399", chipStyle: { borderColor: "rgba(52,211,153,0.45)", color: "#6ee7b7" } };
  }
  return { dot: "#a78bfa", chipStyle: { borderColor: "rgba(167,139,250,0.45)", color: "#ddd6fe" } };
}

function getCalendarEventTheme(liveType: string): {
  background: string;
  border: string;
  text: string;
  glow: string;
} {
  const normalized = normalizeText(liveType || "");

  if (normalized.includes("irl") || normalized.includes("faq")) {
    return {
      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(45, 212, 191, 0.10))",
      border: "rgba(110, 231, 183, 0.58)",
      text: "#d1fae5",
      glow: "0 8px 22px rgba(16, 185, 129, 0.18)",
    };
  }
  if (normalized.includes("league") || normalized.includes("lol")) {
    return {
      background: "linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(59, 130, 246, 0.12))",
      border: "rgba(125, 211, 252, 0.56)",
      text: "#e0f2fe",
      glow: "0 8px 22px rgba(56, 189, 248, 0.2)",
    };
  }
  if (normalized.includes("vod") || normalized.includes("review") || normalized.includes("analyse")) {
    return {
      background: "linear-gradient(135deg, rgba(245, 158, 11, 0.26), rgba(234, 88, 12, 0.10))",
      border: "rgba(253, 186, 116, 0.56)",
      text: "#ffedd5",
      glow: "0 8px 20px rgba(245, 158, 11, 0.18)",
    };
  }
  if (normalized.includes("just chatting") || normalized.includes("chat")) {
    return {
      background: "linear-gradient(135deg, rgba(168, 85, 247, 0.30), rgba(99, 102, 241, 0.12))",
      border: "rgba(196, 181, 253, 0.58)",
      text: "#ede9fe",
      glow: "0 8px 24px rgba(168, 85, 247, 0.2)",
    };
  }
  if (normalized.includes("communaute") || normalized.includes("community")) {
    return {
      background: "linear-gradient(135deg, rgba(14, 165, 233, 0.28), rgba(168, 85, 247, 0.10))",
      border: "rgba(147, 197, 253, 0.56)",
      text: "#e0f2fe",
      glow: "0 8px 22px rgba(14, 165, 233, 0.18)",
    };
  }

  return {
    background: "linear-gradient(135deg, rgba(145, 70, 255, 0.26), rgba(59, 130, 246, 0.10))",
    border: "rgba(167, 139, 250, 0.56)",
    text: "#ede9fe",
    glow: "0 8px 24px rgba(145, 70, 255, 0.2)",
  };
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeekMonday(date: Date): Date {
  const day = (date.getDay() + 6) % 7;
  return addDays(startOfDay(date), -day);
}

function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarUrl(item: PublicPlanning): string {
  const start = parseDateTime(item.date, item.time);
  const end = item.endTime ? parseDateTime(item.date, item.endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const title = `${item.displayName} - ${item.title || item.liveType || "Live TENF"}`;
  const description = [
    item.title ? `Titre: ${item.title}` : null,
    item.liveType ? `Categorie: ${item.liveType}` : null,
    `Chaine: ${item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}`,
    "Découvert sur le calendrier TENF.",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: description,
    location: item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getAvatarFallback(name: string): string {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return `https://placehold.co/80x80?text=${encodeURIComponent(initial)}`;
}

function getUnavatarUrl(login: string): string {
  return `https://unavatar.io/twitch/${encodeURIComponent((login || "").toLowerCase())}`;
}

const CALENDAR_MODAL_BANNER =
  "Tu es sur le calendrier public TENF : ce créneau vient du planning partagé par le créateur. La fiche réunit bio, autres dates annoncées et réseaux — idéal pour préparer ta veille avant d'ouvrir Twitch.";

function publicApiMemberToModalPayload(
  member: Record<string, unknown> | undefined,
  planning: PublicPlanning,
  followStatus: FollowState | undefined
): ComponentProps<typeof MemberModal>["member"] {
  const login = String(planning.twitchLogin || "").trim();
  const twitchUrl = planning.twitchUrl || `https://www.twitch.tv/${login}`;
  const displayName = (member?.displayName as string | undefined) || planning.displayName;
  const role = (member?.role as string | undefined) || "Membre";
  const avatar =
    (member?.avatar as string | undefined) || planning.avatarUrl || getUnavatarUrl(login);
  const planningHint = planning.title
    ? `Créneau annoncé : ${planning.title} (${planning.liveType}).`
    : `Créneau « ${planning.liveType} » — vu sur le calendrier communautaire.`;
  const description =
    (member?.description as string | undefined)?.trim() ||
    planningHint ||
    `Membre ${role} de la communauté TENF.`;

  const instagram = member?.instagram as string | undefined;
  const twitter = member?.twitter as string | undefined;
  const tiktok = member?.tiktok as string | undefined;
  const discordId = member?.discordId as string | undefined;

  return {
    id: login,
    name: displayName,
    role,
    avatar,
    twitchLogin: login,
    description,
    twitchUrl,
    discordId,
    isVip: member?.isVip === true,
    vipBadge: typeof member?.vipBadge === "string" ? member.vipBadge : undefined,
    badges: Array.isArray(member?.badges) ? (member.badges as string[]) : [],
    socials: {
      discord: discordId ? `https://discord.com/users/${discordId}` : undefined,
      instagram: instagram
        ? instagram.startsWith("http")
          ? instagram
          : `https://instagram.com/${instagram.replace(/^@/, "")}`
        : undefined,
      twitter: twitter ? (twitter.startsWith("http") ? twitter : `https://twitter.com/${twitter.replace(/^@/, "")}`) : undefined,
      tiktok: tiktok ? (tiktok.startsWith("http") ? tiktok : `https://tiktok.com/@${tiktok.replace(/^@/, "")}`) : undefined,
    },
    followStatus,
    mainGame: planning.liveType || "Communauté",
    isAffiliated: role === "Affilié",
    isLive: false,
    isActiveThisWeek: true,
    planningStatus: "shared",
    streamTags: [planning.liveType].filter(Boolean),
  };
}

export default function CalendrierLivesPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [itemsByMonth, setItemsByMonth] = useState<Record<string, PublicPlanning[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<QuickRange>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [reloadKey, setReloadKey] = useState(0);

  const [publicMembersByLogin, setPublicMembersByLogin] = useState<Record<string, Record<string, unknown>>>({});
  const [followStatuses, setFollowStatuses] = useState<Record<string, FollowState>>({});
  const [showFollowStatuses, setShowFollowStatuses] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalMember, setCalendarModalMember] = useState<ComponentProps<typeof MemberModal>["member"] | null>(
    null
  );

  const todayDate = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => dateKey(todayDate), [todayDate]);

  const rangeBounds = useMemo(() => {
    if (activeRange === "today") {
      return { start: startOfDay(todayDate), end: endOfDay(todayDate) };
    }

    if (activeRange === "week") {
      const start = startOfWeekMonday(todayDate);
      const end = endOfDay(addDays(start, 6));
      return { start, end };
    }

    if (activeRange === "weekend") {
      const weekStart = startOfWeekMonday(todayDate);
      const saturday = addDays(weekStart, 5);
      const sunday = addDays(weekStart, 6);
      return { start: startOfDay(saturday), end: endOfDay(sunday) };
    }

    const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const end = endOfDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0));
    return { start, end };
  }, [activeRange, monthCursor, todayDate]);

  const requiredMonths = useMemo(() => {
    const keys = new Set<string>();
    keys.add(monthKey(monthCursor));
    keys.add(monthKey(rangeBounds.start));
    keys.add(monthKey(rangeBounds.end));
    keys.add(monthKey(todayDate));
    return [...keys];
  }, [monthCursor, rangeBounds.end, rangeBounds.start, todayDate]);

  useEffect(() => {
    let cancelled = false;
    async function loadPublicMembers() {
      try {
        const response = await fetch("/api/members/public", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (cancelled || !Array.isArray(data.members)) return;
        const map: Record<string, Record<string, unknown>> = {};
        for (const m of data.members as Record<string, unknown>[]) {
          const k = String(m.twitchLogin || "").toLowerCase();
          if (k) map[k] = m;
        }
        setPublicMembersByLogin(map);
      } catch {
        /* optionnel */
      }
    }
    loadPublicMembers();
    return () => {
      cancelled = true;
    };
  }, []);

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
        const raw = (data?.statuses || {}) as Record<string, { state?: FollowState }>;
        const normalized: Record<string, FollowState> = {};
        for (const [login, entry] of Object.entries(raw)) {
          normalized[login.toLowerCase()] = entry?.state || "unknown";
        }
        setFollowStatuses(normalized);
        setShowFollowStatuses(true);
      } catch {
        setFollowStatuses({});
        setShowFollowStatuses(false);
      }
    }
    loadFollowStatuses();
  }, []);

  const openPlanningMemberModal = useCallback(
    (item: PublicPlanning) => {
      const key = String(item.twitchLogin || "").toLowerCase();
      const full = publicMembersByLogin[key];
      const followState = showFollowStatuses ? followStatuses[key] || "unknown" : undefined;
      setCalendarModalMember(publicApiMemberToModalPayload(full, item, followState));
      setCalendarModalOpen(true);
    },
    [followStatuses, publicMembersByLogin, showFollowStatuses]
  );

  useEffect(() => {
    async function loadMonths() {
      setLoading(true);
      setError(null);

      try {
        const missingMonths = requiredMonths.filter((key) => !itemsByMonth[key]);
        if (missingMonths.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(
          missingMonths.map(async (key) => {
            const response = await fetch(`/api/members/public/stream-plannings?month=${key}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "Impossible de charger le calendrier.");
            }
            return { key, items: (data.items || []) as PublicPlanning[] };
          })
        );

        setItemsByMonth((prev) => {
          const next = { ...prev };
          for (const entry of responses) {
            next[entry.key] = entry.items;
          }
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    }

    loadMonths();
  }, [itemsByMonth, requiredMonths, reloadKey]);

  const allLoadedItems = useMemo(() => Object.values(itemsByMonth).flat(), [itemsByMonth]);

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, PublicPlanning[]>();
    for (const item of allLoadedItems) {
      const when = parseDateTime(item.date, item.time);
      if (when < rangeBounds.start || when > rangeBounds.end) {
        continue;
      }
      const current = grouped.get(item.date) || [];
      current.push(item);
      grouped.set(item.date, current);
    }
    for (const [, dateItems] of grouped) {
      dateItems.sort((a, b) => a.time.localeCompare(b.time));
    }
    return grouped;
  }, [allLoadedItems, rangeBounds.end, rangeBounds.start]);

  const monthCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offsetMonday = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((offsetMonday + daysInMonth) / 7) * 7;

    const cells: Array<{ key: string; date: Date | null }> = [];
    for (let i = 0; i < totalCells; i += 1) {
      const day = i - offsetMonday + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push({ key: `empty-${i}`, date: null });
      } else {
        const date = new Date(year, month, day);
        cells.push({ key: dateKey(date), date });
      }
    }
    return cells;
  }, [monthCursor]);

  const allRangeItems = useMemo(() => [...itemsByDate.values()].flat(), [itemsByDate]);

  const dateDensity = useMemo(() => {
    const entries = [...itemsByDate.entries()].map(([key, dayItems]) => ({ key, count: dayItems.length }));
    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [itemsByDate]);

  const topDate = dateDensity[0];

  const uniqueCreators = useMemo(
    () => new Set(allRangeItems.map((item) => item.twitchLogin.toLowerCase())).size,
    [allRangeItems]
  );

  const uniqueCategories = useMemo(
    () => new Set(allRangeItems.map((item) => item.liveType.trim()).filter(Boolean)).size,
    [allRangeItems]
  );

  const topLiveTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of allRangeItems) {
      const key = item.liveType?.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  }, [allRangeItems]);

  const upcomingLives = useMemo(() => {
    const nowMs = Date.now();
    return allRangeItems
      .map((item) => ({ ...item, atMs: parseDateTime(item.date, item.time).getTime() }))
      .filter((item) => item.atMs >= nowMs)
      .sort((a, b) => a.atMs - b.atMs)
      .slice(0, 5);
  }, [allRangeItems]);

  useEffect(() => {
    if (selectedDateKey && itemsByDate.has(selectedDateKey)) return;

    if (itemsByDate.has(todayKey)) {
      setSelectedDateKey(todayKey);
      return;
    }

    const nextDate = [...itemsByDate.keys()].sort()[0] || null;
    setSelectedDateKey(nextDate);
  }, [itemsByDate, selectedDateKey, todayKey]);

  const selectedDayItems = selectedDateKey ? itemsByDate.get(selectedDateKey) || [] : [];
  const selectedDayLabel = selectedDateKey
    ? new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : null;
  const todayItems = itemsByDate.get(todayKey) || [];
  const todayCreators = useMemo(
    () => [...new Set(todayItems.map((item) => item.displayName))],
    [todayItems]
  );

  const selectedDayByTime = useMemo(() => {
    const grouped = new Map<string, PublicPlanning[]>();
    for (const item of selectedDayItems) {
      const current = grouped.get(item.time) || [];
      current.push(item);
      grouped.set(item.time, current);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [selectedDayItems]);

  const isOnCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      monthCursor.getFullYear() === now.getFullYear() &&
      monthCursor.getMonth() === now.getMonth()
    );
  }, [monthCursor]);

  const handleRetry = useCallback(() => {
    setItemsByMonth({});
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="relative" style={PAGE_OUTER_STYLE}>
      <div style={PAGE_INNER_STYLE} className="space-y-6 pb-16 md:pb-8 md:space-y-8">
        {/* ─────────────────────────────  HERO  ──────────────────────────── */}
        <section
          aria-labelledby="calendrier-hero-title"
          className="relative overflow-hidden rounded-3xl border border-violet-500/30 p-5 sm:p-7 lg:p-10"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.97]"
            style={{
              background:
                "linear-gradient(125deg, rgba(12,10,18,0.98) 0%, rgba(42,22,62,0.94) 48%, rgba(20,14,32,0.97) 100%)",
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-600/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-[-8%] h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                  Le planning de la family
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Visible par tout le monde — connecté ou non
                </span>
              </div>
              <h1
                id="calendrier-hero-title"
                className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl xl:text-[2.85rem]"
              >
                Le calendrier des{" "}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
                  lives TENF
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                Ici, les créateurs et créatrices de la{" "}
                <strong className="font-semibold text-white">New Family</strong> annoncent leurs créneaux pour qu'on
                puisse passer les soutenir, raid, ou simplement venir partager un bon moment. Clique sur un jour
                ou un créneau, ouvre une{" "}
                <strong className="font-semibold text-violet-200">fiche TENF</strong> et tu retrouves la bio, les
                réseaux et le reste du planning — comme une vraie boussole communautaire.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRange("today");
                    setViewMode("agenda");
                    setSelectedDateKey(todayKey);
                  }}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(124,58,237,0.42)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  <CalendarCheck className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden />
                  Les lives d'aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRange("week");
                    setViewMode("agenda");
                  }}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-violet-400/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                >
                  <List className="h-4 w-4 text-violet-300" aria-hidden />
                  Ma semaine
                </button>
                <Link
                  href="/lives"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-400/40 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/60"
                >
                  <Radio className="h-4 w-4 text-red-400" aria-hidden />
                  Lives en direct
                </Link>
                <Link
                  href="/membres"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                >
                  <Users className="h-4 w-4 text-violet-300" aria-hidden />
                  Annuaire des membres
                </Link>
              </div>
            </div>

            <div
              className="grid grid-cols-2 gap-3"
              role="list"
              aria-label="Statistiques de la plage affichée"
            >
              <StatCard
                role="listitem"
                icon={<Clock className="h-3.5 w-3.5 text-violet-300" aria-hidden />}
                label="Créneaux affichés"
                value={allRangeItems.length}
              />
              <StatCard
                role="listitem"
                icon={<Users className="h-3.5 w-3.5 text-emerald-300" aria-hidden />}
                label="Créateurs·rices"
                value={uniqueCreators}
              />
              <StatCard
                role="listitem"
                icon={<LayoutGrid className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
                label="Catégories"
                value={uniqueCategories}
              />
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-amber-400/40">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-200/90">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Jour phare
                </p>
                <p className="mt-2 text-sm font-bold leading-snug text-white">
                  {topDate
                    ? `${new Date(`${topDate.key}T00:00:00`).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })} · ${topDate.count} créneau${topDate.count > 1 ? "x" : ""}`
                    : "Pas encore de pic — bientôt !"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────  GUIDE 3 ÉTAPES  ─────────────────────── */}
        <section
          aria-labelledby="calendrier-howto-title"
          className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-5 sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
                <Compass className="h-4 w-4" aria-hidden />
              </span>
              <h2 id="calendrier-howto-title" className="text-base font-bold text-white sm:text-lg">
                Comment ça marche, en 3 secondes
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Pas besoin de compte pour explorer · les fiches s'enrichissent quand tu es connecté·e
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HowToCard
              step={1}
              title="Choisis ta fenêtre"
              text="Aujourd'hui, la semaine, le week-end, ou la grille du mois entier — tu pioches selon ton humeur."
            />
            <HowToCard
              step={2}
              title="Repère les créneaux"
              text="Chaque case ou ligne d'agenda montre l'horaire, la catégorie et le pseudo Twitch annoncés."
            />
            <HowToCard
              step={3}
              title="Ouvre une fiche TENF"
              text="Tu y trouves la bio du créateur, ses réseaux et son planning complet — prêt à raid ou à follow."
            />
          </ol>
        </section>

        {/* ─────────────────────  PÉRIODE & AFFICHAGE  ─────────────────────── */}
        <section
          aria-labelledby="calendrier-filters-title"
          className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="calendrier-filters-title" className="text-base font-bold text-white sm:text-lg">
                Période & affichage
              </h2>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                Choisis la fenêtre temporelle qui te parle, puis bascule entre la grille mensuelle (vue d'ensemble) et la liste par jour (lecture facile).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div
                className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="Plage temporelle"
              >
                {QUICK_RANGES.map((range) => {
                  const isActive = activeRange === range.key;
                  return (
                    <button
                      key={range.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      title={range.hint}
                      onClick={() => {
                        setActiveRange(range.key);
                        if (range.key === "month") {
                          setViewMode("calendar");
                        } else {
                          setViewMode("agenda");
                        }
                      }}
                      className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 ${
                        isActive
                          ? "bg-violet-500/25 text-white ring-1 ring-violet-400/45 shadow-[0_8px_24px_rgba(124,58,237,0.2)]"
                          : "border border-white/12 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
              <div
                className="flex shrink-0 gap-2 rounded-xl border border-white/10 bg-black/30 p-1"
                role="tablist"
                aria-label="Type d'affichage"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "calendar"}
                  onClick={() => setViewMode("calendar")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-400/70 ${
                    viewMode === "calendar" ? "bg-violet-500/30 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Mois
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "agenda"}
                  onClick={() => setViewMode("agenda")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-400/70 ${
                    viewMode === "agenda" ? "bg-violet-500/30 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <List className="h-4 w-4" aria-hidden />
                  Agenda
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-400">Actif :</span>{" "}
            {QUICK_RANGES.find((range) => range.key === activeRange)?.label}
            <span className="mx-2 text-zinc-600">·</span>
            <span className="font-semibold text-zinc-400">Vue :</span>{" "}
            {viewMode === "calendar" ? "grille du mois affiché ci-dessous" : "liste de tous les jours de la plage"}
          </p>
        </section>

        {/* ───────────  PROCHAINS CRÉNEAUX + AUJOURD'HUI  ─────────── */}
        <section
          aria-labelledby="calendrier-next-title"
          className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr] xl:gap-6"
        >
          <div
            className="rounded-3xl border border-white/10 p-4 transition md:p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="calendrier-next-title" className="text-lg font-black text-white md:text-xl">
                  Les prochains créneaux annoncés
                </h2>
                <p className="mt-1 text-xs text-zinc-500 md:text-sm">
                  Clique sur une ligne pour mettre ce jour en lumière dans la grille — ou ouvre direct la fiche TENF.
                </p>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-200">
                Top 5 à venir
              </span>
            </div>
            {upcomingLives.length === 0 ? (
              <EmptyHint
                title="Aucun créneau futur dans cette plage"
                description="Personne n'a (encore) annoncé sur cette fenêtre. Essaie d'élargir la période, change de mois — ou file voir qui est en live tout de suite."
                actionHref="/lives"
                actionLabel="Voir les lives en direct"
              />
            ) : (
              <div className="space-y-3">
                {upcomingLives.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-violet-400/35 hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDateKey(item.date)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 rounded-xl"
                      aria-label={`Mettre en avant le ${new Date(`${item.date}T00:00:00`).toLocaleDateString("fr-FR")} (${item.displayName}, ${item.time})`}
                    >
                      <img
                        src={item.avatarUrl || getUnavatarUrl(item.twitchLogin)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full border-2 border-violet-500/20 object-cover ring-2 ring-transparent transition group-hover:ring-violet-400/40"
                        style={{ borderColor: "var(--color-border)" }}
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).src = getAvatarFallback(item.displayName);
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{item.displayName}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          · {item.time} · {item.liveType}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openPlanningMemberModal(item)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 sm:flex-none"
                        aria-label={`Voir la fiche TENF de ${item.displayName}`}
                      >
                        <User className="h-3.5 w-3.5" aria-hidden />
                        Fiche TENF
                      </button>
                      <a
                        href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70 sm:flex-none"
                        aria-label={`Ouvrir la chaîne Twitch de ${item.displayName}`}
                      >
                        Twitch
                        <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside
            aria-label="Résumé du jour"
            className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-black/30 to-fuchsia-950/20 p-5 shadow-[0_16px_48px_rgba(88,28,135,0.15)]"
          >
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300">
              <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
              Aujourd'hui
            </p>
            <h3 className="mt-2 text-xl font-black capitalize text-white">
              {new Date(`${todayKey}T00:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300/90">
              {todayItems.length > 0
                ? `${todayItems.length} créneau${todayItems.length > 1 ? "x" : ""} avec ${new Set(todayItems.map((i) => i.twitchLogin)).size} créateur${new Set(todayItems.map((i) => i.twitchLogin)).size > 1 ? "·rices" : ""} sur la fenêtre choisie. Y a de quoi faire 💜`
                : "Rien d'affiché ici pour aujourd'hui dans cette plage. C'est juste que la family n'a pas (encore) publié — ou que la fenêtre est ailleurs. Tu peux élargir la période."}
            </p>
            {todayCreators.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {todayCreators.slice(0, 6).map((creator) => (
                  <span
                    key={creator}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-zinc-200"
                  >
                    {creator}
                  </span>
                ))}
                {todayCreators.length > 6 ? (
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-zinc-500">
                    +{todayCreators.length - 6}
                  </span>
                ) : null}
              </div>
            ) : null}
            {todayItems.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveRange("today");
                  setViewMode("agenda");
                  setSelectedDateKey(todayKey);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Voir le détail du jour
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <Link
                href="/lives"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:border-red-400/50 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
              >
                <Radio className="h-4 w-4 text-red-300" aria-hidden />
                Voir qui est en live
              </Link>
            )}
          </aside>
        </section>

        {/* ─────────────────────  NAVIGATION DU MOIS  ─────────────────────── */}
        <section
          aria-label="Navigation du mois"
          className="rounded-2xl border p-4 md:p-5"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            background: "linear-gradient(145deg, rgba(145,70,255,0.1), rgba(16,16,22,0.9) 40%, rgba(16,16,22,0.95))",
            boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Mois précédent
            </button>
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-center text-xl font-black capitalize tracking-tight text-white sm:text-2xl">
                {monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </h2>
              {!isOnCurrentMonth ? (
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                    setActiveRange("month");
                    setViewMode("calendar");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-200 transition hover:bg-violet-500/20"
                >
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  Revenir à aujourd'hui
                </button>
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-300/80">Mois en cours</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
              aria-label="Mois suivant"
            >
              Mois suivant
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <MiniStat
              accent="rgba(145,70,255,0.35)"
              bg="rgba(145,70,255,0.12)"
              label="Lives sur la plage"
              value={allRangeItems.length}
            />
            <MiniStat
              accent="rgba(52,211,153,0.35)"
              bg="rgba(52,211,153,0.12)"
              label="Créateurs·rices actifs"
              value={uniqueCreators}
            />
            <MiniStat
              accent="rgba(96,165,250,0.35)"
              bg="rgba(96,165,250,0.12)"
              label="Catégories visibles"
              value={uniqueCategories}
            />
          </div>

          {topLiveTypes.length > 0 ? (
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="list"
              aria-label="Catégories populaires"
            >
              {topLiveTypes.map((entry) => {
                const tone = getLiveTypeTone(entry.label);
                return (
                  <span
                    key={`live-type-${entry.label}`}
                    role="listitem"
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
                    style={tone.chipStyle}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.dot }} />
                    {entry.label} • {entry.count}
                  </span>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* ─────────────────────  CALENDRIER / AGENDA  ─────────────────────── */}
        <section
          aria-labelledby="calendrier-grid-title"
          className="rounded-3xl border border-white/10 p-4 md:p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 id="calendrier-grid-title" className="sr-only">
            {viewMode === "calendar" ? "Grille calendrier du mois" : "Liste des créneaux par jour"}
          </h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-14">
              <Loader2 className="h-10 w-10 animate-spin text-violet-400" aria-hidden />
              <p className="text-sm font-medium text-zinc-300">On rassemble les plannings de la family…</p>
              <p className="-mt-2 text-xs text-zinc-500">
                Ça prend rarement plus de quelques secondes 💜
              </p>
              <div className="grid w-full max-w-md grid-cols-7 gap-2 opacity-40">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={`sk-${i}`} className="h-16 animate-pulse rounded-lg bg-zinc-700/80" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-10 text-center">
              <Info className="h-9 w-9 text-red-300" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-red-100">Le calendrier n'a pas réussi à se charger</p>
                <p className="mt-1 text-xs text-red-200/80">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-bold text-red-50 transition hover:bg-red-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/60"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden />
                Réessayer
              </button>
            </div>
          ) : viewMode === "agenda" ? (
            <div className="space-y-3">
              {[...itemsByDate.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([dayKey, dayItems]) => (
                  <div
                    key={dayKey}
                    className="rounded-xl border p-3 transition-all duration-300 md:p-4"
                    style={{
                      borderColor: selectedDateKey === dayKey ? "rgba(145,70,255,0.55)" : "var(--color-border)",
                      backgroundColor: selectedDateKey === dayKey ? "rgba(145,70,255,0.08)" : "var(--color-surface)",
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedDateKey(dayKey)}
                        className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 rounded-md"
                      >
                        <p className="text-sm font-semibold capitalize" style={{ color: "var(--color-text)" }}>
                          {new Date(`${dayKey}T00:00:00`).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {dayItems.length} créneau{dayItems.length > 1 ? "x" : ""}
                        </p>
                      </button>
                    </div>
                    <div className="space-y-2 border-l-2 border-violet-500/35 pl-3">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 transition hover:border-violet-400/35 sm:flex-row sm:items-center sm:justify-between"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                              <span className="mr-2 inline-flex items-center gap-1 rounded-md border border-violet-500/35 bg-violet-500/10 px-1.5 py-0.5 text-[11px] text-violet-200">
                                <Clock className="h-3 w-3" aria-hidden />
                                {item.time}
                              </span>
                              {item.displayName}
                            </p>
                            <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              {item.liveType}
                              {item.title ? ` · ${item.title}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openPlanningMemberModal(item)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                              aria-label={`Voir la fiche TENF de ${item.displayName}`}
                            >
                              <User className="h-3.5 w-3.5" aria-hidden />
                              Fiche TENF
                            </button>
                            <a
                              href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                              aria-label={`Ouvrir la chaîne Twitch de ${item.displayName}`}
                            >
                              Twitch
                              <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {itemsByDate.size === 0 ? (
                <EmptyHint
                  title="Aucun créneau sur cette plage"
                  description="Personne n'a (encore) annoncé ici. Change de fenêtre temporelle ou consulte un autre mois — ou viens dire bonjour aux créateurs et créatrices déjà en live."
                  actionHref="/lives"
                  actionLabel="Voir les lives en direct"
                />
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="rounded-lg border py-2 text-center text-xs font-semibold"
                  style={{
                    color: "var(--color-text-secondary)",
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  {day}
                </div>
              ))}

              {monthCells.map((cell) => {
                if (!cell.date) {
                  return (
                    <div
                      key={cell.key}
                      className="min-h-[126px] rounded-xl border"
                      style={{ borderColor: "var(--color-border)", opacity: 0.22 }}
                    />
                  );
                }

                const key = dateKey(cell.date);
                const dayItems = itemsByDate.get(key) || [];
                const isSelected = selectedDateKey === key;
                const isToday = key === todayKey;
                const isTopDay = key === topDate?.key;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    aria-label={`${cell.date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}${dayItems.length > 0 ? ` — ${dayItems.length} créneau${dayItems.length > 1 ? "x" : ""}` : " — aucun créneau"}`}
                    aria-pressed={isSelected}
                    className="group min-h-[140px] rounded-xl border p-2.5 text-left transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_28px_rgba(124,58,237,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
                    style={{
                      borderColor: isSelected ? "rgba(145,70,255,0.65)" : isTopDay ? "rgba(145,70,255,0.45)" : "var(--color-border)",
                      backgroundColor: isSelected ? "rgba(145,70,255,0.14)" : isTopDay ? "rgba(145,70,255,0.08)" : "var(--color-surface)",
                      boxShadow: isTopDay ? "0 10px 20px rgba(145,70,255,0.15)" : "0 4px 12px rgba(0,0,0,0.12)",
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                        {cell.date.getDate()}
                      </div>
                      {isToday ? (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          Aujourd'hui
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      {dayItems.length > 0 ? (
                        dayItems.slice(0, 2).map((item) => {
                          const theme = getCalendarEventTheme(item.liveType);
                          return (
                            <button
                              key={`mini-${item.id}`}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openPlanningMemberModal(item);
                              }}
                              title={`Fiche ${item.displayName} · ${item.time}`}
                              aria-label={`Ouvrir la fiche de ${item.displayName} (${item.time}, ${item.liveType})`}
                              className="w-full rounded-md border px-1.5 py-1 text-left text-[10px] leading-tight transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70"
                              style={{
                                borderColor: theme.border,
                                background: theme.background,
                                color: theme.text,
                                boxShadow: theme.glow,
                              }}
                            >
                              <p className="font-semibold">{item.time}</p>
                              <p className="mt-0.5 line-clamp-1">{item.liveType}</p>
                              <p className="line-clamp-1 opacity-90">{item.title || item.displayName}</p>
                            </button>
                          );
                        })
                      ) : (
                        <div className="min-h-[58px]" />
                      )}
                      {dayItems.length > 2 ? (
                        <div className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
                          +{dayItems.length - 2} autre{dayItems.length - 2 > 1 ? "s" : ""}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ─────────────────────  DÉTAIL DU JOUR  ─────────────────────── */}
        <section
          aria-labelledby="calendrier-detail-title"
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-[var(--color-card)] to-black/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-7"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="calendrier-detail-title" className="text-xl font-black text-white md:text-2xl">
                {selectedDateKey ? (
                  <>
                    Détail ·{" "}
                    <span className="capitalize bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                      {selectedDayLabel}
                    </span>
                  </>
                ) : (
                  "Choisis un jour dans la grille"
                )}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-400">
                Les cartes regroupent les streams au même horaire — pratique pour repérer un raid ou suivre un duo. Ouvre une fiche pour la bio et les autres dates annoncées.
              </p>
            </div>
            {selectedDateKey ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-100">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {selectedDayItems.length} créneau{selectedDayItems.length > 1 ? "x" : ""}
              </span>
            ) : null}
          </div>

          {!selectedDateKey || selectedDayByTime.length === 0 ? (
            <EmptyHint
              title="Rien à montrer pour ce jour"
              description="Soit la fenêtre temporelle filtre cette date, soit personne n'a publié de créneau ici. Essaie un autre jour, ou passe la vue en « Mois » pour balayer plus large."
              variant="dashed"
            />
          ) : (
            <div className="space-y-6">
              {selectedDayByTime.map(([time, timeItems]) => (
                <div key={time}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/35 bg-violet-500/10 px-2.5 py-1 text-xs font-black text-violet-100">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {time}
                    </span>
                    <span className="text-sm font-semibold text-zinc-300">
                      {timeItems.length} stream{timeItems.length > 1 ? "s" : ""} prévu{timeItems.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {timeItems.map((item) => (
                      <article
                        key={item.id}
                        className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-violet-400/45 hover:shadow-[0_18px_44px_rgba(88,28,135,0.28)]"
                        style={{
                          borderColor: "var(--color-border)",
                          boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => openPlanningMemberModal(item)}
                            className="relative shrink-0 rounded-full ring-2 ring-violet-500/20 transition hover:ring-violet-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                            title="Ouvrir la fiche TENF"
                            aria-label={`Ouvrir la fiche TENF de ${item.displayName}`}
                          >
                            <img
                              src={item.avatarUrl || getUnavatarUrl(item.twitchLogin)}
                              alt=""
                              className="h-14 w-14 rounded-full border border-white/10 object-cover"
                              onError={(event) => {
                                (event.currentTarget as HTMLImageElement).src = getAvatarFallback(item.displayName);
                              }}
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => openPlanningMemberModal(item)}
                              className="text-left font-bold text-white transition hover:text-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-400/60 rounded"
                            >
                              {item.displayName}
                            </button>
                            <div className="text-xs text-zinc-500">@{item.twitchLogin}</div>
                            <div className="mt-2 inline-flex rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                              {item.liveType}
                            </div>
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-snug text-zinc-400">
                          {item.title || "Live communautaire TENF — viens dire coucou 💜"}
                        </p>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => openPlanningMemberModal(item)}
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 px-4 py-2 text-xs font-bold text-violet-50 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                          >
                            <User className="h-4 w-4" aria-hidden />
                            Ouvrir la fiche TENF
                          </button>
                          <a
                            href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/60"
                          >
                            Chaîne Twitch
                            <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                          </a>
                          <a
                            href={buildGoogleCalendarUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
                          >
                            Ajouter à Google
                            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─────────────────────  CTA COMMUNAUTÉ  ─────────────────────── */}
        <section
          aria-labelledby="calendrier-cta-title"
          className="overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-black/40 to-fuchsia-950/30 p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300">
                <HeartHandshake className="h-4 w-4 text-fuchsia-300" aria-hidden />
                L'esprit TENF
              </p>
              <h2
                id="calendrier-cta-title"
                className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl"
              >
                Annoncer son live, c'est déjà un acte d'entraide
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                Tu publies ton créneau → la family sait quand venir te soutenir. Tu regardes ce calendrier → tu sais où raid, à qui dire bonjour, comment construire ta veille hebdo. Pas de classement, pas de pression : juste un planning partagé qui rend la communauté plus vivante.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Link
                href="/postuler"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Sparkles className="h-4 w-4 text-violet-700" aria-hidden />
                Rejoindre la family
              </Link>
              <Link
                href="/lives"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-red-400/40 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
              >
                <Radio className="h-4 w-4 text-red-300" aria-hidden />
                Voir qui est en live maintenant
              </Link>
            </div>
          </div>
        </section>
      </div>

      {calendarModalMember ? (
        <MemberModal
          member={calendarModalMember}
          isOpen={calendarModalOpen}
          contextBanner={CALENDAR_MODAL_BANNER}
          primaryTwitchLabel="Ouvrir Twitch"
          onClose={() => {
            setCalendarModalOpen(false);
            setCalendarModalMember(null);
          }}
        />
      ) : null}
    </div>
  );
}

// ─────────────────────────  SOUS-COMPOSANTS UI  ───────────────────────────

function StatCard({
  icon,
  label,
  value,
  role,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  role?: string;
}) {
  return (
    <div
      role={role}
      className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:bg-black/40"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function MiniStat({
  accent,
  bg,
  label,
  value,
}: {
  accent: string;
  bg: string;
  label: string;
  value: number | string;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5"
      style={{ borderColor: accent, backgroundColor: bg }}
    >
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </div>
  );
}

function HowToCard({ step, title, text }: { step: number; title: string; text: string }) {
  return (
    <li className="group relative flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.05]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-sm font-black text-violet-100 ring-1 ring-violet-400/30">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{text}</p>
      </div>
    </li>
  );
}

function EmptyHint({
  title,
  description,
  actionHref,
  actionLabel,
  variant = "soft",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: "soft" | "dashed";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl px-4 py-8 text-center ${
        variant === "dashed"
          ? "border border-dashed border-white/15 bg-black/20"
          : "border border-white/10 bg-white/[0.02]"
      }`}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/12 text-violet-200">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <div className="max-w-md">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
