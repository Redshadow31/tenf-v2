"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import FollowMemberDetailModal from "@/components/admin/FollowMemberDetailModal";
import FollowFilterBar from "@/components/admin/follow/FollowFilterBar";
import FollowHubHeader from "@/components/admin/follow/FollowHubHeader";
import FollowOverviewTable from "@/components/admin/follow/FollowOverviewTable";
import FollowStatCards from "@/components/admin/follow/FollowStatCards";
import SnapshotConfirmDialog from "@/components/admin/follow/SnapshotConfirmDialog";
import {
  formatFollowDate,
  type FollowDetailPayload,
  type FollowOverviewResponse,
  type FollowOverviewRow,
  type FollowSummary,
  type SnapshotRunResponse,
  type SnapshotStatusResponse,
  type StateFilter,
} from "@/components/admin/follow/types";

/* ------------------------------------------------------------------------- */
/*  Page Follow                                                              */
/*                                                                           */
/*  Orchestration uniquement : tous les blocs UI sont extraits dans          */
/*  `components/admin/follow/*`. La logique snapshot / polling reste ici.    */
/* ------------------------------------------------------------------------- */

export default function AdminEngagementFollowPage() {
  const pathname = usePathname() || "";
  const hubLayout = pathname.startsWith("/admin/communaute");
  const variant = hubLayout ? "hub" : "default";

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runningSnapshot, setRunningSnapshot] = useState(false);
  const [runningSnapshotId, setRunningSnapshotId] = useState<string | null>(null);
  const [snapshotProgress, setSnapshotProgress] = useState<{ done: number; total: number } | null>(null);
  const [snapshotRequestInflight, setSnapshotRequestInflight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [overview, setOverview] = useState<FollowOverviewResponse | null>(null);
  const [selectedDiscordId, setSelectedDiscordId] = useState<string | null>(null);
  const [selectedRowForRetry, setSelectedRowForRetry] = useState<FollowOverviewRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<FollowDetailPayload | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [showConfirmSnapshot, setShowConfirmSnapshot] = useState(false);

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
    setSelectedRowForRetry(row);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const params = new URLSearchParams();
      if (row.snapshotId) params.set("snapshotId", row.snapshotId);
      const response = await fetch(
        `/api/admin/engagement/follow/detail/${encodeURIComponent(row.discordId)}${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        let serverMessage = "";
        try {
          const errBody = await response.json();
          if (errBody && typeof errBody.error === "string") serverMessage = errBody.error;
        } catch {
          /* corps non JSON, on garde le message générique */
        }
        throw new Error(serverMessage || `Erreur détail (${response.status})`);
      }
      const payload = (await response.json()) as FollowDetailPayload;
      setDetail(payload);
    } catch (err) {
      setDetail(null);
      setDetailError(err instanceof Error ? err.message : "Erreur inconnue lors du chargement du détail");
    } finally {
      setDetailLoading(false);
    }
  }

  async function performSnapshot() {
    try {
      setSnapshotRequestInflight(true);
      setRunningSnapshot(true);
      setError(null);
      setNotice(null);
      const response = await fetch("/api/admin/engagement/follow/snapshots/run", {
        method: "POST",
      });
      if (!response.ok && response.status !== 202) {
        throw new Error(`Erreur génération snapshot (${response.status})`);
      }
      const payload = (await response.json()) as SnapshotRunResponse;
      if (!payload.snapshotId) {
        throw new Error("Impossible de récupérer l'identifiant du snapshot en cours");
      }
      setRunningSnapshotId(payload.snapshotId);
      if (payload.status === "completed") {
        setRunningSnapshot(false);
        setRunningSnapshotId(null);
        setSnapshotProgress(null);
        setNotice("Snapshot terminé. Données rechargées.");
        await loadOverview();
        setShowConfirmSnapshot(false);
      } else if (payload.alreadyRunning) {
        setSnapshotProgress(null);
        setNotice("Un snapshot était déjà en cours. Suivi du statut activé.");
      } else {
        setSnapshotProgress(null);
        setNotice("Génération du snapshot lancée. Mise à jour automatique en cours…");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setRunningSnapshot(false);
      setShowConfirmSnapshot(false);
    } finally {
      setSnapshotRequestInflight(false);
    }
  }

  function requestSnapshot() {
    if (runningSnapshot || snapshotRequestInflight) return;
    setShowConfirmSnapshot(true);
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
          setSnapshotProgress({
            done: latestSnapshot.progressDone ?? 0,
            total: latestSnapshot.progressTotal ?? 0,
          });
          setNotice("Un snapshot est en cours. Suivi du statut activé.");
        }
      } catch (_error) {
        // On ignore ici, le tableau reste utilisable même sans statut.
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
          setSnapshotProgress(null);
          setShowConfirmSnapshot(false);
          setError("La génération du snapshot a échoué.");
          setNotice(null);
          return;
        }

        if (snapshot.status === "completed") {
          setRunningSnapshot(false);
          setRunningSnapshotId(null);
          setSnapshotProgress(null);
          setShowConfirmSnapshot(false);
          setNotice("Snapshot terminé. Données rechargées.");
          await loadOverview();
          return;
        }

        // Toujours en cours : on rafraichit la progression affichee.
        setSnapshotProgress({
          done: snapshot.progressDone ?? 0,
          total: snapshot.progressTotal ?? 0,
        });
      } catch (err) {
        if (cancelled) return;
        setRunningSnapshot(false);
        setRunningSnapshotId(null);
        setSnapshotProgress(null);
        setShowConfirmSnapshot(false);
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

  const summary: FollowSummary = useMemo(() => {
    const rows = overview?.rows || [];
    const okRows = rows.filter((row) => row.state === "ok");
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
          <div
            className="rounded-lg border p-6 text-sm text-gray-300"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            Vérification des permissions…
          </div>
        )}
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className={hubLayout ? "min-h-screen bg-[#07080f] text-white" : "text-white"}>
      <div className={hubLayout ? "mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6" : ""}>
        <FollowHubHeader
          variant={variant}
          runningSnapshot={runningSnapshot}
          snapshotRequestInflight={snapshotRequestInflight}
          onRequestSnapshot={requestSnapshot}
        />

        {runningSnapshot ? (
          <div
            role="status"
            aria-live="polite"
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              hubLayout
                ? "animate-fadeIn border-cyan-500/35 bg-cyan-950/35 text-cyan-100"
                : "rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-200"
            }`}
          >
            <div>
              Génération en cours{runningSnapshotId ? ` (id\u00a0: ${runningSnapshotId.slice(0, 8)}…)` : ""}.{" "}
              {hubLayout
                ? "Cette page se mettra à jour automatiquement à la fin du snapshot."
                : "L\u2019écran sera mis à jour automatiquement dès que le snapshot est terminé."}
            </div>
            {snapshotProgress && snapshotProgress.total > 0 ? (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs font-medium">
                  <span>
                    {snapshotProgress.done} / {snapshotProgress.total} chaînes actives calculées
                  </span>
                  <span>
                    {Math.min(
                      100,
                      Math.round((snapshotProgress.done / snapshotProgress.total) * 100)
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyan-500/15">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-[width] duration-500 ease-out"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((snapshotProgress.done / snapshotProgress.total) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cyan-500/15">
                <div className="h-full w-full animate-pulse rounded-full bg-cyan-400/70" />
              </div>
            )}
          </div>
        ) : null}

        <FollowStatCards variant={variant} summary={summary} />

        <FollowFilterBar
          variant={variant}
          stateFilter={stateFilter}
          summary={summary}
          onChange={setStateFilter}
        />

        <div
          className={`mb-4 text-xs ${
            hubLayout ? "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-400" : "text-gray-400"
          }`}
        >
          Total chaînes actives TENF&nbsp;:{" "}
          <strong className="text-slate-200">{overview?.totalActiveTenfChannels ?? "—"}</strong>
          {" · "}Dernier snapshot&nbsp;:{" "}
          <strong className="text-slate-200">{formatFollowDate(overview?.generatedAt)}</strong>
          {overview?.previousGeneratedAt ? (
            <>
              {" · "}Snapshot précédent&nbsp;:{" "}
              <strong className="text-slate-200">{formatFollowDate(overview.previousGeneratedAt)}</strong>
            </>
          ) : null}
          {" · "}Données récupérées&nbsp;:{" "}
          <strong className="text-slate-200">{formatFollowDate(overview?.sourceDataRetrievedAt)}</strong>
        </div>

        <FollowOverviewTable
          variant={variant}
          loading={loading}
          error={error}
          notice={notice}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          stateFilter={stateFilter}
          filteredRows={filteredRows}
          totalRows={(overview?.rows || []).length}
          onOpenDetail={openDetail}
        />
      </div>

      <FollowMemberDetailModal
        open={Boolean(selectedDiscordId)}
        loading={detailLoading}
        detail={detail}
        error={detailError}
        onRetry={
          detailError && selectedRowForRetry
            ? () => {
                void openDetail(selectedRowForRetry);
              }
            : undefined
        }
        variant={hubLayout ? "hub" : "default"}
        onClose={() => {
          setSelectedDiscordId(null);
          setDetail(null);
          setDetailError(null);
          setSelectedRowForRetry(null);
        }}
      />

      <SnapshotConfirmDialog
        open={showConfirmSnapshot}
        loading={snapshotRequestInflight}
        running={runningSnapshot}
        progressDone={snapshotProgress?.done ?? null}
        progressTotal={snapshotProgress?.total ?? null}
        onCancel={() => {
          if (!snapshotRequestInflight) setShowConfirmSnapshot(false);
        }}
        onConfirm={() => {
          void performSnapshot();
        }}
      />
    </div>
  );
}
