"use client";

import { useEffect, useState } from "react";

export type MemberOverview = {
  member: {
    discordId?: string;
    twitchLogin: string;
    displayName: string;
    role?: string;
    profileValidationStatus?: "non_soumis" | "en_cours_examen" | "valide" | string;
    onboardingStatus?: "a_faire" | "en_cours" | "termine" | string;
    integrationDate: string | null;
    parrain: string | null;
    bio?: string;
    socials?: {
      twitch?: string;
      discord?: string;
      instagram?: string;
      tiktok?: string;
      twitter?: string;
      youtube?: string;
    };
  };
  vip?: {
    activeThisMonth: boolean;
    statusLabel: string;
    source: "vip_history" | "member_flag" | "none";
    startsAt: string | null;
    endsAt: string | null;
  };
  monthKey: string;
  stats: {
    raidsThisMonth: number;
    raidsTotal: number;
    eventPresencesThisMonth: number;
    participationThisMonth: number;
    formationsValidated: number;
    formationsValidatedThisMonth?: number;
  };
  profile: {
    completed: boolean;
    percent: number;
  };
  upcomingEvents: Array<{ id: string; title: string; category: string; date: string }>;
  formationHistory: Array<{ id: string; title: string; date: string }>;
  eventPresenceHistory: Array<{ id: string; title: string; date: string; category: string }>;
  attendance?: {
    currentMonthKey: string;
    previousMonthKey: string;
    monthlyHistory: Array<{
      monthKey: string;
      totalEvents: number;
      attendedEvents: number;
      attendanceRate: number;
    }>;
    monthEvents: Array<{
      id: string;
      title: string;
      date: string;
      category: string;
      attended: boolean;
      isKeyEvent: boolean;
      /** Points evenement Discord (+300) : null si non applicable ou suivi indisponible */
      discordPointsStatus?: "awarded" | "pending" | null;
    }>;
    monthEventsByMonth: Array<{
      monthKey: string;
      events: Array<{
        id: string;
        title: string;
        date: string;
        category: string;
        attended: boolean;
        isKeyEvent: boolean;
        discordPointsStatus?: "awarded" | "pending" | null;
      }>;
    }>;
    /** Table Supabase event_discord_points disponible (migration 0039) */
    discordPointsTrackingAvailable?: boolean;
    categoryBreakdown: Array<{
      category: string;
      totalEvents: number;
      attendedEvents: number;
      attendanceRate: number;
    }>;
  };
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
