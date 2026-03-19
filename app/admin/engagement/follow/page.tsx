"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatDate(value: string | null | undefined): string {
  if (!value) return "Indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Indisponible";
  return date.toLocaleString("fr-FR");
}

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

export default function AdminEngagementFollowPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runningSnapshot, setRunningSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<FollowOverviewResponse | null>(null);
  const [selectedDiscordId, setSelectedDiscordId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

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
      const response = await fetch("/api/admin/engagement/follow/snapshots/run", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Erreur generation snapshot (${response.status})`);
      }
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setRunningSnapshot(false);
    }
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
    loadOverview();
  }, [hasAccess]);

  const summary = useMemo(() => {
    const rows = overview?.rows || [];
    const okRows = rows.filter((row) => row.state === "ok");
    const linkedRows = rows.filter((row) => row.state !== "not_linked");
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
    };
  }, [overview]);

  const filteredRows = useMemo(() => {
    const rows = overview?.rows || [];
    const query = memberSearch.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
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
  }, [overview, memberSearch]);

  if (checkingAccess) {
    return (
      <div className="text-white">
        <div className="rounded-lg border p-6 text-sm text-gray-300" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          Verification des permissions...
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="text-white">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Follow</h1>
          <p className="text-sm text-gray-400">
            Suivi global du niveau de follow Twitch des membres actifs TENF.
          </p>
        </div>
        <button
          type="button"
          onClick={runSnapshot}
          disabled={runningSnapshot}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          {runningSnapshot ? "Generation snapshot..." : "Generer un nouveau snapshot"}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-xs text-gray-400">Profils suivis</p>
          <p className="text-2xl font-bold">{summary.totalMembers}</p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-xs text-gray-400">Comptes Twitch lies</p>
          <p className="text-2xl font-bold">{summary.linkedMembers}</p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-xs text-gray-400">Calculs valides</p>
          <p className="text-2xl font-bold">{summary.calculableMembers}</p>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-xs text-gray-400">Taux moyen</p>
          <p className="text-2xl font-bold">{summary.averageRate}%</p>
        </div>
      </div>

      <div className="mb-4 text-xs text-gray-400">
        Total chaines actives TENF: <strong>{overview?.totalActiveTenfChannels ?? "—"}</strong>
        {" · "}Dernier snapshot: <strong>{formatDate(overview?.generatedAt)}</strong>
        {overview?.previousGeneratedAt ? (
          <>
            {" · "}Snapshot precedent: <strong>{formatDate(overview.previousGeneratedAt)}</strong>
          </>
        ) : null}
        {" · "}Dernieres donnees recuperees: <strong>{formatDate(overview?.sourceDataRetrievedAt)}</strong>
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            placeholder="Rechercher un membre (nom, @login, compte lie)"
            className="w-full rounded-lg border px-3 py-2 text-sm sm:max-w-md"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "rgba(10,10,14,0.55)",
              color: "var(--color-text)",
            }}
          />
          <p className="text-xs text-gray-400">
            {filteredRows.length} resultat(s) sur {(overview?.rows || []).length}
          </p>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Chargement des donnees follow...</div>
        ) : error ? (
          <div className="py-6 text-sm text-red-300">{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Aucun membre ne correspond a ta recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-neutral-700 text-left text-xs uppercase tracking-wide text-gray-400">
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
                  return (
                    <tr key={`${row.memberTwitchLogin}-${row.discordId || "na"}`} className="border-b border-neutral-800">
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
                        {row.followRate !== null ? `${row.followRate}%` : "—"}
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
                          className="rounded-lg border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          Voir detail
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

      <FollowMemberDetailModal
        open={Boolean(selectedDiscordId)}
        loading={detailLoading}
        detail={detail}
        onClose={() => {
          setSelectedDiscordId(null);
          setDetail(null);
        }}
      />
    </div>
  );
}
