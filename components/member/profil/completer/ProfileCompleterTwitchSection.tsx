"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ProfileTwitchPanel from "@/components/member/profil/ProfileTwitchPanel";

type TwitchLinkStatus = {
  loading: boolean;
  connected: boolean;
  login: string | null;
  displayName: string | null;
};

export default function ProfileCompleterTwitchSection() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<TwitchLinkStatus>({
    loading: true,
    connected: false,
    login: null,
    displayName: null,
  });
  const [disconnecting, setDisconnecting] = useState(false);

  const callbackPath = useMemo(() => {
    if (!pathname || !pathname.startsWith("/")) return "/member/profil/completer";
    return pathname;
  }, [pathname]);

  const connectHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(callbackPath)}`;
  const linkedNow = searchParams?.get("twitch_linked") === "1";
  const errorCode = searchParams?.get("twitch_error");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
        const body = await response.json();
        if (!active) return;
        if (!response.ok || !body?.connected) {
          setStatus({ loading: false, connected: false, login: null, displayName: null });
          return;
        }
        setStatus({
          loading: false,
          connected: true,
          login: body?.twitch?.login || null,
          displayName: body?.twitch?.displayName || null,
        });
      } catch {
        if (!active) return;
        setStatus({ loading: false, connected: false, login: null, displayName: null });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/auth/twitch/link/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        alert("Impossible de déconnecter le compte Twitch.");
        return;
      }
      setStatus({ loading: false, connected: false, login: null, displayName: null });
    } catch {
      alert("Erreur réseau pendant la déconnexion Twitch.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <ProfileTwitchPanel
      status={status}
      startHref={connectHref}
      reconnectHref={connectHref}
      twitchLinkedNow={linkedNow}
      twitchError={errorCode ?? null}
      onDisconnect={handleDisconnect}
      disconnecting={disconnecting}
    />
  );
}
