"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const VISIT_KEY = "tenf_visit_id";

function createVisitId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `visit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateVisitId(): string | null {
  if (typeof window === "undefined") return null;
  const fromStorage = localStorage.getItem(VISIT_KEY);
  if (fromStorage) return fromStorage;
  const created = createVisitId();
  localStorage.setItem(VISIT_KEY, created);
  return created;
}

export default function ConnectionTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const visitIdRef = useRef<string | null>(null);
  const loginSentRef = useRef(false);
  const lastHeartbeatAtRef = useRef<number>(0);

  async function registerVisit(sessionKey: string, path: string, source: "heartbeat" | "login" | "navigation") {
    await fetch("/api/telemetry/connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey, path, source }),
      keepalive: true,
    });
  }

  async function sendHeartbeat(sessionKey: string, path: string) {
    const now = Date.now();
    if (now - lastHeartbeatAtRef.current < 45_000) {
      return;
    }
    lastHeartbeatAtRef.current = now;

    await fetch("/api/telemetry/connection/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey, path }),
      keepalive: true,
    });
  }

  useEffect(() => {
    if (!visitIdRef.current) {
      visitIdRef.current = getOrCreateVisitId();
    }
    const visitId = visitIdRef.current;
    if (!visitId) return;
    if (!pathname) return;
    if (pathname.startsWith("/api")) return;

    registerVisit(visitId, pathname, "navigation")
      .then(() => sendHeartbeat(visitId, pathname))
      .catch(() => undefined);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(visitId, pathname).catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(visitId, pathname).catch(() => undefined);
      }
    }, 60_000);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  useEffect(() => {
    if (!visitIdRef.current) {
      visitIdRef.current = getOrCreateVisitId();
    }
    const visitId = visitIdRef.current;
    if (!visitId) return;
    if (status !== "authenticated" || !session?.user?.discordId) return;
    if (loginSentRef.current) return;
    loginSentRef.current = true;

    registerVisit(visitId, pathname || "/", "login").catch(() => undefined);
  }, [status, session?.user?.discordId, pathname]);

  return null;
}
