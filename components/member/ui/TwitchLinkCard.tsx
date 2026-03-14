"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";

type TwitchLinkStatus = {
  loading: boolean;
  connected: boolean;
  login: string | null;
  displayName: string | null;
};

export default function TwitchLinkCard() {
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
    if (!pathname || !pathname.startsWith("/")) return "/member/profil";
    return pathname;
  }, [pathname]);

  const connectHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(callbackPath)}`;
  const linkedNow = searchParams.get("twitch_linked") === "1";
  const errorCode = searchParams.get("twitch_error");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
        const body = await response.json();
        if (!active) return;

        if (!response.ok || !body?.connected) {
          setStatus({
            loading: false,
            connected: false,
            login: null,
            displayName: null,
          });
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
        setStatus({
          loading: false,
          connected: false,
          login: null,
          displayName: null,
        });
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
        alert("Impossible de deconnecter le compte Twitch.");
        return;
      }
      setStatus({
        loading: false,
        connected: false,
        login: null,
        displayName: null,
      });
    } catch {
      alert("Erreur reseau pendant la deconnexion Twitch.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <MemberInfoCard title="Connexion Twitch">
      {linkedNow ? (
        <p className="mb-3 text-sm text-green-500">Compte Twitch lie avec succes.</p>
      ) : null}
      {errorCode ? (
        <p className="mb-3 text-sm text-red-500">Liaison Twitch echouee ({errorCode}).</p>
      ) : null}

      {status.loading ? (
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Verification du lien Twitch...
        </p>
      ) : status.connected ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span style={{ color: "var(--color-text)" }}>Compte Twitch connecte</span>
            {" : "}
            <span style={{ color: "var(--color-text)" }}>
              {status.displayName || status.login || "Twitch"}
            </span>
            {status.login ? ` (@${status.login})` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={connectHref}
              className="inline-flex rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Reconnecter mon compte Twitch
            </a>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {disconnecting ? "Deconnexion..." : "Deconnecter mon compte Twitch"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Connecte ton compte Twitch pour activer les fonctionnalites liees au suivi.
          </p>
          <a
            href={connectHref}
            className="inline-flex rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            Connecter mon compte Twitch
          </a>
        </div>
      )}
    </MemberInfoCard>
  );
}
