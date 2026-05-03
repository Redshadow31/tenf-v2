"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Heart,
  Loader2,
  Radio,
  Search,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from "lucide-react";

type DetailChannel = {
  twitchLogin: string;
  twitchId: string | null;
  displayName: string;
  isOwnChannel: boolean;
};

type DetailPayload = {
  snapshotId: string;
  generatedAt: string;
  sourceDataRetrievedAt: string;
  state: "ok" | "not_linked" | "calculation_impossible";
  reason: string | null;
  member: {
    discordId: string | null;
    displayName: string;
    memberTwitchLogin: string;
    linkedTwitchLogin: string | null;
    linkedTwitchDisplayName: string | null;
  };
  totals: {
    followedCount: number | null;
    totalActiveTenfChannels: number;
    followRate: number | null;
  };
  followedChannels: DetailChannel[];
  notFollowedChannels: DetailChannel[];
  lastCalculatedAt: string | null;
};

export type FollowMemberDetailModalProps = {
  open: boolean;
  loading: boolean;
  detail: DetailPayload | null;
  onClose: () => void;
  /** Aligné sur le hub communauté (dégradés, glass, interactions riches). */
  variant?: "default" | "hub";
};

function formatDate(value: string | null): string {
  if (!value) return "Indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Indisponible";
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type ListTab = "followed" | "missing";

function filterChannels(channels: DetailChannel[], q: string): DetailChannel[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return channels;
  return channels.filter(
    (c) =>
      c.twitchLogin.toLowerCase().includes(needle) ||
      c.displayName.toLowerCase().includes(needle)
  );
}

function FollowRateRing({
  rate,
  size = 112,
  hub,
}: {
  rate: number;
  size?: number;
  hub: boolean;
}) {
  const gradId = `followRingGrad-${useId().replace(/:/g, "")}`;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, rate));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={hub ? "stroke-white/10" : "stroke-neutral-700"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={hub ? "transition-[stroke-dashoffset] duration-700 ease-out" : "stroke-emerald-500 transition-[stroke-dashoffset] duration-700 ease-out"}
          style={hub ? { stroke: `url(#${gradId})` } : undefined}
        />
        {hub ? (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${hub ? "text-white" : ""}`} style={!hub ? { color: "var(--color-text)" } : undefined}>
          {Math.round(clamped)}%
        </span>
        <span className={`text-[10px] uppercase tracking-wider ${hub ? "text-slate-500" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
          TENF
        </span>
      </div>
    </div>
  );
}

export default function FollowMemberDetailModal({
  open,
  loading,
  detail,
  onClose,
  variant = "default",
}: FollowMemberDetailModalProps) {
  const hub = variant === "hub";
  const [tab, setTab] = useState<ListTab>("followed");
  const [listQuery, setListQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTab("followed");
      setListQuery("");
      setCopied(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copyText = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  const filteredFollowed = useMemo(
    () => (detail ? filterChannels(detail.followedChannels, listQuery) : []),
    [detail, listQuery]
  );
  const filteredMissing = useMemo(
    () => (detail ? filterChannels(detail.notFollowedChannels, listQuery) : []),
    [detail, listQuery]
  );

  if (!open) return null;

  const panelClass = hub
    ? "max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d14] text-white shadow-2xl shadow-pink-950/40"
    : "max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-xl border";

  const panelStyle = !hub
    ? {
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }
    : undefined;

  const stateMeta = (() => {
    if (!detail) return null;
    if (detail.state === "ok")
      return { tone: "ok" as const, title: "Calcul à jour", desc: "Les follows sont comparés aux chaînes TENF actives du snapshot." };
    if (detail.state === "not_linked")
      return {
        tone: "warn" as const,
        title: "Compte chaîne non relié",
        desc: "Invite le membre à lier son compte Twitch « chaîne » dans l’espace membre pour mesurer les follows réels.",
      };
    return {
      tone: "err" as const,
      title: "Calcul impossible",
      desc: detail.reason || "Raison non renseignée par l’API.",
    };
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="follow-detail-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${hub ? "bg-black/75 backdrop-blur-md" : "bg-black/70"}`}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className={`flex max-h-[90vh] flex-col ${panelClass}`}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`relative shrink-0 border-b px-5 py-4 md:px-6 md:py-5 ${
            hub ? "border-white/10 bg-gradient-to-br from-pink-950/50 via-[#0c0d14] to-violet-950/40" : ""
          }`}
          style={!hub ? { borderColor: "var(--color-border)" } : undefined}
        >
          {hub ? (
            <>
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-pink-500/15 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
            </>
          ) : null}
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    hub ? "border-pink-400/35 bg-pink-500/15 text-pink-100" : "border-neutral-600 text-neutral-300"
                  }`}
                >
                  <Heart className="h-3 w-3" />
                  TENF
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                    hub ? "border-white/10 bg-white/5 text-slate-400" : "border-neutral-600 text-neutral-400"
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  Snapshot live
                </span>
              </div>
              <h2
                id="follow-detail-title"
                className={`text-xl font-bold tracking-tight md:text-2xl ${hub ? "text-white" : ""}`}
                style={!hub ? { color: "var(--color-text)" } : undefined}
              >
                Soutien aux chaînes TENF
              </h2>
              <p className={`mt-1 max-w-xl text-sm leading-relaxed ${hub ? "text-slate-400" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                Vue détaillée du follow depuis le compte analysé vers l’écosystème. Utile pour féliciter ou accompagner un membre, sans
                jugement.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`shrink-0 rounded-xl border p-2 transition ${
                hub
                  ? "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  : "rounded-lg border px-3 py-2 text-sm"
              }`}
              style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
              aria-label="Fermer"
            >
              {hub ? <X className="h-5 w-5" /> : "Fermer"}
            </button>
          </div>
        </div>

        {/* Body scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          {loading ? (
            <div className="space-y-4 py-4">
              <div className={`flex items-center gap-3 ${hub ? "text-pink-200" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                <span className="text-sm">Chargement du détail membre…</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-20 animate-pulse rounded-xl ${hub ? "bg-white/5" : "rounded-lg bg-neutral-800/60"}`}
                  />
                ))}
              </div>
              <div className={`h-40 animate-pulse rounded-xl ${hub ? "bg-white/5" : "bg-neutral-800/40"}`} />
            </div>
          ) : !detail ? (
            <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucun détail disponible pour ce membre.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Membre + actions */}
              <section
                className={`rounded-xl border p-4 md:p-5 ${
                  hub ? "border-white/10 bg-white/[0.03]" : "rounded-lg"
                }`}
                style={!hub ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" } : undefined}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                        hub ? "bg-gradient-to-br from-pink-500/30 to-violet-600/30" : "bg-neutral-800"
                      }`}
                    >
                      <UserCircle2 className={`h-8 w-8 ${hub ? "text-pink-100" : "text-neutral-300"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium uppercase tracking-wide ${hub ? "text-slate-500" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                        Membre
                      </p>
                      <p className="truncate text-lg font-semibold" style={!hub ? { color: "var(--color-text)" } : undefined}>
                        {detail.member.displayName}
                      </p>
                      <p className={`truncate text-sm ${hub ? "text-slate-400" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                        @{detail.member.memberTwitchLogin}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyText("login", detail.member.memberTwitchLogin)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                            hub
                              ? "border-white/15 bg-black/20 text-slate-200 hover:border-pink-400/40 hover:text-white"
                              : ""
                          }`}
                          style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied === "login" ? "Copié !" : "Copier @login"}
                        </button>
                        <a
                          href={`https://www.twitch.tv/${encodeURIComponent(detail.member.memberTwitchLogin)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                            hub
                              ? "border-pink-400/30 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20"
                              : ""
                          }`}
                          style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Profil Twitch
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className={`text-xs font-medium uppercase tracking-wide ${hub ? "text-slate-500" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                      Compte Twitch relié (chaîne)
                    </p>
                    {detail.member.linkedTwitchLogin ? (
                      <>
                        <p className="font-semibold" style={!hub ? { color: "var(--color-text)" } : undefined}>
                          {detail.member.linkedTwitchDisplayName || detail.member.linkedTwitchLogin}
                        </p>
                        <p className={`text-sm ${hub ? "text-slate-400" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                          @{detail.member.linkedTwitchLogin}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyText("linked", detail.member.linkedTwitchLogin!)}
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium md:ml-auto ${
                            hub ? "border-white/15 bg-black/20 text-slate-200 hover:border-violet-400/40" : ""
                          }`}
                          style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied === "linked" ? "Copié !" : "Copier login relié"}
                        </button>
                      </>
                    ) : (
                      <p className={`text-sm ${hub ? "text-amber-200/90" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                        Aucun compte relié — le taux de follow ne peut pas être calculé.
                      </p>
                    )}
                  </div>
                </div>

                <div className={`mt-4 flex flex-wrap gap-2 border-t pt-4 text-xs ${hub ? "border-white/10 text-slate-500" : ""}`} style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text-secondary)" } : undefined}>
                  <span>
                    Dernier calcul : <strong className={hub ? "text-slate-300" : ""}>{formatDate(detail.lastCalculatedAt)}</strong>
                  </span>
                  <span className={hub ? "text-white/20" : "text-neutral-600"}>·</span>
                  <span>
                    Données source : <strong className={hub ? "text-slate-300" : ""}>{formatDate(detail.sourceDataRetrievedAt)}</strong>
                  </span>
                </div>
              </section>

              {/* Stats + ring */}
              <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex justify-center md:justify-start">
                  {detail.totals.followRate !== null ? (
                    <FollowRateRing rate={detail.totals.followRate} hub={hub} />
                  ) : (
                    <div
                      className={`flex h-28 w-28 flex-col items-center justify-center rounded-2xl border text-center text-xs ${
                        hub ? "border-white/10 bg-white/5 text-slate-500" : ""
                      }`}
                      style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text-secondary)" } : undefined}
                    >
                      <span className="text-lg font-bold" style={!hub ? { color: "var(--color-text)" } : undefined}>
                        —
                      </span>
                      taux
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    {
                      label: "Suivies",
                      value: detail.totals.followedCount ?? "—",
                      icon: CheckCircle2,
                      accent: hub ? "text-emerald-300" : "text-emerald-400",
                    },
                    {
                      label: "Chaînes TENF",
                      value: detail.totals.totalActiveTenfChannels,
                      icon: Users,
                      accent: hub ? "text-violet-300" : "text-violet-400",
                    },
                    {
                      label: "Reste",
                      value:
                        detail.totals.followedCount != null
                          ? Math.max(0, detail.totals.totalActiveTenfChannels - detail.totals.followedCount)
                          : "—",
                      icon: Sparkles,
                      accent: hub ? "text-pink-300" : "text-pink-400",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-xl border p-3 text-center ${
                        hub ? "border-white/10 bg-white/[0.04]" : "rounded-lg"
                      }`}
                      style={!hub ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" } : undefined}
                    >
                      <s.icon className={`mx-auto mb-1 h-5 w-5 ${s.accent}`} />
                      <p className={`text-[10px] uppercase tracking-wide ${hub ? "text-slate-500" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                        {s.label}
                      </p>
                      <p className="text-xl font-bold tabular-nums" style={!hub ? { color: "var(--color-text)" } : undefined}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {stateMeta ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                    stateMeta.tone === "ok"
                      ? hub
                        ? "border-emerald-500/30 bg-emerald-950/25 text-emerald-100"
                        : "border-emerald-500/40 bg-emerald-500/10"
                      : stateMeta.tone === "warn"
                        ? hub
                          ? "border-amber-400/35 bg-amber-950/30 text-amber-100"
                          : "border-amber-500/50 bg-amber-500/10"
                        : hub
                          ? "border-rose-500/35 bg-rose-950/30 text-rose-100"
                          : "border-red-500/40 bg-red-500/10"
                  }`}
                  style={
                    !hub && stateMeta.tone === "ok"
                      ? { color: "var(--color-text)" }
                      : !hub && stateMeta.tone === "warn"
                        ? { color: "var(--color-text)" }
                        : !hub
                          ? { color: "var(--color-text)" }
                          : undefined
                  }
                >
                  <p className="font-semibold">{stateMeta.title}</p>
                  <p className={`mt-1 ${hub ? "opacity-90" : "text-sm"}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                    {stateMeta.desc}
                  </p>
                </div>
              ) : null}

              {detail.state === "ok" ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex rounded-xl border p-1 sm:inline-flex" style={hub ? { borderColor: "rgba(255,255,255,0.12)" } : { borderColor: "var(--color-border)" }}>
                      <button
                        type="button"
                        onClick={() => setTab("followed")}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none ${
                          tab === "followed"
                            ? hub
                              ? "bg-gradient-to-r from-pink-600/80 to-violet-600/80 text-white shadow-lg shadow-pink-900/20"
                              : "bg-neutral-700 text-white"
                            : hub
                              ? "text-slate-400 hover:text-white"
                              : ""
                        }`}
                        style={tab !== "followed" && !hub ? { color: "var(--color-text-secondary)" } : undefined}
                      >
                        Déjà suivies ({detail.followedChannels.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("missing")}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none ${
                          tab === "missing"
                            ? hub
                              ? "bg-gradient-to-r from-pink-600/80 to-violet-600/80 text-white shadow-lg shadow-pink-900/20"
                              : "bg-neutral-700 text-white"
                            : hub
                              ? "text-slate-400 hover:text-white"
                              : ""
                        }`}
                        style={tab !== "missing" && !hub ? { color: "var(--color-text-secondary)" } : undefined}
                      >
                        À découvrir ({detail.notFollowedChannels.length})
                      </button>
                    </div>
                    <div className={`relative flex-1 sm:max-w-xs ${hub ? "text-slate-300" : ""}`}>
                      <Search
                        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${hub ? "text-slate-500" : "text-neutral-500"}`}
                      />
                      <input
                        type="search"
                        value={listQuery}
                        onChange={(e) => setListQuery(e.target.value)}
                        placeholder="Filtrer par pseudo ou nom…"
                        className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 ${
                          hub
                            ? "border-white/15 bg-black/30 text-white placeholder:text-slate-600 focus:border-pink-400/50 focus:ring-pink-500/20"
                            : "rounded-lg border focus:ring-2 focus:ring-emerald-500/25"
                        }`}
                        style={
                          !hub
                            ? {
                                borderColor: "var(--color-border)",
                                backgroundColor: "rgba(10,10,14,0.55)",
                                color: "var(--color-text)",
                              }
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  <section
                    className={`rounded-xl border ${hub ? "border-white/10 bg-white/[0.02]" : ""}`}
                    style={!hub ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" } : undefined}
                  >
                    <div className="max-h-[min(52vh,420px)] overflow-y-auto p-3 md:p-4">
                      {(tab === "followed" ? filteredFollowed : filteredMissing).length === 0 ? (
                        <p className="py-8 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          {listQuery.trim()
                            ? "Aucune chaîne ne correspond à ce filtre."
                            : tab === "followed"
                              ? "Aucune chaîne suivie listée."
                              : "Toutes les chaînes TENF sont suivies — bravo !"}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {(tab === "followed" ? filteredFollowed : filteredMissing).map((channel) => (
                            <li key={`${tab}-${channel.twitchLogin}`}>
                              <div
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition ${
                                  hub
                                    ? "border-white/10 bg-black/20 hover:border-pink-400/25 hover:bg-white/[0.04]"
                                    : ""
                                }`}
                                style={!hub ? { borderColor: "var(--color-border)" } : undefined}
                              >
                                <div className="min-w-0">
                                  <span className="font-medium" style={!hub ? { color: "var(--color-text)" } : undefined}>
                                    {channel.displayName}
                                  </span>
                                  <span className={`ml-2 text-sm ${hub ? "text-slate-500" : ""}`} style={!hub ? { color: "var(--color-text-secondary)" } : undefined}>
                                    @{channel.twitchLogin}
                                  </span>
                                  {channel.isOwnChannel ? (
                                    <span
                                      className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                        hub ? "border border-violet-400/35 bg-violet-500/15 text-violet-200" : ""
                                      }`}
                                      style={
                                        !hub
                                          ? { backgroundColor: "rgba(145, 70, 255, 0.15)", color: "#d7beff" }
                                          : undefined
                                      }
                                    >
                                      Sa chaîne
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => copyText(`ch-${channel.twitchLogin}`, channel.twitchLogin)}
                                    className={`rounded-lg border p-1.5 ${hub ? "border-white/15 text-slate-400 hover:text-white" : ""}`}
                                    style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
                                    title="Copier le login"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <a
                                    href={`https://www.twitch.tv/${encodeURIComponent(channel.twitchLogin)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                                      hub ? "border-pink-400/25 text-pink-200 hover:bg-pink-500/10" : ""
                                    }`}
                                    style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Twitch
                                  </a>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!loading && detail ? (
          <div
            className={`shrink-0 border-t px-5 py-3 text-center text-[11px] md:px-6 ${
              hub ? "border-white/10 bg-black/20 text-slate-500" : ""
            }`}
            style={!hub ? { borderColor: "var(--color-border)", color: "var(--color-text-secondary)" } : undefined}
          >
            Snapshot ID <code className={hub ? "text-slate-400" : ""}>{detail.snapshotId.slice(0, 12)}…</code>
            {" · "}
            Généré le {formatDate(detail.generatedAt)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
