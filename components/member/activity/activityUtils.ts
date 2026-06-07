import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";

export const ACTIVITY_ACCENT = "#f97316";

export const EMPTY_ACTIVITY_STATS = {
  raidsThisMonth: 0,
  raidsTotal: 0,
  eventPresencesThisMonth: 0,
  participationThisMonth: 0,
  formationsValidated: 0,
  formationsValidatedThisMonth: 0,
};

export function formatMonthShort(key: string): string {
  if (!key) return "";
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const [year] = key.split("-");
  return `${short[monthIndex] || "?"} ${year}`;
}

export function formatMonthLabel(key: string): string {
  if (!key) return "";
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const names = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const [year] = key.split("-");
  return `${names[monthIndex] || "Mois"} ${year}`;
}

export function formatIsoShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function categoryAccent(category: string): { bg: string; text: string; border: string } {
  const c = category.toLowerCase();
  if (c.includes("formation")) return { bg: "rgba(56, 189, 248, 0.14)", text: "#7dd3fc", border: "rgba(56, 189, 248, 0.35)" };
  if (c.includes("spotlight")) return { bg: "rgba(167, 139, 250, 0.18)", text: "#e9d5ff", border: "rgba(167, 139, 250, 0.4)" };
  if (c.includes("film")) return { bg: "rgba(244, 114, 182, 0.14)", text: "#f9a8d4", border: "rgba(244, 114, 182, 0.35)" };
  if (c.includes("jeu") || c.includes("gaming")) return { bg: "rgba(167, 139, 250, 0.12)", text: "#c4b5fd", border: "rgba(167, 139, 250, 0.3)" };
  return { bg: "rgba(148, 163, 184, 0.12)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.3)" };
}

export function computeIntensityScore(input: {
  eventPresences: number;
  participation: number;
  raidsLive: number;
  formationsThisMonth: number;
}): number {
  const clampPct = (n: number, max: number) => (max <= 0 ? 0 : Math.min(100, Math.round((n / max) * 100)));
  return Math.round(
    (clampPct(input.eventPresences, 8) +
      clampPct(input.raidsLive, 12) +
      clampPct(input.participation, 12) +
      clampPct(input.formationsThisMonth, 4)) /
      4,
  );
}

export function deriveActivityMetrics(data: MemberOverview, raidsForMonth: number) {
  const stats = data.stats ?? EMPTY_ACTIVITY_STATS;
  const monthKey = data.monthKey ?? "";
  const monthEvents = data.attendance?.monthEvents ?? [];
  const raidsLive = raidsForMonth > 0 ? raidsForMonth : stats.raidsThisMonth ?? 0;
  const formationsThisMonth =
    stats.formationsValidatedThisMonth ??
    (data.formationHistory ?? []).filter((item) => (item.date ?? "").slice(0, 7) === monthKey).length;
  const attendedThisMonth = monthEvents.filter((e) => e.attended).length;
  const trackedThisMonth = monthEvents.length;
  const intensityScore = computeIntensityScore({
    eventPresences: stats.eventPresencesThisMonth ?? 0,
    participation: stats.participationThisMonth ?? 0,
    raidsLive,
    formationsThisMonth,
  });

  return {
    stats,
    monthKey,
    monthEvents,
    monthlyHistory: data.attendance?.monthlyHistory ?? [],
    categoryBreakdown: data.attendance?.categoryBreakdown ?? [],
    discordPointsAvailable: Boolean(data.attendance?.discordPointsTrackingAvailable),
    upcoming: data.upcomingEvents ?? [],
    raidsLive,
    formationsThisMonth,
    attendedThisMonth,
    trackedThisMonth,
    intensityScore,
  };
}
