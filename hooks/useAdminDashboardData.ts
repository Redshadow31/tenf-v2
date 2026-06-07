"use client";

import { useEffect, useState } from "react";
import type { AdminDashboardAggregate, AdminDashboardUser } from "@/lib/admin/dashboard/adminDashboardTypes";
import {
  monthKeyForDashboard,
  previousMonthKeyForDashboard,
} from "@/lib/admin/dashboard/adminDashboardModel";

const EMPTY_AGGREGATE: AdminDashboardAggregate = {
  summary: {
    total: 0,
    missingDiscord: 0,
    missingTwitchId: 0,
    incomplete: 0,
    reviewOverdue: 0,
    reviewDue7d: 0,
    avgCompletion: 0,
    validatedProfiles: 0,
    communityMonthCount: 0,
  },
  ops: {
    events: [],
    finalNotesCount: 0,
    followOverdueStaffNames: [],
    vipMonthCount: 0,
    staffApplicationsPendingCount: 0,
    staffApplicationsRedFlagCount: 0,
    profileValidationPendingCount: 0,
    raidsPendingCount: 0,
    discordPointsPendingCount: 0,
    raidsIgnoredToProcessCount: 0,
  },
  upcoming: {
    nextMeetingRegistrations: 0,
    nextMeetingDateIso: "",
    nextMeetingLabel: "",
    nextEventRegistrations: 0,
    nextEventLabel: "",
    upcomingSpotlights: 0,
    pendingEventValidations: 0,
  },
};

const SESSION_CACHE_PREFIX = "tenf:admin:dashboard:bento:";

type BentoApiResponse = {
  user: AdminDashboardUser;
  data: AdminDashboardAggregate;
};

function readSessionCache(cacheKey: string): BentoApiResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as BentoApiResponse;
  } catch {
    return null;
  }
}

function writeSessionCache(cacheKey: string, payload: BentoApiResponse): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${cacheKey}`, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function useAdminDashboardData() {
  const [user, setUser] = useState<AdminDashboardUser | null>(null);
  const [data, setData] = useState<AdminDashboardAggregate>(EMPTY_AGGREGATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const currentMonth = monthKeyForDashboard();
    const evaluationMonth = previousMonthKeyForDashboard();
    const sessionKey = `${currentMonth}:${evaluationMonth}`;

    const cached = readSessionCache(sessionKey);
    if (cached?.user && cached?.data) {
      setUser({
        displayName: cached.user.displayName,
        roleLabel: cached.user.roleLabel,
        rawRole: cached.user.rawRole,
      });
      setData(cached.data);
      setLoading(false);
    }

    async function load() {
      try {
        const response = await fetch(
          `/api/admin/dashboard/bento?month=${encodeURIComponent(currentMonth)}&evaluationMonth=${encodeURIComponent(evaluationMonth)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Impossible de charger les données (${response.status})`);
        }

        const payload = (await response.json()) as BentoApiResponse;
        if (!payload?.user || !payload?.data) {
          throw new Error("Données dashboard invalides");
        }

        if (!active) return;

        setUser({
          displayName: payload.user.displayName,
          roleLabel: payload.user.roleLabel,
          rawRole: payload.user.rawRole,
        });
        setData(payload.data);
        setError(null);
        writeSessionCache(sessionKey, payload);
      } catch (err) {
        if (!active) return;
        if (!cached) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { user, data, loading, error };
}
