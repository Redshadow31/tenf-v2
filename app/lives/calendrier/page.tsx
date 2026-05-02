"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LayoutGrid,
  List,
  Loader2,
  Radio,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type CSSProperties } from "react";
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
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "weekend", label: "Ce week-end" },
  { key: "month", label: "Vue calendrier" },
] as const;
type FollowState = "followed" | "not_followed" | "unknown";

type QuickRange = (typeof QUICK_RANGES)[number]["key"];
type ViewMode = "calendar" | "agenda";

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
  "Tu es sur le calendrier public TENF : ce créneau vient du planning partagé par le créateur. La fiche réunit bio, autres dates annoncées et réseaux — idéal pour préparer ta veille avant d’ouvrir Twitch.";

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
  }, [itemsByMonth, requiredMonths]);

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
  const topDateItems = topDate ? itemsByDate.get(topDate.key) || [] : [];

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

  return (
    <div className="relative space-y-8 pb-24 md:pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/30 p-6 md:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.97]"
          style={{
            background:
              "linear-gradient(125deg, rgba(12,10,18,0.98) 0%, rgba(42,22,62,0.94) 48%, rgba(20,14,32,0.97) 100%)",
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-600/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-[-8%] h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />

        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                Planning communautaire
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Public & membres TENF</span>
            </div>
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.65rem]">
              Calendrier des{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
                lives annoncés
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
              Les créateurs publient leurs créneaux pour que tout le monde puisse s’organiser : curieux·ses, viewers réguliers ou membres de la{" "}
              <strong className="font-semibold text-white">New Family</strong>. Clique une case ou une ligne d’agenda, puis ouvre une{" "}
              <strong className="font-semibold text-violet-200">fiche TENF</strong> pour voir bio, réseaux et tout le planning chargé pour cette chaîne.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveRange("today");
                  setViewMode("agenda");
                  setSelectedDateKey(todayKey);
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(124,58,237,0.42)] transition hover:brightness-110"
              >
                <CalendarDays className="h-4 w-4" aria-hidden />
                Aujourd’hui
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRange("week");
                  setViewMode("agenda");
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-violet-400/35"
              >
                <List className="h-4 w-4 text-violet-300" aria-hidden />
                Agenda semaine
              </button>
              <Link
                href="/lives"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-400/30 hover:bg-red-500/10"
              >
                <Radio className="h-4 w-4 text-red-400" aria-hidden />
                Lives en direct
              </Link>
              <Link
                href="/membres"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/30"
              >
                <Users className="h-4 w-4 text-violet-300" aria-hidden />
                Annuaire
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm transition hover:border-violet-400/25">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <Clock className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                Créneaux affichés
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-white">{allRangeItems.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm transition hover:border-violet-400/25">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                Créateurs
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-white">{uniqueCreators}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm transition hover:border-violet-400/25">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <LayoutGrid className="h-3.5 w-3.5 text-sky-400" aria-hidden />
                Catégories
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-white">{uniqueCategories}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/90">Jour le plus chargé</p>
              <p className="mt-2 text-sm font-bold leading-snug text-white">
                {topDate
                  ? `${new Date(`${topDate.key}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} · ${topDate.count} créneau${topDate.count > 1 ? "x" : ""}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">Période & affichage</h2>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Choisis une fenêtre temporelle, puis bascule entre la grille mensuelle et la liste par jour.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_RANGES.map((range) => {
                const isActive = activeRange === range.key;
                return (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => {
                      setActiveRange(range.key);
                      if (range.key === "month") {
                        setViewMode("calendar");
                      } else {
                        setViewMode("agenda");
                      }
                    }}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
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
            <div className="flex shrink-0 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                  viewMode === "calendar" ? "bg-violet-500/30 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Mois
              </button>
              <button
                type="button"
                onClick={() => setViewMode("agenda")}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          className="rounded-3xl border border-white/10 p-4 md:p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white md:text-xl">Prochains créneaux</h2>
              <p className="mt-1 text-xs text-zinc-500 md:text-sm">Clique sur une ligne pour highlights ce jour — ou ouvre direct la fiche.</p>
            </div>
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-200">
              Top 5
            </span>
          </div>
          {upcomingLives.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun créneau futur dans la plage sélectionnée — élargis la période ou change de mois.</p>
          ) : (
            <div className="space-y-3">
              {upcomingLives.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-violet-400/30 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(item.date)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img
                      src={item.avatarUrl || getUnavatarUrl(item.twitchLogin)}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full border-2 border-violet-500/20 object-cover ring-2 ring-transparent transition hover:ring-violet-400/40"
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
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25 sm:flex-none"
                    >
                      <User className="h-3.5 w-3.5" aria-hidden />
                      Fiche
                    </button>
                    <a
                      href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 sm:flex-none"
                    >
                      Twitch
                      <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-black/30 to-fuchsia-950/20 p-5 shadow-[0_16px_48px_rgba(88,28,135,0.15)]">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300">
            <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
            Aujourd’hui
          </p>
          <h3 className="mt-2 text-xl font-black capitalize text-white">
            {new Date(`${todayKey}T00:00:00`).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {todayItems.length > 0
              ? `${todayItems.length} créneau${todayItems.length > 1 ? "x" : ""} avec ${new Set(todayItems.map((i) => i.twitchLogin)).size} créateur${new Set(todayItems.map((i) => i.twitchLogin)).size > 1 ? "s" : ""} dans la fenêtre affichée.`
              : "Rien d’afficé pour la date du jour dans cette plage — ça arrive si les créateurs n’ont pas encore publié ou si tu filtres un autre intervalle."}
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
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100"
            >
              Voir le détail du jour
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </section>

      <div
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
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Mois précédent
          </button>
          <h2 className="text-center text-xl font-black capitalize tracking-tight text-white sm:text-2xl">
            {monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </h2>
          <button
            type="button"
            onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10"
          >
            Mois suivant
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "rgba(145,70,255,0.12)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Lives sur la plage</p>
            <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{allRangeItems.length}</p>
          </div>
          <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: "rgba(52,211,153,0.35)", backgroundColor: "rgba(52,211,153,0.12)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Createurs actifs</p>
            <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{uniqueCreators}</p>
          </div>
          <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: "rgba(96,165,250,0.35)", backgroundColor: "rgba(96,165,250,0.12)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Categories en direct</p>
            <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>{uniqueCategories}</p>
          </div>
        </div>

        {topLiveTypes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {topLiveTypes.map((entry) => {
              const tone = getLiveTypeTone(entry.label);
              return (
                <span
                  key={`live-type-${entry.label}`}
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
      </div>

      <div
        className="rounded-3xl border border-white/10 p-4 md:p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-14">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" aria-hidden />
            <p className="text-sm font-medium text-zinc-400">Synchronisation des plannings membres…</p>
            <div className="grid w-full max-w-md grid-cols-7 gap-2 opacity-40">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={`sk-${i}`} className="h-16 animate-pulse rounded-lg bg-zinc-700/80" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8" style={{ color: "#ef4444" }}>
            {error}
          </div>
        ) : viewMode === "agenda" ? (
          <div className="space-y-3">
            {[...itemsByDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dayKey, dayItems]) => (
              <div
                key={dayKey}
                className="rounded-xl border p-3 md:p-4 transition-all duration-300"
                style={{
                  borderColor: selectedDateKey === dayKey ? "rgba(145,70,255,0.55)" : "var(--color-border)",
                  backgroundColor: selectedDateKey === dayKey ? "rgba(145,70,255,0.08)" : "var(--color-surface)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(dayKey)}
                    className="text-left"
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
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25"
                        >
                          <User className="h-3.5 w-3.5" aria-hidden />
                          Fiche TENF
                        </button>
                        <a
                          href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
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
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Aucun créneau sur cette plage — change de période ou consulte un autre mois.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold py-2 rounded-lg border"
                style={{ color: "var(--color-text-secondary)", borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                {day}
              </div>
            ))}

            {monthCells.map((cell) => {
              if (!cell.date) {
                return (
                  <div key={cell.key} className="min-h-[126px] rounded-xl border" style={{ borderColor: "var(--color-border)", opacity: 0.22 }} />
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
                  className="group min-h-[140px] rounded-xl border p-2.5 text-left transition-all duration-300 hover:-translate-y-[1px]"
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
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
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
                            className="w-full rounded-md border px-1.5 py-1 text-left text-[10px] leading-tight transition hover:brightness-110 active:scale-[0.98]"
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
                        +{dayItems.length - 2} autre(s)
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[var(--color-card)] to-black/20 p-5 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white md:text-2xl">
              {selectedDateKey ? `Détail · ${selectedDayLabel}` : "Choisis un jour dans la grille"}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              Les cartes regroupent les streams au même horaire. Ouvre une fiche pour la bio complète et le planning Twitch chargé dans la modale.
            </p>
          </div>
          {selectedDateKey ? (
            <span className="rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-100">
              {selectedDayItems.length} créneau{selectedDayItems.length > 1 ? "x" : ""}
            </span>
          ) : null}
        </div>

        {!selectedDateKey || selectedDayByTime.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
            Aucun créneau ce jour-là dans la plage affichée — essaie un autre jour ou élargis la période (semaine / mois).
          </p>
        ) : (
          <div className="space-y-6">
            {selectedDayByTime.map(([time, timeItems]) => (
              <div key={time}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/35 bg-violet-500/10 px-2.5 py-1 text-xs font-black text-violet-100">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {time}
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">
                    {timeItems.length} stream{timeItems.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {timeItems.map((item) => (
                    <article
                      key={item.id}
                      className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-violet-400/35 hover:shadow-[0_16px_40px_rgba(88,28,135,0.2)]"
                      style={{
                        borderColor: "var(--color-border)",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => openPlanningMemberModal(item)}
                          className="relative shrink-0 rounded-full ring-2 ring-violet-500/20 transition hover:ring-violet-400/50"
                          title="Ouvrir la fiche TENF"
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
                            className="text-left font-bold text-white transition hover:text-violet-200"
                          >
                            {item.displayName}
                          </button>
                          <div className="text-xs text-zinc-500">@{item.twitchLogin}</div>
                          <div className="mt-2 inline-flex rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                            {item.liveType}
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-snug text-zinc-400">{item.title || "Live communautaire TENF"}</p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => openPlanningMemberModal(item)}
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 px-4 py-2 text-xs font-bold text-violet-50 transition hover:brightness-110"
                        >
                          <User className="h-4 w-4" aria-hidden />
                          Ouvrir la fiche TENF
                        </button>
                        <a
                          href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
                        >
                          Chaîne Twitch
                          <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                        </a>
                        <a
                          href={buildGoogleCalendarUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/5"
                        >
                          Google Calendar
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

