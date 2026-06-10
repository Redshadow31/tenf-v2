"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Loader2, RefreshCw } from "lucide-react";
import {
  MEMBER_LOG_CATEGORY_LABELS,
  type MemberChangeLogCategory,
  type MemberChangeLogEntry,
} from "@/lib/admin/members-fiche/memberChangeLog";
import { ficheFocusRing } from "@/lib/admin/members-fiche/memberFicheStyles";
import {
  MemberFicheFieldGrid,
  MemberFichePanel,
  MemberFicheSkeleton,
  MemberFicheStatCard,
  MemberFicheTableHead,
  MemberFicheTableRow,
  MemberFicheTableShell,
} from "@/components/admin/members-gestion/MemberFicheLayout";

type Props = {
  memberId: string;
};

const CATEGORY_TONE: Record<MemberChangeLogCategory, string> = {
  identity: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  profile: "border-violet-500/30 bg-violet-500/10 text-violet-100",
  status: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  role: "border-indigo-500/30 bg-indigo-500/10 text-indigo-100",
  notes: "border-sky-500/30 bg-sky-500/10 text-sky-100",
  admin: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
};

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

export default function MemberFicheLogsPanel({ memberId }: Props) {
  const [entries, setEntries] = useState<MemberChangeLogEntry[]>([]);
  const [counts, setCounts] = useState<Record<MemberChangeLogCategory, number>>({
    identity: 0,
    profile: 0,
    status: 0,
    role: 0,
    notes: 0,
    admin: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MemberChangeLogCategory | "all">("all");

  const loadLogs = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/member-logs`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger le journal");
      }
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      if (data.counts && typeof data.counts === "object") {
        setCounts(data.counts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.category === filter);
  }, [entries, filter]);

  const categoriesWithData = useMemo(
    () =>
      (Object.keys(MEMBER_LOG_CATEGORY_LABELS) as MemberChangeLogCategory[]).filter(
        (cat) => (counts[cat] || 0) > 0
      ),
    [counts]
  );

  return (
    <div className="space-y-4">
      <MemberFichePanel
        kicker="Journal"
        title="Log membre"
        intro="Historique des changements : pseudos, IDs, bio, infos profil, roles, statuts et actions staff."
        tone="sky"
        headerRight={
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:text-white ${ficheFocusRing}`}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            Actualiser
          </button>
        }
      >
        {loading ? (
          <MemberFicheSkeleton rows={6} />
        ) : error ? (
          <p className="text-red-300">{error}</p>
        ) : (
          <>
            <MemberFicheFieldGrid cols={4}>
              <MemberFicheStatCard label="Total evenements" value={entries.length} />
              <MemberFicheStatCard label="Identite" value={counts.identity} />
              <MemberFicheStatCard label="Profil & infos" value={counts.profile + counts.status} />
              <MemberFicheStatCard label="Roles" value={counts.role} />
            </MemberFicheFieldGrid>

            {categoriesWithData.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${ficheFocusRing} ${
                    filter === "all"
                      ? "border-sky-400/45 bg-sky-500/20 text-sky-100"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  Tous ({entries.length})
                </button>
                {categoriesWithData.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilter(cat)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${ficheFocusRing} ${
                      filter === cat
                        ? "border-sky-400/45 bg-sky-500/20 text-sky-100"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {MEMBER_LOG_CATEGORY_LABELS[cat]} ({counts[cat]})
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </MemberFichePanel>

      {!loading && !error && (
        <MemberFichePanel
          kicker="Timeline"
          title="Historique des modifications"
          intro="Du plus recent au plus ancien — source : base membre + journaux audit admin."
          tone="neutral"
        >
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
              Aucun changement enregistre pour ce membre. Les prochaines modifications via la gestion
              membres apparaitront ici.
            </p>
          ) : (
            <MemberFicheTableShell minWidth="920px">
              <MemberFicheTableHead>
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Categorie</th>
                  <th className="px-3 py-2 text-left">Champ</th>
                  <th className="px-3 py-2 text-left">Avant</th>
                  <th className="px-3 py-2 text-left">Apres</th>
                  <th className="px-3 py-2 text-left">Auteur</th>
                </tr>
              </MemberFicheTableHead>
              <tbody>
                {filtered.map((entry) => (
                  <MemberFicheTableRow key={entry.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden />
                        {formatDateTime(entry.changedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_TONE[entry.category]}`}
                      >
                        {MEMBER_LOG_CATEGORY_LABELS[entry.category]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-200">{entry.label}</td>
                    <td className="max-w-[12rem] truncate px-3 py-2 text-zinc-500" title={entry.fromValue || undefined}>
                      {formatValue(entry.fromValue)}
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2 font-semibold text-white" title={entry.toValue || undefined}>
                      {formatValue(entry.toValue)}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {entry.changedByUsername || entry.changedBy}
                      {entry.reason ? (
                        <span className="mt-0.5 block text-[10px] text-zinc-600">{entry.reason}</span>
                      ) : null}
                    </td>
                  </MemberFicheTableRow>
                ))}
              </tbody>
            </MemberFicheTableShell>
          )}
        </MemberFichePanel>
      )}
    </div>
  );
}
