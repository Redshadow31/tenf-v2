"use client";

import { ChevronsRight, Search } from "lucide-react";
import {
  formatFollowDate,
  STATE_FILTER_LABELS,
  type FollowLayoutVariant,
  type FollowOverviewRow,
  type StateFilter,
} from "./types";

const hubCardClass =
  "rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(30,27,45,0.85),rgba(11,13,20,0.92))] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

function stateBadge(row: FollowOverviewRow): { label: string; className: string } {
  if (row.state === "ok") {
    return {
      label: "Calculé",
      className: "bg-green-500/20 text-green-300 border border-green-500/30",
    };
  }
  if (row.state === "not_linked") {
    return {
      label: "Compte Twitch non lié",
      className: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    };
  }
  return {
    label: "Calcul impossible",
    className: "bg-red-500/20 text-red-300 border border-red-500/30",
  };
}

export type FollowOverviewTableProps = {
  variant: FollowLayoutVariant;
  loading: boolean;
  error: string | null;
  notice: string | null;
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  stateFilter: StateFilter;
  filteredRows: FollowOverviewRow[];
  totalRows: number;
  onOpenDetail: (row: FollowOverviewRow) => void;
};

/**
 * Carte « tableau » contenant :
 *  - barre de recherche + compteur de résultats ;
 *  - notice / erreur ;
 *  - skeleton de chargement ;
 *  - état vide (filtré ou non) ;
 *  - tableau des lignes follow avec bouton "Voir détail".
 *
 * Aucune logique snapshot ni filtrage ici : le composant reçoit déjà la liste
 * filtrée et délègue toutes les actions sensibles à `onOpenDetail` /
 * `onMemberSearchChange`.
 */
export default function FollowOverviewTable({
  variant,
  loading,
  error,
  notice,
  memberSearch,
  onMemberSearchChange,
  stateFilter,
  filteredRows,
  totalRows,
  onOpenDetail,
}: FollowOverviewTableProps) {
  const hubLayout = variant === "hub";

  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 ${
        hubLayout ? `${hubCardClass} border-white/10` : "rounded-lg border"
      }`}
      style={
        !hubLayout
          ? { borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }
          : undefined
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          {hubLayout ? (
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
          ) : null}
          <input
            type="search"
            value={memberSearch}
            onChange={(event) => onMemberSearchChange(event.target.value)}
            placeholder="Rechercher un membre (nom, @login, compte lié)"
            aria-label="Rechercher un membre par pseudo ou compte lié"
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
        <p className="text-xs text-gray-400" aria-live="polite">
          {filteredRows.length} résultat(s) sur {totalRows}
          {stateFilter !== "all" ? ` · filtre : ${STATE_FILTER_LABELS[stateFilter]}` : ""}
        </p>
      </div>
      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
            hubLayout ? "animate-fadeIn border-cyan-500/35 bg-cyan-950/30 text-cyan-100" : "text-xs text-cyan-200"
          }`}
        >
          {notice}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
            hubLayout ? "border-rose-500/40 bg-rose-950/30 text-rose-100" : "py-6 text-red-300"
          }`}
        >
          {error}
        </div>
      ) : null}
      {loading ? (
        hubLayout ? (
          <div className="space-y-3 py-6" role="status" aria-live="polite">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="mt-3 h-3 w-full rounded bg-white/5" />
              </div>
            ))}
            <span className="sr-only">Chargement des données follow…</span>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400" role="status" aria-live="polite">
            Chargement des données follow…
          </div>
        )
      ) : filteredRows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          {memberSearch.trim() || stateFilter !== "all"
            ? "Aucun membre ne correspond à ces critères."
            : "Aucune donnée à afficher."}
        </div>
      ) : (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500 sm:hidden">
            <ChevronsRight className="h-3 w-3" aria-hidden />
            Fais défiler horizontalement pour voir toutes les colonnes.
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className={`w-full min-w-[980px] ${hubLayout ? "text-sm" : ""}`}>
              <thead>
                <tr
                  className={`border-b text-left text-xs uppercase tracking-wide ${
                    hubLayout ? "border-white/10 bg-black/30 text-slate-500" : "border-neutral-700 text-gray-400"
                  }`}
                >
                  <th className="px-3 py-3">Membre</th>
                  <th className="px-3 py-3">Compte Twitch lié</th>
                  <th className="px-3 py-3">Suivies</th>
                  <th className="px-3 py-3">Total TENF</th>
                  <th className="px-3 py-3">Progression</th>
                  <th className="px-3 py-3">Delta</th>
                  <th className="px-3 py-3">État</th>
                  <th className="px-3 py-3">Snapshot source</th>
                  <th className="px-3 py-3">Dernier calcul</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const badge = stateBadge(row);
                  const rate = row.followRate;
                  const detailDisabledReason = !row.discordId
                    ? "Détail indisponible : aucun Discord ID associé."
                    : !row.snapshotId
                    ? "Détail indisponible : aucun snapshot associé."
                    : null;
                  const detailDisabled = Boolean(detailDisabledReason);
                  return (
                    <tr
                      key={`${row.memberTwitchLogin}-${row.discordId || "na"}`}
                      className={`border-b transition ${
                        hubLayout ? "border-white/5 hover:bg-white/[0.04]" : "border-neutral-800"
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
                            <div
                              className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                              role="progressbar"
                              aria-valuenow={Math.round(rate)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Progression du follow pour ${row.displayName}`}
                            >
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
                            <span className="inline-flex rounded-full border border-fuchsia-500/30 bg-fuchsia-500/20 px-2 py-1 text-[11px] text-fuchsia-200">
                              Snapshot précédent
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-gray-400">
                        {formatFollowDate(row.snapshotGeneratedAt || null)}
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-gray-400">
                        {formatFollowDate(row.lastCalculatedAt)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          type="button"
                          disabled={detailDisabled}
                          onClick={() => onOpenDetail(row)}
                          title={detailDisabledReason || `Voir le détail follow de @${row.memberTwitchLogin}`}
                          aria-label={
                            detailDisabled
                              ? `${detailDisabledReason} — Voir détail de @${row.memberTwitchLogin}`
                              : `Voir le détail follow de @${row.memberTwitchLogin}`
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/45 disabled:cursor-not-allowed disabled:opacity-50 ${
                            hubLayout
                              ? "border-pink-400/35 bg-pink-500/15 text-pink-100 transition hover:bg-pink-500/25"
                              : ""
                          }`}
                          style={
                            !hubLayout
                              ? { borderColor: "var(--color-border)", color: "var(--color-text)" }
                              : undefined
                          }
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
        </>
      )}
    </div>
  );
}
