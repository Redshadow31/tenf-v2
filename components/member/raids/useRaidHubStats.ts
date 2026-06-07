"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeRaidHubSummary,
  getLast12MonthKeys,
  normalizeRaidHubLogin,
  type RaidHubApiItem,
  type RaidHubMonthRow,
} from "@/components/member/raids/raidHubStatsUtils";

export function useRaidHubStats(twitchLogin: string | undefined) {
  const monthsChrono = useMemo(() => getLast12MonthKeys(), []);
  const [history, setHistory] = useState<RaidHubMonthRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const login = normalizeRaidHubLogin(twitchLogin);
    if (!login) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const rows = await Promise.all(
          monthsChrono.map(async (monthKey) => {
            const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, { cache: "no-store" });
            const body = await response.json();
            const sentRaids = (body.raidsFaits || []).filter(
              (raid: RaidHubApiItem) => normalizeRaidHubLogin(raid.raiderTwitchLogin) === login,
            ) as RaidHubApiItem[];
            return {
              monthKey,
              sentRaids,
              summary: computeRaidHubSummary(sentRaids),
            };
          }),
        );
        if (!cancelled) setHistory(rows);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [monthsChrono, twitchLogin]);

  const getMonthRow = (monthKey: string): RaidHubMonthRow | null =>
    history.find((entry) => entry.monthKey === monthKey) || null;

  return { monthsChrono, history, loading, getMonthRow };
}
