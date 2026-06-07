export type RaidEntry = {
  id: string;
  source: "manual" | "raids_sub";
  eventAt: string;
  targetLogin: string;
  targetLabel: string;
  viewers: number | null;
  raidStatus: "validated" | "pending" | "rejected";
  raidStatusLabel: string;
  pointsStatus: "awarded" | "pending";
  pointsStatusLabel: string;
  note: string | null;
};

export type RaidHistoryResponse = {
  month: string;
  months: string[];
  entries: RaidEntry[];
  summary: {
    total: number;
    validated: number;
    pending: number;
    rejected: number;
    pointsAwarded: number;
    pointsPending: number;
  };
};

export type RaidFilter = "all" | "validated" | "pending" | "rejected";

export type ReturnPendingSuggestion = {
  login: string;
  label: string;
  receivedCount: number;
  lastReceivedAt: string;
};

export type ReturnPendingMeta = {
  monthsScanned: number;
  uniqueRaidersReceived: number;
  pendingReturnTotal: number;
  displayedCount?: number;
  sampleRandomized?: boolean;
  sampleMax?: number;
  truncated?: boolean;
  explanation?: string;
};

export const RAID_HISTORY_ACCENT = "#f59e0b";

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(key: string): string {
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${monthNames[monthIndex] || "Mois"} ${key.split("-")[0]}`;
}

export function statusRaidBadge(status: RaidEntry["raidStatus"]) {
  if (status === "validated") return { border: "rgba(52,211,153,0.45)", bg: "rgba(52,211,153,0.12)", color: "#34d399" };
  if (status === "rejected") return { border: "rgba(248,113,113,0.45)", bg: "rgba(248,113,113,0.12)", color: "#f87171" };
  return { border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.12)", color: "#facc15" };
}

export function statusPointsBadge(status: RaidEntry["pointsStatus"]) {
  if (status === "awarded") return { border: "rgba(96,165,250,0.45)", bg: "rgba(96,165,250,0.12)", color: "#93c5fd" };
  return { border: "rgba(167,139,250,0.45)", bg: "rgba(167,139,250,0.12)", color: "#c4b5fd" };
}

export function sourceBadge(source: RaidEntry["source"]) {
  if (source === "manual") {
    return { label: "Tu l'as déclaré", short: "Déclaration", border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.12)", color: "#fde68a" };
  }
  return { label: "Détecté pour toi", short: "Auto", border: "rgba(96,165,250,0.45)", bg: "rgba(96,165,250,0.12)", color: "#93c5fd" };
}

export function formatRaidDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function twitchChannelUrl(login: string): string | null {
  const clean = login.trim().toLowerCase();
  if (!clean || clean === "inconnu") return null;
  return `https://www.twitch.tv/${clean}`;
}

export function normalizeRaidSearch(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export const RAID_FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 backdrop-blur-sm transition focus:border-amber-500/45 focus:outline-none focus:ring-2 focus:ring-amber-500/15";
