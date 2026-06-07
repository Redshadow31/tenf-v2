"use client";

import { useEffect, useState } from "react";

export type LiveStreamPreview = {
  login: string;
  title?: string;
  viewers?: number;
};

/**
 * Snapshot léger des lives Twitch en cours côté membres TENF.
 */
export type LiveStreamsSnapshot =
  | { state: "loading"; liveCount: null; totalMembers: null; streams: LiveStreamPreview[] }
  | { state: "unavailable"; liveCount: null; totalMembers: null; streams: LiveStreamPreview[] }
  | { state: "ready"; liveCount: number; totalMembers: number; streams: LiveStreamPreview[] };

type PublicMembersResponse = {
  members?: Array<{ twitchLogin?: string | null }>;
};

type TwitchStreamsResponse = {
  streams?: Array<{
    userLogin?: string;
    userName?: string;
    title?: string;
    viewerCount?: number;
    type?: string;
  }>;
};

const INITIAL: LiveStreamsSnapshot = {
  state: "loading",
  liveCount: null,
  totalMembers: null,
  streams: [],
};

export function useLiveStreamsSnapshot(options: { skip?: boolean } = {}) {
  const [snapshot, setSnapshot] = useState<LiveStreamsSnapshot>(INITIAL);

  useEffect(() => {
    if (options.skip) return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const membersResponse = await fetch("/api/members/public", { cache: "no-store" });
        if (!membersResponse.ok) throw new Error("members_unavailable");
        const membersBody = (await membersResponse.json()) as PublicMembersResponse;
        const logins = Array.from(
          new Set(
            (membersBody.members || [])
              .map((member) => String(member.twitchLogin || "").trim().toLowerCase())
              .filter((login): login is string => Boolean(login)),
          ),
        );

        if (logins.length === 0) {
          if (!cancelled) {
            setSnapshot({ state: "ready", liveCount: 0, totalMembers: 0, streams: [] });
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

        const liveStreams = (streamsBody.streams || [])
          .filter((stream) => (stream.type || "").toLowerCase() === "live")
          .map((stream) => ({
            login: String(stream.userLogin || "").toLowerCase(),
            title: stream.title,
            viewers: stream.viewerCount,
          }))
          .filter((s) => s.login)
          .sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0));

        if (!cancelled) {
          setSnapshot({
            state: "ready",
            liveCount: liveStreams.length,
            totalMembers: logins.length,
            streams: liveStreams,
          });
        }
      } catch {
        if (!cancelled) {
          setSnapshot({ state: "unavailable", liveCount: null, totalMembers: null, streams: [] });
        }
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [options.skip]);

  return snapshot;
}
