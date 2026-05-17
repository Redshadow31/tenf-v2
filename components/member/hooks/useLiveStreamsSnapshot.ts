"use client";

import { useEffect, useState } from "react";

/**
 * Snapshot léger des lives Twitch en cours côté membres TENF.
 *
 * - Charge de manière différée pour ne pas pénaliser le rendu initial du dashboard.
 * - S'appuie sur deux endpoints existants (`/api/members/public` + `/api/twitch/streams`).
 * - Renvoie un état clair : `loading`, `unavailable` (Twitch non configuré / réseau KO),
 *   ou `ready` avec `liveCount` et `totalMembers`.
 */
export type LiveStreamsSnapshot =
  | { state: "loading"; liveCount: null; totalMembers: null }
  | { state: "unavailable"; liveCount: null; totalMembers: null }
  | { state: "ready"; liveCount: number; totalMembers: number };

type PublicMembersResponse = {
  members?: Array<{ twitchLogin?: string | null }>;
};

type TwitchStreamsResponse = {
  streams?: Array<{ userLogin?: string; type?: string }>;
};

const INITIAL: LiveStreamsSnapshot = {
  state: "loading",
  liveCount: null,
  totalMembers: null,
};

/**
 * Hook autonome : on évite de coupler `useMemberOverview` à ce fetch lourd.
 * On retourne uniquement la donnée nécessaire au dashboard.
 */
export function useLiveStreamsSnapshot(options: { skip?: boolean } = {}) {
  const [snapshot, setSnapshot] = useState<LiveStreamsSnapshot>(INITIAL);

  useEffect(() => {
    if (options.skip) return;

    let cancelled = false;
    // Petit délai pour laisser le dashboard se peindre d'abord.
    const timeout = window.setTimeout(async () => {
      try {
        const membersResponse = await fetch("/api/members/public", {
          cache: "no-store",
        });
        if (!membersResponse.ok) throw new Error("members_unavailable");
        const membersBody = (await membersResponse.json()) as PublicMembersResponse;
        const logins = Array.from(
          new Set(
            (membersBody.members || [])
              .map((member) => String(member.twitchLogin || "").trim().toLowerCase())
              .filter((login): login is string => Boolean(login))
          )
        );

        if (logins.length === 0) {
          if (!cancelled) {
            setSnapshot({ state: "ready", liveCount: 0, totalMembers: 0 });
          }
          return;
        }

        const streamsResponse = await fetch("/api/twitch/streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logins }),
        });
        if (!streamsResponse.ok) throw new Error("streams_unavailable");
        const streamsBody = (await streamsResponse.json()) as TwitchStreamsResponse;

        const liveCount = (streamsBody.streams || []).filter(
          (stream) => (stream.type || "").toLowerCase() === "live"
        ).length;

        if (!cancelled) {
          setSnapshot({
            state: "ready",
            liveCount,
            totalMembers: logins.length,
          });
        }
      } catch {
        if (!cancelled) {
          setSnapshot({ state: "unavailable", liveCount: null, totalMembers: null });
        }
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [options.skip]);

  return snapshot;
}
