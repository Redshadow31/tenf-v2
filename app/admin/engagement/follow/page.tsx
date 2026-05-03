"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  Heart,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import FollowMemberDetailModal from "@/components/admin/FollowMemberDetailModal";

type FollowOverviewRow = {
  discordId: string | null;
  displayName: string;
  memberTwitchLogin: string;
  linkedTwitchLogin: string | null;
  linkedTwitchDisplayName: string | null;
  followedCount: number | null;
  totalActiveTenfChannels: number;
  followRate: number | null;
  lastCalculatedAt: string | null;
  state: "ok" | "not_linked" | "calculation_impossible";
  reason: string | null;
  snapshotId?: string;
  snapshotGeneratedAt?: string;
  isStaleFromPreviousSnapshot?: boolean;
  previousFollowRate?: number | null;
  deltaFollowRate?: number | null;
};

type FollowOverviewResponse = {
  snapshotId: string | null;
  generatedAt: string | null;
  sourceDataRetrievedAt: string | null;
  totalActiveTenfChannels: number;
  trackedMembersCount: number;
  rows: FollowOverviewRow[];
  previousSnapshotId?: string | null;
  previousGeneratedAt?: string | null;
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
  followedChannels: Array<{
    twitchLogin: string;
    twitchId: string | null;
    displayName: string;
    isOwnChannel: boolean;
  }>;
  notFollowedChannels: Array<{
    twitchLogin: string;
    twitchId: string | null;
    displayName: string;
    isOwnChannel: boolean;
  }>;
  lastCalculatedAt: string | null;
};

type SnapshotRunResponse = {
  success: boolean;
  snapshotId: string;
  status: "running" | "completed";
  alreadyRunning: boolean;
};

type SnapshotStatusResponse = {
  success: boolean;
  snapshot: {
    snapshotId: string;
    status: "running" | "completed" | "failed";
    generatedAt: string;
    createdAt: string;
  } | null;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Indisponible";
  return date.toLocaleString("fr-FR");
}

const hubHeroClass =
  "relative overflow-hidden rounded-3xl border border-pink-400/20 bg-[linear-gradient(155deg,rgba(236,72,153,0.12),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const hubCardClass =
  "rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(30,27,45,0.85),rgba(11,13,20,0.92))] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleLinkClass =
  "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-pink-400/35 hover:bg-white/[0.1]";

function stateBadge(row: FollowOverviewRow): { label: string; className: string } {
  if (row.state === "ok") {
    return {
      label: "Calcule",
      className: "bg-green-500/20 text-green-300 border border-green-500/30",
    };
  }
  if (row.state === "not_linked") {
    return {
      label: "Compte Twitch non lie",
      className: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    };
  }
  return {
    label: "Calcul impossible",
    className: "bg-red-500/20 text-red-300 border border-red-500/30",
  };
}

type StateFilter = "all" | "ok" | "not_linked" | "impossible";

export default function AdminEngagementFollowPage() {
  const pathname = usePathname() || "";
  const hubLayout = pathname.startsWith("/admin/communaute");

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runningSnapshot, setRunningSnapshot] = useState(false);
  const [runningSnapshotId, setRunningSnapshotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [overview, setOverview] = useState<FollowOverviewResponse | null>(null);
  const [selectedDiscordId, setSelectedDiscordId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/engagement/follow/overview", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Erreur chargement (${response.status})`);
      }
      const payload = (await response.json()) as FollowOverviewResponse;
      setOverview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(row: FollowOverviewRow) {
    if (!row.discordId) return;
    setSelectedDiscordId(row.discordId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const params = new URLSearchParams();
      if (row.snapshotId) params.set("snapshotId", row.snapshotId);
      const response = await fetch(
        `/api/admin/engagement/follow/detail/${encodeURIComponent(row.discordId)}${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(`Erreur detail (${response.status})`);
      }
      const payload = (await response.json()) as DetailPayload;
      setDetail(payload);
    } catch (_err) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function runSnapshot() {
    try {
      setRunningSnapshot(true);
      setError(null);
      setNotice(null);
      const response = await fetch("/api/admin/engagement/follow/snapshots/run", {
        method: "POST",
      });
      if (!response.ok && response.status !== 202) {
        throw new Error(`Erreur generation snapshot (${response.status})`);
      }
      const payload = (await response.json()) as SnapshotRunResponse;
      if (!payload.snapshotId) {
        throw new Error("Impossible de recuperer l'identifiant du snapshot en cours");
      }
      setRunningSnapshotId(payload.snapshotId);
      if (payload.status === "completed") {
        setRunningSnapshot(false);
        setRunningSnapshotId(null);
        setNotice("Snapshot termine. Donnees rechargees.");
        await loadOverview();
      } else if (payload.alreadyRunning) {
        setNotice("Un snapshot etait deja en cours. Suivi du statut active.");
      } else {
        setNotice("Generation du snapshot lancee. Mise a jour automatique en cours...");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setRunningSnapshot(false);
    }
  }

  async function loadSnapshotStatus(snapshotId?: string): Promise<SnapshotStatusResponse["snapshot"]> {
    const params = new URLSearchParams();
    if (snapshotId) params.set("snapshotId", snapshotId);
    const response = await fetch(
      `/api/admin/engagement/follow/snapshots/status${params.toString() ? `?${params.toString()}` : ""}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error(`Erreur statut snapshot (${response.status})`);
    }
    const payload = (await response.json()) as SnapshotStatusResponse;
    return payload.snapshot;
  }

  useEffect(() => {
    async function verifyAccess() {
      try {
        setCheckingAccess(true);
        const response = await fetch("/api/admin/engagement/follow/access", {
          cache: "no-store",
        });
        if (!response.ok) {
          window.location.href = "/unauthorized?reason=advanced-admin";
          return;
        }
        setHasAccess(true);
      } catch (_error) {
        window.location.href = "/unauthorized?reason=advanced-admin";
      } finally {
        setCheckingAccess(false);
      }
    }
    verifyAccess();
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    async function loadInitialData() {
      await loadOverview();
      try {
        const latestSnapshot = await loadSnapshotStatus();
        if (latestSnapshot?.status === "running") {
          setRunningSnapshot(true);
          setRunningSnapshotId(latestSnapshot.snapshotId);
          setNotice("Un snapshot est en cours. Suivi du statut active.");
        }
      } catch (_error) {
        // On ignore ici, le tableau reste utilisable meme sans statut.
      }
    }
    void loadInitialData();
  }, [hasAccess]);

  useEffect(() => {
    if (!hasAccess || !runningSnapshot || !runningSnapshotId) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        const snapshot = await loadSnapshotStatus(runningSnapshotId);
        if (cancelled) return;

        if (!snapshot) {
          timeoutId = setTimeout(tick, 3000);
          return;
        }

        if (snapshot.status === "failed") {
          setRunningSnapshot(false);
          setRunningSnapshotId(null);
          setError("La generation du snapshot a echoue.");
          setNotice(null);
          return;
        }

        if (snapshot.status === "completed") {
          setRunningSnapshot(false);
          setRunningSnapshotId(null);
          setNotice("Snapshot termine. Donnees rechargees.");
          await loadOverview();
          return;
        }
      } catch (err) {
        if (cancelled) return;
        setRunningSnapshot(false);
        setRunningSnapshotId(null);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        return;
      }

      timeoutId = setTimeout(tick, 3000);
    };

    timeoutId = setTimeout(tick, 1200);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasAccess, runningSnapshot, runningSnapshotId]);

  const summary = useMemo(() => {
    const rows = overview?.rows || [];
    const okRows = rows.filter((row) => row.state === "ok");
    const linkedRows = rows.filter((row) => row.state !== "not_linked");
    const notLinkedCount = rows.filter((row) => row.state === "not_linked").length;
    const impossibleCount = rows.filter((row) => row.state === "calculation_impossible").length;
    const averageRate =
      okRows.length > 0
        ? Number(
            (
              okRows.reduce((sum, row) => sum + (row.followRate || 0), 0) /
              okRows.length
            ).toFixed(1)
          )
        : 0;

    return {
      totalMembers: overview?.trackedMembersCount ?? rows.length,
      linkedMembers: linkedRows.length,
      calculableMembers: okRows.length,
      averageRate,
      notLinkedCount,
      impossibleCount,
    };
  }, [overview]);

  const filteredRows = useMemo(() => {
    const rows = overview?.rows || [];
    const query = memberSearch.trim().toLowerCase();
    let next = rows;
    if (query) {
      next = next.filter((row) => {
        const searchable = [
          row.displayName,
          row.memberTwitchLogin,
          row.linkedTwitchLogin || "",
          row.linkedTwitchDisplayName || "",
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(query);
      });
    }
    if (stateFilter === "ok") return next.filter((row) => row.state === "ok");
    if (stateFilter === "not_linked") return next.filter((row) => row.state === "not_linked");
    if (stateFilter === "impossible") return next.filter((row) => row.state === "calculation_impossible");
    return next;
  }, [overview, memberSearch, stateFilter]);

  if (checkingAccess) {
    return (
      <div className={hubLayout ? "min-h-[40vh] text-white" : "text-white"}>
        {hubLayout ? (
          <div className="mx-auto max-w-3xl animate-fadeIn space-y-4 px-4 py-12">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-white/10" />
            <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
            <p className="text-center text-sm text-slate-400">Vérification des accès staff…</p>
          </div>
        ) : (
          <div className="rounded-lg border p-6 text-sm text-gray-300" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            Verification des permissions...
          </div>
        )}
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const statCardBase =
    "w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/50";
  const statCardStyle = hubLayout
    ? `${hubCardClass} hover:border-pink-400/30 hover:shadow-[0_12px_36px_rgba(236,72,153,0.12)]`
    : "rounded-lg border";
  const statCardInline = !hubLayout ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" } : undefined;

  return (
    <div className={hubLayout ? "min-h-screen bg-[#07080f] text-white" : "text-white"}>
      <div className={hubLayout ? "mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6" : ""}>
        {hubLayout ? (
          <section className={`${hubHeroClass} mb-8 p-6 md:p-8`}>
            <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <Link
                  href="/admin/communaute/engagement"
                  className="inline-flex items-center gap-2 text-sm text-pink-100/90 transition hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Hub engagement
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-400/35 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-100">
                    <Heart className="h-3.5 w-3.5" />
                    Entraide chaînes TENF
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pilotage staff
                  </span>
                </div>
                <h1 className="mt-4 flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
                  <Users className="h-9 w-9 shrink-0 text-pink-300 md:h-10 md:w-10" />
                  Follows mutuels
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Vue live du <strong className="text-white">taux de follow</strong> des membres vers les chaînes TENF actives :
                  repère qui soutient l&apos;écosystème, détecte les comptes non reliés, et ouvre le détail pour accompagner un membre
                  sans le mettre sur la défensive.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/admin/communaute/engagement/feuilles-follow" className={subtleLinkClass}>
                    Feuilles de suivi
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/admin/communaute/engagement/config-follow" className={subtleLinkClass}>
                    Paramètres follow
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/admin/communaute/engagement/points-discord" className={subtleLinkClass}>
                    Points Discord
                    <BarChart3 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={runSnapshot}
                  disabled={runningSnapshot}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-400/40 bg-gradient-to-r from-pink-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${runningSnapshot ? "animate-spin" : ""}`} />
                  {runningSnapshot ? "Snapshot en cours…" : "Nouveau snapshot"}
                </button>
                <p className="max-w-xs text-right text-[11px] text-slate-500">
                  Recalcule les follows pour toute la base suivie. Peut prendre quelques minutes.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Follow</h1>
              <p className="text-sm text-gray-400">Suivi global du niveau de follow Twitch des membres actifs TENF.</p>
            </div>
            <button
              type="button"
              onClick={runSnapshot}
              disabled={runningSnapshot}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {runningSnapshot ? "Snapshot en cours..." : "Generer un nouveau snapshot"}
            </button>
          </div>
        )}

        {runningSnapshot ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              hubLayout
                ? "animate-fadeIn border-cyan-500/35 bg-cyan-950/35 text-cyan-100"
                : "rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-200"
            }`}
          >
            Génération en cours{runningSnapshotId ? ` (id: ${runningSnapshotId.slice(0, 8)}…)` : ""}.{" "}
            {hubLayout
              ? "Cette page se mettra à jour automatiquement à la fin du snapshot."
              : "L'ecran sera mis a jour automatiquement des que le snapshot est termine."}
          </div>
        ) : null}

        <div className={`mb-6 grid gap-4 md:grid-cols-4 ${hubLayout ? "" : ""}`}>
          <button
            type="button"
            onClick={() => setStateFilter("all")}
            className={`${statCardBase} ${statCardStyle} ${
              stateFilter === "all" && hubLayout ? "ring-2 ring-pink-400/45 ring-offset-2 ring-offset-[#07080f]" : ""
            } ${stateFilter === "all" && !hubLayout ? "ring-2 ring-white/20" : ""}`}
            style={statCardInline}
          >
            <p className="text-xs text-gray-400">Profils suivis</p>
            <p className="text-2xl font-bold text-white">{summary.totalMembers}</p>
            {hubLayout ? <p className="mt-1 text-[11px] text-slate-500">Réinitialiser le filtre état</p> : null}
          </button>
          <button
            type="button"
            onClick={() => setStateFilter(stateFilter === "not_linked" ? "all" : "not_linked")}
            className={`${statCardBase} ${statCardStyle} ${
              stateFilter === "not_linked" && hubLayout ? "ring-2 ring-amber-400/45 ring-offset-2 ring-offset-[#07080f]" : ""
            } ${stateFilter === "not_linked" && !hubLayout ? "ring-2 ring-white/20" : ""}`}
            style={statCardInline}
          >
            <p className="text-xs text-gray-400">{hubLayout ? "Sans lien Twitch" : "Comptes Twitch liés"}</p>
            <p className="text-2xl font-bold text-amber-300">{hubLayout ? summary.notLinkedCount : summary.linkedMembers}</p>
            {hubLayout ? (
              <p className="mt-1 text-[11px] text-slate-500">À rapprocher d&apos;un compte chaîne (toggle)</p>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setStateFilter(stateFilter === "ok" ? "all" : "ok")}
            className={`${statCardBase} ${statCardStyle} ${
              stateFilter === "ok" && hubLayout ? "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-[#07080f]" : ""
            } ${stateFilter === "ok" && !hubLayout ? "ring-2 ring-white/20" : ""}`}
            style={statCardInline}
          >
            <p className="text-xs text-gray-400">Calculs valides</p>
            <p className="text-2xl font-bold text-cyan-300">{summary.calculableMembers}</p>
            {hubLayout ? <p className="mt-1 text-[11px] text-slate-500">Uniquement état « calculé » (toggle)</p> : null}
          </button>
          <button
            type="button"
            onClick={() => setStateFilter(stateFilter === "impossible" ? "all" : "impossible")}
            className={`${statCardBase} ${statCardStyle} ${
              stateFilter === "impossible" && hubLayout ? "ring-2 ring-rose-400/45 ring-offset-2 ring-offset-[#07080f]" : ""
            } ${stateFilter === "impossible" && !hubLayout ? "ring-2 ring-white/20" : ""}`}
            style={statCardInline}
          >
            <p className="text-xs text-gray-400">{hubLayout ? "Taux moyen & blocages" : "Taux moyen"}</p>
            <p className="text-2xl font-bold text-pink-200">{summary.averageRate}%</p>
            {hubLayout ? (
              <p className="mt-1 text-[11px] text-slate-500">
                {summary.impossibleCount} « calcul impossible » — cliquer pour filtrer (toggle)
              </p>
            ) : null}
          </button>
        </div>

        {hubLayout ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                { id: "all" as const, label: "Tous les états" },
                { id: "ok" as const, label: "Calculé" },
                { id: "not_linked" as const, label: "Non lié Twitch" },
                { id: "impossible" as const, label: "Calcul impossible" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStateFilter(chip.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  stateFilter === chip.id
                    ? "border-pink-400/50 bg-pink-500/20 text-pink-50"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-pink-400/25 hover:text-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={`mb-4 text-xs ${hubLayout ? "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-400" : "text-gray-400"}`}
        >
          Total chaînes actives TENF: <strong className="text-slate-200">{overview?.totalActiveTenfChannels ?? "—"}</strong>
          {" · "}Dernier snapshot: <strong className="text-slate-200">{formatDate(overview?.generatedAt)}</strong>
          {overview?.previousGeneratedAt ? (
            <>
              {" · "}Snapshot précédent: <strong className="text-slate-200">{formatDate(overview.previousGeneratedAt)}</strong>
            </>
          ) : null}
          {" · "}Données récupérées: <strong className="text-slate-200">{formatDate(overview?.sourceDataRetrievedAt)}</strong>
        </div>

        <div
          className={`rounded-2xl border p-4 md:p-5 ${
            hubLayout ? `${hubCardClass} border-white/10` : "rounded-lg border"
          }`}
          style={!hubLayout ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" } : undefined}
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              {hubLayout ? (
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              ) : null}
              <input
                type="text"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Rechercher un membre (nom, @login, compte lié)"
                className={`w-full rounded-xl border py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 sm:max-w-md ${
                  hubLayout ? "border-white/15 bg-black/30 pl-10 pr-3" : "rounded-lg border px-3 py-2"
                }`}
                style={
                  !hubLayout
                    ? {
                        borderColor: "var(--color-border)",
                        backgroundColor: "rgba(10,10,14,0.55)",
                        color: "var(--color-text)",
                      }
                    : undefined
                }
              />
            </div>
            <p className="text-xs text-gray-400">
              {filteredRows.length} résultat(s) sur {(overview?.rows || []).length}
              {stateFilter !== "all" ? ` · filtre état` : ""}
            </p>
          </div>
          {notice ? (
            <div
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                hubLayout ? "animate-fadeIn border-cyan-500/35 bg-cyan-950/30 text-cyan-100" : "text-xs text-cyan-200"
              }`}
            >
              {notice}
            </div>
          ) : null}
          {error ? (
            <div
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                hubLayout ? "border-rose-500/40 bg-rose-950/30 text-rose-100" : "py-6 text-red-300"
              }`}
            >
              {error}
            </div>
          ) : null}
          {loading ? (
            hubLayout ? (
              <div className="space-y-3 py-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="h-4 w-1/3 rounded bg-white/10" />
                    <div className="mt-3 h-3 w-full rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-gray-400">Chargement des donnees follow...</div>
            )
          ) : filteredRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {memberSearch.trim() || stateFilter !== "all"
                ? "Aucun membre ne correspond à ces critères."
                : "Aucune donnée à afficher."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className={`w-full min-w-[980px] ${hubLayout ? "text-sm" : ""}`}>
                <thead>
                  <tr
                    className={`border-b text-left text-xs uppercase tracking-wide ${
                      hubLayout ? "border-white/10 bg-black/30 text-slate-500" : "border-neutral-700 text-gray-400"
                    }`}
                  >
                    <th className="px-3 py-3">Membre</th>
                    <th className="px-3 py-3">Compte Twitch lie</th>
                    <th className="px-3 py-3">Suivies</th>
                    <th className="px-3 py-3">Total TENF</th>
                    <th className="px-3 py-3">Progression</th>
                    <th className="px-3 py-3">Delta</th>
                    <th className="px-3 py-3">Etat</th>
                    <th className="px-3 py-3">Snapshot source</th>
                    <th className="px-3 py-3">Dernier calcul</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const badge = stateBadge(row);
                    const rate = row.followRate;
                    return (
                      <tr
                        key={`${row.memberTwitchLogin}-${row.discordId || "na"}`}
                        className={`border-b transition ${
                          hubLayout
                            ? "border-white/5 hover:bg-white/[0.04]"
                            : "border-neutral-800"
                        }`}
                      >
                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold">{row.displayName}</div>
                        <div className="text-xs text-gray-400">@{row.memberTwitchLogin}</div>
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        {row.linkedTwitchLogin ? (
                          <span>
                            {row.linkedTwitchDisplayName || row.linkedTwitchLogin} (@{row.linkedTwitchLogin})
                          </span>
                        ) : (
                          <span className="text-gray-400">Aucun</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        {row.followedCount !== null ? row.followedCount : "—"}
                      </td>
                      <td className="px-3 py-3 align-top text-sm">{row.totalActiveTenfChannels}</td>
                      <td className="px-3 py-3 align-top text-sm">
                        {rate !== null && hubLayout ? (
                          <div className="flex max-w-[140px] flex-col gap-1.5">
                            <span className="font-medium text-pink-100">{rate}%</span>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
                                style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                              />
                            </div>
                          </div>
                        ) : row.followRate !== null ? (
                          `${row.followRate}%`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        {row.deltaFollowRate != null
                          ? `${row.deltaFollowRate > 0 ? "+" : ""}${row.deltaFollowRate}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] ${badge.className}`}>
                            {badge.label}
                          </span>
                          {row.isStaleFromPreviousSnapshot ? (
                            <span className="inline-flex rounded-full bg-fuchsia-500/20 px-2 py-1 text-[11px] text-fuchsia-200 border border-fuchsia-500/30">
                              Snapshot precedent
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-gray-400">
                        {formatDate(row.snapshotGeneratedAt || null)}
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-gray-400">
                        {formatDate(row.lastCalculatedAt)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          type="button"
                          disabled={!row.discordId || !row.snapshotId}
                          onClick={() => openDetail(row)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                            hubLayout
                              ? "border-pink-400/35 bg-pink-500/15 text-pink-100 transition hover:bg-pink-500/25"
                              : ""
                          }`}
                          style={!hubLayout ? { borderColor: "var(--color-border)", color: "var(--color-text)" } : undefined}
                        >
                          Voir détail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      <FollowMemberDetailModal
        open={Boolean(selectedDiscordId)}
        loading={detailLoading}
        detail={detail}
        variant={hubLayout ? "hub" : "default"}
        onClose={() => {
          setSelectedDiscordId(null);
          setDetail(null);
        }}
      />
    </div>
  );
}
