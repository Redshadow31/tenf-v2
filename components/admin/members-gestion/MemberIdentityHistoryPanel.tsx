"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AtSign, Clock, Loader2, RefreshCw } from "lucide-react";
import {
  IDENTITY_FIELD_LABELS,
  type IdentityFieldKey,
  type IdentityHistoryEntry,
} from "@/lib/admin/members-gestion/identityHistory";

type MemberIdentityHistoryPanelProps = {
  twitchLogin?: string;
  discordId?: string;
  twitchId?: string;
  variant?: "compact" | "full";
};

const sectionClass =
  "rounded-xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(26,28,40,0.92),rgba(14,15,22,0.98))]";

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

export default function MemberIdentityHistoryPanel({
  twitchLogin,
  discordId,
  twitchId,
  variant = "full",
}: MemberIdentityHistoryPanelProps) {
  const [history, setHistory] = useState<IdentityHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterField, setFilterField] = useState<IdentityFieldKey | "all">("all");

  const canFetch = Boolean(twitchLogin || discordId || twitchId);

  const loadHistory = useCallback(async () => {
    if (!canFetch) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (twitchLogin) params.set("twitchLogin", twitchLogin);
      if (discordId) params.set("discordId", discordId);
      if (twitchId) params.set("twitchId", twitchId);
      const response = await fetch(`/api/admin/members/identity-history?${params.toString()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger l'historique");
      }
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, twitchLogin, discordId, twitchId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filtered = useMemo(() => {
    if (filterField === "all") return history;
    return history.filter((e) => e.field === filterField);
  }, [history, filterField]);

  const fieldCounts = useMemo(() => {
    const counts: Partial<Record<IdentityFieldKey, number>> = {};
    for (const e of history) {
      counts[e.field] = (counts[e.field] || 0) + 1;
    }
    return counts;
  }, [history]);

  const usedFields = useMemo(
    () =>
      (Object.keys(IDENTITY_FIELD_LABELS) as IdentityFieldKey[]).filter((f) => (fieldCounts[f] || 0) > 0),
    [fieldCounts]
  );

  return (
    <div className={variant === "full" ? "space-y-4" : "space-y-3"}>
      <div className={`${sectionClass} p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AtSign className="h-4 w-4 text-cyan-300" aria-hidden />
              Historique des identités
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Pseudos Twitch, Discord, nom affiché, IDs et pseudo site — consolidé depuis la base et les journaux
              d&apos;audit admin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={loading || !canFetch}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            Actualiser
          </button>
        </div>

        {!canFetch ? (
          <p className="mt-3 text-sm text-amber-200/90">Renseigne au moins un identifiant (Twitch, Discord ou ID) pour afficher l&apos;historique.</p>
        ) : null}

        {usedFields.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterField("all")}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                filterField === "all"
                  ? "border-cyan-400/45 bg-cyan-500/20 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              Tous ({history.length})
            </button>
            {usedFields.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setFilterField(field)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  filterField === field
                    ? "border-cyan-400/45 bg-cyan-500/20 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {IDENTITY_FIELD_LABELS[field]} ({fieldCounts[field]})
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-300" aria-hidden />
          Chargement de l&apos;historique…
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
          {canFetch
            ? "Aucun changement d'identité enregistré pour ce membre (les prochains renommages apparaîtront ici)."
            : "Identifiants manquants."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className={`${sectionClass} border-l-2 border-l-cyan-500/40 px-4 py-3`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-cyan-200/90">
                  {IDENTITY_FIELD_LABELS[entry.field]}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" aria-hidden />
                  {formatDateTime(entry.changedAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-200">
                <span className="text-slate-500 line-through">{formatValue(entry.fromValue)}</span>
                <span className="mx-2 text-cyan-400" aria-hidden>
                  →
                </span>
                <span className="font-semibold text-white">{formatValue(entry.toValue)}</span>
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Par {entry.changedByUsername || entry.changedBy}
                {entry.source === "audit" ? " · journal audit" : " · système"}
                {entry.reason ? ` · ${entry.reason}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
