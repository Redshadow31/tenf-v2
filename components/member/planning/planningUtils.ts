export type StreamPlanning = {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type QuickListFilterMode = "all" | "upcoming7" | "past";

export type StreamForm = {
  date: string;
  time: string;
  liveType: string;
  title: string;
};

export const LIVE_TYPE_SUGGESTIONS = [
  "Just Chatting",
  "Valorant",
  "League of Legends",
  "IRL",
  "Review VOD",
  "Session communauté",
];

export const WEEKDAY_OPTIONS = [
  { value: 1, shortLabel: "Lun", longLabel: "Lundi" },
  { value: 2, shortLabel: "Mar", longLabel: "Mardi" },
  { value: 3, shortLabel: "Mer", longLabel: "Mercredi" },
  { value: 4, shortLabel: "Jeu", longLabel: "Jeudi" },
  { value: 5, shortLabel: "Ven", longLabel: "Vendredi" },
  { value: 6, shortLabel: "Sam", longLabel: "Samedi" },
  { value: 0, shortLabel: "Dim", longLabel: "Dimanche" },
];

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultDateTime(): Pick<StreamForm, "date" | "time"> {
  const now = new Date();
  const rounded = new Date(now.getTime() + 30 * 60 * 1000);
  rounded.setMinutes(rounded.getMinutes() >= 30 ? 30 : 0, 0, 0);
  return {
    date: toLocalIsoDate(rounded),
    time: `${String(rounded.getHours()).padStart(2, "0")}:${String(rounded.getMinutes()).padStart(2, "0")}`,
  };
}

export function formatPresetDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return toLocalIsoDate(date);
}

export function addDaysToIsoDate(isoDate: string, daysToAdd: number): string {
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  const localDate = new Date(year, (month || 1) - 1, day || 1);
  localDate.setDate(localDate.getDate() + daysToAdd);
  return toLocalIsoDate(localDate);
}

export function getWeekdayFromIsoDate(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  return new Date(year, (month || 1) - 1, day || 1).getDay();
}

export function buildSlotsToCreate(
  date: string,
  time: string,
  weeks: number,
  selectedWeekdays: number[],
): Array<{ date: string; time: string }> {
  if (!date || !time) return [];
  const normalizedWeeks = Math.max(1, Math.min(12, weeks));
  const normalizedWeekdays = Array.from(new Set(selectedWeekdays)).filter((day) => day >= 0 && day <= 6);
  if (normalizedWeekdays.length === 0) return [];

  const maxDays = normalizedWeeks * 7;
  const slots: Array<{ date: string; time: string }> = [];
  for (let offset = 0; offset < maxDays; offset += 1) {
    const candidateDate = addDaysToIsoDate(date, offset);
    if (!normalizedWeekdays.includes(getWeekdayFromIsoDate(candidateDate))) continue;
    slots.push({ date: candidateDate, time });
  }
  return slots;
}

export function isPastSlot(date: string, time: string): boolean {
  if (!date || !time) return false;
  const candidate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(candidate.getTime())) return false;
  return candidate.getTime() < Date.now();
}

export function formatDateTimeFr(isoDateTime?: string): string {
  if (!isoDateTime) return "Date d'ajout inconnue";
  const value = new Date(isoDateTime);
  if (Number.isNaN(value.getTime())) return "Date d'ajout inconnue";
  return value.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeLiveType(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getLiveTypeTheme(liveType: string): {
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accent: string;
} {
  const normalized = normalizeLiveType(liveType);
  if (normalized.includes("valorant") || normalized.includes("fps")) {
    return {
      badgeBg: "rgba(239, 68, 68, 0.14)",
      badgeBorder: "rgba(248, 113, 113, 0.42)",
      badgeText: "#fecaca",
      accent: "#ef4444",
    };
  }
  if (normalized.includes("league") || normalized.includes("lol")) {
    return {
      badgeBg: "rgba(59, 130, 246, 0.14)",
      badgeBorder: "rgba(96, 165, 250, 0.42)",
      badgeText: "#bfdbfe",
      accent: "#3b82f6",
    };
  }
  if (normalized.includes("irl")) {
    return {
      badgeBg: "rgba(16, 185, 129, 0.14)",
      badgeBorder: "rgba(52, 211, 153, 0.42)",
      badgeText: "#a7f3d0",
      accent: "#10b981",
    };
  }
  if (normalized.includes("just chatting") || normalized.includes("chat")) {
    return {
      badgeBg: "rgba(168, 85, 247, 0.14)",
      badgeBorder: "rgba(192, 132, 252, 0.42)",
      badgeText: "#e9d5ff",
      accent: "#a855f7",
    };
  }
  if (normalized.includes("vod") || normalized.includes("review") || normalized.includes("analyse")) {
    return {
      badgeBg: "rgba(245, 158, 11, 0.14)",
      badgeBorder: "rgba(251, 191, 36, 0.42)",
      badgeText: "#fde68a",
      accent: "#f59e0b",
    };
  }
  return {
    badgeBg: "rgba(145, 70, 255, 0.14)",
    badgeBorder: "rgba(167, 139, 250, 0.42)",
    badgeText: "#ddd6fe",
    accent: "#9146ff",
  };
}

export function getRelativeDateLabel(isoDate: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  if (diffDays > 1) return `Dans ${diffDays} jours`;
  return `Il y a ${Math.abs(diffDays)} jours`;
}

export function filterQuickListItems(
  plannings: StreamPlanning[],
  query: string,
  mode: QuickListFilterMode,
): StreamPlanning[] {
  const normalizedQuery = query.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 7);

  return plannings.filter((planning) => {
    const date = new Date(`${planning.date}T00:00:00`);
    const byMode =
      mode === "all"
        ? true
        : mode === "upcoming7"
          ? date >= today && date <= inSevenDays
          : date < today;

    if (!byMode) return false;
    if (!normalizedQuery) return true;

    const haystack = `${planning.date} ${planning.time} ${planning.liveType} ${planning.title || ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function countUpcomingPlannings(plannings: StreamPlanning[], withinDays = 7): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(today.getDate() + withinDays);

  return plannings.filter((planning) => {
    const date = new Date(`${planning.date}T00:00:00`);
    return date >= today && date <= limit;
  }).length;
}

export function getNextPlanningLabel(plannings: StreamPlanning[]): string {
  const upcoming = plannings
    .filter((p) => !isPastSlot(p.date, p.time))
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime(),
    );
  const next = upcoming[0];
  if (!next) return "Aucun live";
  const dt = new Date(`${next.date}T${next.time}:00`);
  return `${dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${next.time}`;
}

export const PLANNING_ACCENT = "#9146ff";

export const PLANNING_FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 backdrop-blur-sm transition focus:border-violet-500/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60";
