"use client";

import { useEffect, useMemo, useState } from "react";
import { loginWithDiscord } from "@/lib/discord";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

type FollowState = "followed" | "not_followed" | "unknown";

type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  reason?: string;
  statuses?: Record<string, { state?: FollowState }>;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SCORE_CACHE_KEY = "member.engagement.score.v1";

type ScoreCachePayload = {
  savedAt: number;
  authenticated: boolean;
  linked: boolean;
  reason: string | null;
  statuses: Record<string, FollowState>;
};

export default function MemberEngagementScorePage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [linked, setLinked] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, FollowState>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const cached = readScoreCache();
    if (cached) {
      setAuthenticated(cached.authenticated);
      setLinked(cached.linked);
      setReason(cached.reason);
      setStatuses(cached.statuses);
      setLastUpdatedAt(cached.savedAt);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setError(null);
        const response = await fetch("/api/members/follow-status", { cache: "no-store" });
        const body = (await response.json()) as FollowStatusesResponse;
        if (!active) return;

        if (!response.ok) {
          setAuthenticated(false);
          setLinked(false);
          setStatuses({});
          setReason(body?.reason || "unauthorized");
          return;
        }

        const normalized: Record<string, FollowState> = {};
        const rawStatuses = body?.statuses || {};
        for (const [login, entry] of Object.entries(rawStatuses)) {
          normalized[login.toLowerCase()] = entry?.state || "unknown";
        }

        setAuthenticated(body?.authenticated === true);
        setLinked(body?.linked === true);
        setReason(body?.reason || null);
        setStatuses(normalized);
        const savedAt = Date.now();
        setLastUpdatedAt(savedAt);
        writeScoreCache({
          savedAt,
          authenticated: body?.authenticated === true,
          linked: body?.linked === true,
          reason: body?.reason || null,
          statuses: normalized,
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur reseau.");
        setAuthenticated(false);
        setLinked(false);
        setStatuses({});
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function forceRefresh() {
    try {
      localStorage.removeItem(SCORE_CACHE_KEY);
    } catch {
      // noop
    }
    window.location.reload();
  }

  const analytics = useMemo(() => {
    const values = Object.values(statuses);
    const total = values.length;
    const followed = values.filter((state) => state === "followed").length;
    const notFollowed = values.filter((state) => state === "not_followed").length;
    const unknown = values.filter((state) => state === "unknown").length;
    const score = total > 0 ? Math.round((followed / total) * 100) : 0;
    const perfect = total > 0 && notFollowed === 0 && unknown === 0;
    return { total, followed, notFollowed, unknown, score, perfect };
  }, [statuses]);

  const followCtaHref = "/member/engagement/a-decouvrir";
  const connectTwitchHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent("/member/engagement/score")}`;

  if (loading) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Mon score d'engagements"
          description="Analyse en cours de tes follows Twitch sur les membres TENF actifs."
          badge="Engagement"
        />
        <section
          className="animate-pulse rounded-2xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="space-y-3">
            <div className="h-3 w-40 rounded" style={{ backgroundColor: "rgba(148,163,184,0.2)" }} />
            <div className="h-10 w-28 rounded" style={{ backgroundColor: "rgba(145,70,255,0.22)" }} />
            <div className="h-3 w-full rounded" style={{ backgroundColor: "rgba(148,163,184,0.2)" }} />
            <div className="h-3 w-2/3 rounded" style={{ backgroundColor: "rgba(148,163,184,0.16)" }} />
          </div>
        </section>
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mon score d'engagements"
        description="Mesure de tes follows sur les membres TENF actifs et valides."
        badge="Engagement"
      />

      {!authenticated ? (
        <GateCard
          title="Connexion Discord requise"
          description="Connecte-toi a Discord pour autoriser la consultation de ton score d'engagement."
          actionLabel="Se connecter avec Discord"
          onAction={loginWithDiscord}
        />
      ) : !linked ? (
        <GateCard
          title="Compte Twitch non lie"
          description="Lie ton compte Twitch pour comparer tes follows avec les membres TENF actifs."
          actionLabel="Lier mon Twitch"
          href={connectTwitchHref}
        />
      ) : (
        <>
          <section
            className="relative overflow-hidden rounded-2xl border p-6 md:p-7"
            style={{
              borderColor: "rgba(145,70,255,0.42)",
              background:
                "linear-gradient(132deg, rgba(22,20,34,0.98) 0%, rgba(42,24,62,0.88) 55%, rgba(22,20,34,0.98) 100%)",
              boxShadow: "0 22px 42px rgba(0,0,0,0.28)",
            }}
          >
            <div className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full blur-3xl" style={{ backgroundColor: "rgba(167,139,250,0.32)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-8 h-44 w-44 rounded-full blur-3xl" style={{ backgroundColor: "rgba(236,72,153,0.16)" }} />

            <div className="relative space-y-5">
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(221,191,255,0.86)" }}>
                Radar de follow
              </p>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm" style={{ color: "rgba(221,191,255,0.9)" }}>
                    Score global
                  </p>
                  <p className="text-5xl font-black" style={{ color: "#f5edff" }}>
                    {analytics.score}%
                  </p>
                </div>
                <a
                  href={followCtaHref}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-[1px]"
                  style={{ borderColor: "rgba(221,191,255,0.35)", color: "#f5edff", backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  Voir les chaines a decouvrir
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs" style={{ color: "rgba(237,233,254,0.9)" }}>
                  Derniere maj: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("fr-FR") : "maintenant"}
                </p>
                <button
                  type="button"
                  onClick={forceRefresh}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10"
                  style={{ borderColor: "rgba(221,191,255,0.35)", color: "#f5edff" }}
                >
                  Forcer la mise a jour
                </button>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, analytics.score)}%`,
                      background: "linear-gradient(90deg, #a855f7 0%, #c084fc 60%, #f0abfc 100%)",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: "rgba(237,233,254,0.9)" }}>
                  {analytics.followed} suivi(s) sur {analytics.total} membre(s) actif(s).
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-4">
            <StatCard label="Membres actifs suivis" value={analytics.followed} tone="good" />
            <StatCard label="Membres actifs non suivis" value={analytics.notFollowed} tone="warn" />
            <StatCard label="Statuts inconnus" value={analytics.unknown} tone="neutral" />
            <StatCard label="Objectif plein score" value={analytics.perfect ? "Atteint" : "En cours"} tone={analytics.perfect ? "good" : "neutral"} />
          </section>

          <section
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            {analytics.perfect ? (
              <p className="text-sm" style={{ color: "#86efac" }}>
                Excellent ! Tu follow deja tous les membres actifs du systeme.
              </p>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Tu peux encore augmenter ton score en suivant les membres listes dans{" "}
                <a href={followCtaHref} className="underline decoration-dotted" style={{ color: "var(--color-text)" }}>
                  A decouvrir
                </a>
                .
              </p>
            )}
            {reason && reason !== "ok" ? (
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Info technique: {reason}
              </p>
            ) : null}
            {error ? (
              <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                Erreur: {error}
              </p>
            ) : null}
          </section>
        </>
      )}
    </MemberSurface>
  );
}

function readScoreCache(): ScoreCachePayload | null {
  try {
    const raw = localStorage.getItem(SCORE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScoreCachePayload;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeScoreCache(payload: ScoreCachePayload) {
  try {
    localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
}

function GateCard({
  title,
  description,
  actionLabel,
  href,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        borderColor: "rgba(145,70,255,0.42)",
        background:
          "linear-gradient(130deg, rgba(23,20,34,0.98) 0%, rgba(35,23,50,0.92) 100%)",
      }}
    >
      <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {description}
      </p>
      {href ? (
        <a
          href={href}
          className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {actionLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "good" | "warn" | "neutral";
}) {
  const palette =
    tone === "good"
      ? { border: "rgba(74,222,128,0.35)", bg: "rgba(21,128,61,0.14)", color: "#86efac" }
      : tone === "warn"
        ? { border: "rgba(251,191,36,0.35)", bg: "rgba(146,64,14,0.14)", color: "#fcd34d" }
        : { border: "var(--color-border)", bg: "var(--color-card)", color: "var(--color-text)" };

  return (
    <article className="rounded-xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.bg }}>
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: palette.color }}>
        {value}
      </p>
    </article>
  );
}
