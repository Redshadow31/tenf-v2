export type RaidHubApiItem = {
  date: string;
  count?: number;
  source?: string;
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
  raiderDisplayName?: string;
  targetDisplayName?: string;
};

export type RaidHubSummary = {
  sent: number;
  uniqueTargets: number;
  topTarget: { key: string; label: string; count: number } | null;
};

export type RaidHubTargetRow = {
  key: string;
  label: string;
  login: string;
  count: number;
  rate: number;
};

export type RaidHubMonthRow = {
  monthKey: string;
  sentRaids: RaidHubApiItem[];
  summary: RaidHubSummary;
};

export const RAID_TIER_THRESHOLDS = [
  { min: 20, label: "Titan des raids", hint: "Tu rayonnées sur la communauté.", color: "#d4af37" },
  { min: 12, label: "Pilier", hint: "Rythme solide, continue comme ça.", color: "#60a5fa" },
  { min: 7, label: "Actif", hint: "Bel engagement mensuel.", color: "#34d399" },
  { min: 3, label: "En route", hint: "Chaque raid compte.", color: "#f59e0b" },
  { min: 0, label: "Démarrage", hint: "Fixe-toi un objectif et enchaîne.", color: "#f87171" },
] as const;

export function normalizeRaidHubLogin(value?: string): string {
  return String(value || "").toLowerCase().trim();
}

export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = new Date(year, month - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getLast12MonthKeys(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

export function computeRaidHubSummary(sentRaids: RaidHubApiItem[]): RaidHubSummary {
  const sent = sentRaids.reduce((sum, raid) => sum + (raid.count || 1), 0);
  const targetsCount = new Map<string, { label: string; count: number }>();

  for (const raid of sentRaids) {
    const key = normalizeRaidHubLogin(raid.targetTwitchLogin || raid.targetDisplayName);
    if (!key) continue;
    const current = targetsCount.get(key) || {
      label: raid.targetDisplayName || raid.targetTwitchLogin || "Cible",
      count: 0,
    };
    current.count += raid.count || 1;
    targetsCount.set(key, current);
  }

  const topTargetEntry = Array.from(targetsCount.entries()).sort((a, b) => b[1].count - a[1].count)[0];

  return {
    sent,
    uniqueTargets: targetsCount.size,
    topTarget: topTargetEntry
      ? { key: topTargetEntry[0], label: topTargetEntry[1].label, count: topTargetEntry[1].count }
      : null,
  };
}

export function computeTargetBreakdown(sentRaids: RaidHubApiItem[]): RaidHubTargetRow[] {
  const map = new Map<string, { label: string; count: number; login: string }>();
  for (const raid of sentRaids) {
    const key = normalizeRaidHubLogin(raid.targetTwitchLogin || raid.targetDisplayName);
    if (!key) continue;
    const item = map.get(key) || {
      label: raid.targetDisplayName || raid.targetTwitchLogin || "Cible",
      count: 0,
      login: raid.targetTwitchLogin || key,
    };
    item.count += raid.count || 1;
    map.set(key, item);
  }
  const max = Math.max(1, ...Array.from(map.values()).map((item) => item.count));
  return Array.from(map.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      login: value.login,
      count: value.count,
      rate: Math.round((value.count / max) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getRaidTierDetail(score: number) {
  return RAID_TIER_THRESHOLDS.find((tier) => score >= tier.min) || RAID_TIER_THRESHOLDS[RAID_TIER_THRESHOLDS.length - 1];
}

export function nextRaidTierThreshold(score: number): number | null {
  for (const threshold of [3, 7, 12, 20]) {
    if (score < threshold) return threshold;
  }
  return null;
}
