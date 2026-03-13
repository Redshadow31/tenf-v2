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
  const lastClickSentAtRef = useRef<number>(0);
  const lastClickKeyRef = useRef<string>("");

  async function registerVisit(sessionKey: string, path: string, source: "heartbeat" | "login" | "navigation") {
    await fetch("/api/telemetry/connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey, path, source }),
      keepalive: true,
    });
  }

  async function registerPageActivity(
    sessionKey: string,
    payload: { path: string; eventType: "page_view" | "click"; title?: string; target?: string }
  ) {
    await fetch("/api/telemetry/page-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionKey,
        path: payload.path,
        eventType: payload.eventType,
        title: payload.title,
        target: payload.target,
      }),
      keepalive: true,
    });
  }

  function shouldTrackPath(path: string): boolean {
    if (!path) return false;
    if (path.startsWith("/api")) return false;
    if (path.startsWith("/_next")) return false;
    if (path.startsWith("/favicon")) return false;
    if (path.startsWith("/robots.txt")) return false;
    if (path.startsWith("/sitemap")) return false;
    return true;
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
    if (!shouldTrackPath(pathname)) return;

    registerVisit(visitId, pathname, "navigation")
      .then(async () => {
        await registerPageActivity(visitId, {
          path: pathname,
          eventType: "page_view",
          title: typeof document !== "undefined" ? document.title : undefined,
        });
        await sendHeartbeat(visitId, pathname);
      })
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

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!pathname || !shouldTrackPath(pathname)) return;

      const target = event.target as HTMLElement | null;
      const clickable = target?.closest("a,button,[role='button'],[data-track-click]");
      if (!clickable) return;

      const now = Date.now();
      const textLabel = (clickable.textContent || "").replace(/\s+/g, " ").trim().slice(0, 64);
      const href = clickable instanceof HTMLAnchorElement ? clickable.getAttribute("href") || "" : "";
      const clickKey = `${pathname}|${clickable.tagName}|${clickable.id || ""}|${href}|${textLabel}`;
      if (clickKey === lastClickKeyRef.current && now - lastClickSentAtRef.current < 1500) return;

      lastClickKeyRef.current = clickKey;
      lastClickSentAtRef.current = now;

      const clickTarget = [
        clickable.tagName.toLowerCase(),
        clickable.id ? `#${clickable.id}` : "",
        href ? `href:${href}` : "",
        textLabel ? `text:${textLabel}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      registerPageActivity(visitId, {
        path: pathname,
        eventType: "click",
        title: typeof document !== "undefined" ? document.title : undefined,
        target: clickTarget,
      }).catch(() => undefined);
    };

    document.addEventListener("click", onClick, { capture: false });
    return () => document.removeEventListener("click", onClick);
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
