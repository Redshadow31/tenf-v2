"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import { deriveActivityMetrics } from "@/components/member/activity/activityUtils";

export function useMemberActivityPage(data: MemberOverview | null) {
  const [raidsForMonth, setRaidsForMonth] = useState(0);

  const monthKey = data?.monthKey ?? "";
  const twitchLogin = data?.member?.twitchLogin ?? "";

  useEffect(() => {
    if (!monthKey || !twitchLogin) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: { raiderTwitchLogin?: string }) =>
            String(raid.raiderTwitchLogin || "").toLowerCase() === twitchLogin.toLowerCase(),
        );
        const total = mine.reduce((sum: number, raid: { count?: number }) => sum + (raid.count || 1), 0);
        if (!cancelled) setRaidsForMonth(total);
      } catch {
        if (!cancelled) setRaidsForMonth(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthKey, twitchLogin]);

  const metrics = useMemo(() => {
    if (!data) return null;
    return deriveActivityMetrics(data, raidsForMonth);
  }, [data, raidsForMonth]);

  return { metrics, raidsForMonth };
}
