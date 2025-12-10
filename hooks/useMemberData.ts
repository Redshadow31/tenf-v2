// Hook React pour utiliser les données centralisées des membres
"use client";

import { useState, useEffect } from "react";

export interface MemberData {
  twitchLogin: string;
  twitchUrl: string;
  discordId?: string;
  discordUsername?: string;
  displayName: string;
  siteUsername?: string; // Pseudo choisi sur le site
  role: string;
  isVip: boolean;
  isActive: boolean;
  description?: string;
  customBio?: string;
  twitchStatus?: {
    isLive: boolean;
    gameName?: string;
    viewerCount?: number;
    title?: string;
    thumbnailUrl?: string;
  };
}

/**
 * Hook pour récupérer toutes les données des membres
 */
export function useAllMembers() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch("/api/admin/members");
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  const refetch = () => {
    setLoading(true);
    fetch("/api/admin/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return { members, loading, error, refetch };
}

/**
 * Hook pour récupérer les membres actifs uniquement
 */
export function useActiveMembers() {
  const { members, loading, error, refetch } = useAllMembers();
  const activeMembers = members.filter((m) => m.isActive);
  return { members: activeMembers, loading, error, refetch };
}

/**
 * Hook pour récupérer les membres VIP uniquement
 */
export function useVipMembers() {
  const { members, loading, error, refetch } = useAllMembers();
  const vipMembers = members.filter((m) => m.isVip && m.isActive);
  return { members: vipMembers, loading, error, refetch };
}

/**
 * Hook pour récupérer un membre spécifique
 */
export function useMember(twitchLogin: string) {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMember() {
      try {
        const response = await fetch(`/api/admin/members?twitchLogin=${encodeURIComponent(twitchLogin)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch member");
        }
        const data = await response.json();
        setMember(data.member || null);
      } catch (err) {
        console.error("Error fetching member:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (twitchLogin) {
      fetchMember();
    }
  }, [twitchLogin]);

  return { member, loading, error };
}

