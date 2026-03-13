"use client";

import { useEffect, useState } from "react";

export type MemberOverview = {
  member: {
    twitchLogin: string;
    displayName: string;
    integrationDate: string | null;
    parrain: string | null;
  };
  monthKey: string;
  stats: {
    raidsThisMonth: number;
    raidsTotal: number;
    eventPresencesThisMonth: number;
    participationThisMonth: number;
    formationsValidated: number;
  };
  profile: {
    completed: boolean;
    percent: number;
  };
  upcomingEvents: Array<{ id: string; title: string; category: string; date: string }>;
  formationHistory: Array<{ id: string; title: string; date: string }>;
  eventPresenceHistory: Array<{ id: string; title: string; date: string; category: string }>;
};

export function useMemberOverview() {
  const [data, setData] = useState<MemberOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        const response = await fetch("/api/members/me/overview", { cache: "no-store" });
        const body = await response.json();
        if (!mounted) return;
        if (!response.ok) {
          setError(body.error || "Impossible de charger les donnees membre.");
          return;
        }
        setData(body);
      } catch {
        if (mounted) setError("Erreur de connexion.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
