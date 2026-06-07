import { formatVocalDurationFr } from "@/lib/discordActivityVocal";

export const DISCORD_ACTIVITY_ACCENT = "#5865F2";

export type DiscordMonthRow = {
  month: string;
  messages: number;
  vocalMinutes: number;
  vocalDisplay: string;
  vocalHoursDecimal: number;
};

export type DiscordActivityTotals = {
  totalMessages: number;
  totalVocalMinutes: number;
  totalVocalHours: number;
  activeMonthCount: number;
  trackedMonthCount: number;
  bestMonth: DiscordMonthRow | null;
};

export type DiscordActivitySortMode = "recent" | "activity";

export type DiscordActivityLoadState = "loading" | "error" | "empty" | "unmatched" | "ready";

export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function formatMonthShort(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export function computeDiscordTotals(months: DiscordMonthRow[]): DiscordActivityTotals {
  const totalMessages = months.reduce((sum, row) => sum + row.messages, 0);
  const totalVocalMinutes = months.reduce((sum, row) => sum + row.vocalMinutes, 0);
  const activeMonthCount = months.filter((row) => row.messages > 0 || row.vocalMinutes > 0).length;
  const best = months.reduce<{ row: DiscordMonthRow | null; score: number }>(
    (acc, row) => {
      const score = row.messages + row.vocalMinutes / 45;
      if (score > acc.score) return { row, score };
      return acc;
    },
    { row: null, score: 0 },
  );

  return {
    totalMessages,
    totalVocalMinutes,
    totalVocalHours: Math.round((totalVocalMinutes / 60) * 10) / 10,
    activeMonthCount,
    trackedMonthCount: months.length,
    bestMonth: best.row && best.score > 0 ? best.row : null,
  };
}

export function resolveLoadState(input: {
  loading: boolean;
  error: string | null;
  months: DiscordMonthRow[];
}): DiscordActivityLoadState {
  if (input.loading) return "loading";
  if (input.error) return "error";
  if (input.months.length === 0) return "empty";
  if (!input.months.some((row) => row.messages > 0 || row.vocalMinutes > 0)) return "unmatched";
  return "ready";
}

export function filterAndSortMonths(
  months: DiscordMonthRow[],
  onlyActiveMonths: boolean,
  sortMode: DiscordActivitySortMode,
): DiscordMonthRow[] {
  let list = onlyActiveMonths ? months.filter((row) => row.messages > 0 || row.vocalMinutes > 0) : [...months];
  if (sortMode === "recent") {
    list.sort((a, b) => b.month.localeCompare(a.month));
  } else {
    list.sort((a, b) => {
      const score = (row: DiscordMonthRow) => row.messages + row.vocalMinutes / 30;
      return score(b) - score(a) || b.month.localeCompare(a.month);
    });
  }
  return list;
}

export function timelineAscendingMonths(months: DiscordMonthRow[], onlyActiveMonths: boolean): DiscordMonthRow[] {
  const base = onlyActiveMonths ? months.filter((row) => row.messages > 0 || row.vocalMinutes > 0) : [...months];
  return base.sort((a, b) => a.month.localeCompare(b.month));
}

export function formatVocalSummary(minutes: number): string {
  return formatVocalDurationFr(minutes);
}
