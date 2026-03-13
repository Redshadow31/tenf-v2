"use client";

import { useEffect, useState } from "react";
import { buildRealtimeQuery } from "@/lib/ui/loginLogsUi";

export interface RealtimeLoginResponse {
  totalActiveConnections: number;
  activeMembers: number;
  activeGuests: number;
  countriesRepresented: number;
  latestHeartbeatAt: string | null;
  countries: Array<{
    country: string;
    countryCode: string;
    active: number;
    members: number;
    guests: number;
  }>;
  activeConnections: Array<{
    username: string | null;
    userId: string | null;
    country: string | null;
    countryCode: string | null;
    region: string | null;
    city: string | null;
    lastSeenAt: string;
    connectionType: "discord" | "guest";
    path: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    status: "active_recent";
  }>;
}

export function useRealtimeLoginLogs(
  params: { connectionType?: "discord" | "guest"; country?: string; userSearch?: string },
  pollingMs = 20_000
) {
  const [data, setData] = useState<RealtimeLoginResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState === "hidden") {
        timer = window.setTimeout(load, pollingMs);
        return;
      }
      try {
        const query = buildRealtimeQuery(params);
        const response = await fetch(`/api/admin/login-logs/realtime?${query}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Erreur chargement temps réel");
        const payload = (await response.json()) as RealtimeLoginResponse;
        if (!cancelled) {
          setData(payload);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Impossible de charger les connexions temps réel.");
          setLoading(false);
        }
      } finally {
        if (!cancelled) timer = window.setTimeout(load, pollingMs);
      }
    };

    setLoading(true);
    load();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [params.connectionType, params.country, params.userSearch, pollingMs]);

  return { data, loading, error };
}
