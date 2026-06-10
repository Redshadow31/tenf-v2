"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Crown, ExternalLink, Trash2 } from "lucide-react";
import {
  MemberFicheFieldGrid,
  MemberFichePanel,
  MemberFicheSkeleton,
  MemberFicheStatCard,
  MemberFicheTableHead,
  MemberFicheTableShell,
} from "@/components/admin/members-gestion/MemberFicheLayout";
import { ficheFocusRing } from "@/lib/admin/members-fiche/memberFicheStyles";

export type MemberVipParcoursData = {
  twitchLogin: string;
  displayName: string;
  isVip: boolean;
  months: string[];
  consecutiveMonths: number;
  badge: string;
};

type Props = {
  memberId: string;
  data: MemberVipParcoursData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  toMonthLabel: (monthKey?: string) => string;
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthOptions(count = 48): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return options;
}

export default function MemberVipParcoursPanel({
  memberId,
  data,
  loading,
  error,
  onRefresh,
  toMonthLabel,
}: Props) {
  const [newMonth, setNewMonth] = useState(getCurrentMonthKey());
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const monthSet = useMemo(() => new Set(data?.months || []), [data?.months]);
  const availableMonths = useMemo(
    () => monthOptions().filter((month) => !monthSet.has(month)),
    [monthSet]
  );

  async function addMonth() {
    if (!newMonth) return;
    setSaving(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/vip-parcours`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month: newMonth }),
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors de l'ajout");
      }
      await onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  }

  async function removeMonth(month: string) {
    if (!confirm(`Retirer ${data?.displayName || data?.twitchLogin} du mois ${toMonthLabel(month)} ?`)) {
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/vip-parcours`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month }),
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors de la suppression");
      }
      await onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <MemberFicheSkeleton rows={6} />;
  }

  if (error) {
    return <p className="text-red-300">{error}</p>;
  }

  if (!data) {
    return <p className="text-zinc-500">Parcours VIP indisponible.</p>;
  }

  return (
    <div className="space-y-4">
      <MemberFichePanel
        kicker="Reconnaissance"
        title="Parcours VIP"
        intro="Historique mensuel des mois VIP enregistrés pour ce membre. Les ajouts alimentent l'historique public et les badges VIP+N."
        tone="amber"
      >
        <MemberFicheFieldGrid cols={4}>
          <MemberFicheStatCard
            label="Statut actuel"
            value={data.isVip ? "VIP actif" : "Non VIP"}
          />
          <MemberFicheStatCard label="Badge" value={data.badge || "—"} />
          <MemberFicheStatCard label="Mois consécutifs" value={data.consecutiveMonths || 0} />
          <MemberFicheStatCard label="Mois enregistrés" value={data.months.length} />
        </MemberFicheFieldGrid>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200/80">
              Ajouter un mois VIP
            </label>
            <select
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              className={`rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white ${ficheFocusRing}`}
            >
              {availableMonths.length === 0 ? (
                <option value="">Tous les mois récents sont déjà renseignés</option>
              ) : (
                availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {toMonthLabel(month)}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void addMonth()}
            disabled={saving || !newMonth || availableMonths.length === 0}
            className={`inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:opacity-50 ${ficheFocusRing}`}
          >
            <CalendarPlus className="h-4 w-4" />
            Ajouter le mois
          </button>
          <Link
            href="/admin/membres/vip/historique"
            className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 ${ficheFocusRing}`}
          >
            <ExternalLink className="h-4 w-4" />
            Historique global
          </Link>
        </div>

        {actionError ? <p className="mt-3 text-sm text-red-300">{actionError}</p> : null}
      </MemberFichePanel>

      <MemberFichePanel kicker="Historique" title="Mois VIP enregistrés" tone="neutral">
        <MemberFicheTableShell minWidth="640px">
          <MemberFicheTableHead>
            <tr>
              <th className="px-3 py-2 text-left">Mois</th>
              <th className="px-3 py-2 text-left">Clé</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </MemberFicheTableHead>
          <tbody>
            {data.months.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={3}>
                  Aucun mois VIP enregistré. Utilise le formulaire ci-dessus pour ajouter l&apos;historique.
                </td>
              </tr>
            ) : (
              data.months.map((month) => (
                <tr key={month} className="border-b border-white/[0.05]">
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 font-medium text-amber-100">
                      <Crown className="h-4 w-4 text-amber-400" aria-hidden />
                      {toMonthLabel(month)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{month}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void removeMonth(month)}
                      disabled={saving}
                      className={`inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2.5 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50 ${ficheFocusRing}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Retirer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </MemberFicheTableShell>
      </MemberFichePanel>
    </div>
  );
}
