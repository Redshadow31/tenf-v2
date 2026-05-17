"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ListOrdered, RefreshCw } from "lucide-react";
import MembersCockpitShell from "@/components/admin/members-hub/MembersCockpitShell";
import MembersActionsCockpitAside from "@/components/admin/members-hub/MembersActionsCockpitAside";
import MembersActionsStaffGuide from "@/components/admin/members-hub/MembersActionsStaffGuide";
import {
  cockpitBtnClass,
  cockpitHeroClass,
  cockpitPanelClass,
  hubFocusRingClass,
  hubSectionLabelClass,
} from "@/components/admin/members-hub/membersHubStyles";
import {
  getMembersOpsScore,
  IMPACT_LABELS,
  PRIORITY_LABELS,
  type MembersOpsImpact,
  type MembersOpsItem,
  type MembersOpsPriority,
} from "@/lib/admin/members/membersOpsQueue";

/**
 * File complète des actions membres.
 *
 * Alignée avec le hub /admin/membres :
 *  - mêmes priorités P1 / P2 / P3 (via `PRIORITY_LABELS`)
 *  - mêmes impacts (Onboarding / Modération / Qualité data / Processus interne)
 *    via `IMPACT_LABELS`
 *  - même formule de score (`getMembersOpsScore`)
 *  - hrefs alignés sur les routes finales (pas de routes legacy)
 */

type QueueRow = Pick<
  MembersOpsItem,
  "id" | "title" | "description" | "count" | "priority" | "impact" | "href"
> & {
  source: string;
};

function priorityClass(priority: MembersOpsPriority): string {
  if (priority === "P1") return "bg-rose-500/15 border-rose-400/40 text-rose-200";
  if (priority === "P2") return "bg-amber-500/15 border-amber-400/40 text-amber-200";
  return "bg-sky-500/15 border-sky-400/40 text-sky-200";
}

function impactClass(impact: MembersOpsImpact): string {
  if (impact === "onboarding") return "bg-fuchsia-500/15 border-fuchsia-400/40 text-fuchsia-200";
  if (impact === "moderation") return "bg-orange-500/15 border-orange-400/40 text-orange-200";
  if (impact === "qualite_data") return "bg-cyan-500/15 border-cyan-400/40 text-cyan-200";
  return "bg-zinc-500/15 border-zinc-400/40 text-zinc-200";
}

function filterChipClass(active: boolean): string {
  return `rounded-lg border px-3 py-2 text-xs font-semibold transition ${hubFocusRingClass} ${
    active
      ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-400/25 hover:text-zinc-200"
  }`;
}

const IMPACT_FILTERS: Array<{ id: MembersOpsImpact | "all"; label: string }> = [
  { id: "all", label: "Impact : Tous" },
  { id: "onboarding", label: IMPACT_LABELS.onboarding },
  { id: "moderation", label: IMPACT_LABELS.moderation },
  { id: "qualite_data", label: IMPACT_LABELS.qualite_data },
  { id: "processus_interne", label: IMPACT_LABELS.processus_interne },
];

export default function MembersActionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QueueRow[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<MembersOpsPriority | "all">("all");
  const [impactFilter, setImpactFilter] = useState<MembersOpsImpact | "all">("all");
  const [refreshTick, setRefreshTick] = useState(0);

  const loadQueues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        profileValidationRes,
        staffApplicationsRes,
        syncMembersRes,
        alertsRes,
        aggregateRes,
      ] = await Promise.allSettled([
        fetch("/api/admin/members/profile-validation", { cache: "no-store" }),
        fetch("/api/staff-applications", { cache: "no-store" }),
        fetch("/api/admin/migration/check-sync-members", { cache: "no-store" }),
        fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
        fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
      ]);

      const next: QueueRow[] = [];

      if (profileValidationRes.status === "fulfilled" && profileValidationRes.value.ok) {
        const payload = await profileValidationRes.value.json();
        const count = Array.isArray(payload?.pending) ? payload.pending.length : 0;
        next.push({
          id: "profile-validation",
          title: "Créateurs bloqués avant intégration",
          description: "Profils en attente d'une lecture staff : valider pour débloquer l'arrivée.",
          count,
          priority: count > 12 ? "P1" : count > 0 ? "P2" : "P3",
          impact: "onboarding",
          href: "/admin/membres/validation-profil",
          source: "member_profile_pending",
        });
      }

      if (staffApplicationsRes.status === "fulfilled" && staffApplicationsRes.value.ok) {
        const payload = await staffApplicationsRes.value.json();
        const applications = Array.isArray(payload?.applications) ? payload.applications : [];
        const pendingStatuses = new Set(["nouveau", "a_contacter", "entretien_prevu"]);
        const count = applications.filter((application: unknown) => {
          const status = (application as { admin_status?: unknown })?.admin_status;
          return pendingStatuses.has(String(status || ""));
        }).length;
        next.push({
          id: "staff-applications",
          title: "Candidatures staff à instruire",
          description: "Créateurs qui souhaitent rejoindre l'équipe : à trier avant entretien ou réponse.",
          count,
          priority: count > 10 ? "P1" : count > 0 ? "P2" : "P3",
          impact: "moderation",
          href: "/admin/membres/postulations",
          source: "staff_applications",
        });
      }

      if (syncMembersRes.status === "fulfilled" && syncMembersRes.value.ok) {
        const payload = await syncMembersRes.value.json();
        const missing = payload?.data?.merged?.missingInSupabase;
        const count = Array.isArray(missing) ? missing.length : 0;
        next.push({
          id: "sync-gap",
          title: "Données à réconcilier",
          description: "Créateurs présents en source historique mais absents de la nouvelle base.",
          count,
          priority: count > 20 ? "P1" : count > 0 ? "P2" : "P3",
          impact: "qualite_data",
          href: "/admin/membres/qualite-data?onglet=sync",
          source: "migration/check-sync-members",
        });
      }

      if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
        const payload = await alertsRes.value.json();
        const incompleteAccounts = Number(payload?.incompleteAccounts || 0);
        const errors = Number(payload?.errors || 0);
        next.push({
          id: "incomplete",
          title: "Fiches à fiabiliser",
          description: "Profils ouverts mais incomplets : à finaliser pour rester exploitables.",
          count: incompleteAccounts,
          priority: incompleteAccounts > 25 ? "P2" : "P3",
          impact: "onboarding",
          href: "/admin/membres/incomplets",
          source: "control-center/alerts",
        });
        next.push({
          id: "errors",
          title: "Incohérences à corriger sur les fiches",
          description: "Anomalies techniques (logins, IDs) : ces créateurs ne sont pas exploitables.",
          count: errors,
          priority: errors > 12 ? "P1" : errors > 0 ? "P2" : "P3",
          impact: "qualite_data",
          href: "/admin/membres/incomplets?vue=erreurs",
          source: "control-center/alerts",
        });
      }

      if (aggregateRes.status === "fulfilled" && aggregateRes.value.ok) {
        const payload = await aggregateRes.value.json();
        const overdue = Number(payload?.data?.summary?.reviewOverdue || 0);
        next.push({
          id: "reviews",
          title: "Membres à accompagner",
          description: "Revues dépassées : un échange ou un point d'étape s'impose pour ces créateurs.",
          count: overdue,
          priority: overdue > 20 ? "P1" : overdue > 0 ? "P2" : "P3",
          impact: "processus_interne",
          href: "/admin/membres/revues",
          source: "dashboard/aggregate",
        });
      }

      setItems(
        next
          .filter((item) => item.count > 0)
          .sort((a, b) => {
            const scoreDiff = getMembersOpsScore(b) - getMembersOpsScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            return b.count - a.count;
          })
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueues();
  }, [loadQueues, refreshTick]);

  const totals = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const p1 = items.filter((item) => item.priority === "P1").length;
    const p2 = items.filter((item) => item.priority === "P2").length;
    const p3 = items.filter((item) => item.priority === "P3").length;
    return { total, p1, p2, p3 };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (impactFilter !== "all" && item.impact !== impactFilter) return false;
      return true;
    });
  }, [impactFilter, items, priorityFilter]);

  const filteredVolume = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.count, 0),
    [filteredItems]
  );

  const impactBreakdown = useMemo(() => {
    const counts: Record<MembersOpsImpact, number> = {
      onboarding: 0,
      moderation: 0,
      qualite_data: 0,
      processus_interne: 0,
    };
    items.forEach((item) => {
      counts[item.impact] += item.count;
    });
    const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
    const pct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
    return {
      counts,
      total,
      pcts: {
        onboarding: pct(counts.onboarding),
        moderation: pct(counts.moderation),
        qualite_data: pct(counts.qualite_data),
        processus_interne: pct(counts.processus_interne),
      },
    };
  }, [items]);

  const donutBackground = useMemo(() => {
    if (impactBreakdown.total === 0) return "conic-gradient(#27272a 0% 100%)";
    const p1 = impactBreakdown.pcts.onboarding;
    const p2 = impactBreakdown.pcts.moderation;
    const p3 = impactBreakdown.pcts.qualite_data;
    const p4 = Math.max(0, 100 - (p1 + p2 + p3));
    return `conic-gradient(#e879f9 0% ${p1}%, #fb923c ${p1}% ${p1 + p2}%, #22d3ee ${p1 + p2}% ${p1 + p2 + p3}%, #94a3b8 ${p1 + p2 + p3}% ${p1 + p2 + p3 + p4}%)`;
  }, [impactBreakdown]);

  const p1Rate =
    totals.total > 0
      ? Math.round(
          (items.filter((item) => item.priority === "P1").reduce((sum, item) => sum + item.count, 0) / totals.total) *
            100
        )
      : 0;
  const p2Rate =
    totals.total > 0
      ? Math.round(
          (items.filter((item) => item.priority === "P2").reduce((sum, item) => sum + item.count, 0) / totals.total) *
            100
        )
      : 0;
  const p3Rate = Math.max(0, 100 - p1Rate - p2Rate);

  return (
    <MembersCockpitShell
      aside={<MembersActionsCockpitAside totalVolume={totals.total} p1Files={totals.p1} />}
    >
      <header className={`${cockpitHeroClass} p-[clamp(1rem,1.6vw,1.5rem)] sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-violet-200">
                Membres TENF
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400">
                Cockpit staff
              </span>
            </div>
            <p className={hubSectionLabelClass}>File opérationnelle</p>
            <h1 className="mt-1 text-[clamp(1.35rem,2.2vw,1.85rem)] font-semibold tracking-tight text-zinc-50">
              Actions à traiter
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Toute la file unifiée : validations, staff, sync et qualité. Mêmes priorités et impacts que le hub — avec
              volumes et filtres complets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshTick((prev) => prev + 1)}
            disabled={loading}
            className={`${cockpitBtnClass} ${hubFocusRingClass} shrink-0 disabled:opacity-50`}
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Actualiser
          </button>
        </div>
      </header>

      {error ? (
        <div
          className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          Chargement partiel : {error}
        </div>
      ) : null}

      <MembersActionsStaffGuide activeFiles={items.length} totalVolume={totals.total} p1Files={totals.p1} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Indicateurs file">
        <div className={`${cockpitPanelClass} p-4`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Files actives</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-50">{loading ? "—" : items.length}</p>
        </div>
        <div className={`${cockpitPanelClass} p-4`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Volume total</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-50">{loading ? "—" : totals.total}</p>
        </div>
        <div className={`${cockpitPanelClass} p-4`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Types en P1</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rose-300">{loading ? "—" : totals.p1}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Synthèse priorités et impacts">
        <article className={`${cockpitPanelClass} p-5`}>
          <h2 className="text-sm font-semibold text-zinc-100">Répartition par priorité</h2>
          <p className="mt-1 text-xs text-zinc-500">Part du volume total (dossiers), pas du nombre de lignes.</p>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{PRIORITY_LABELS.P1}</span>
                <span className="tabular-nums">{p1Rate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-800">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                  style={{ width: `${p1Rate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{PRIORITY_LABELS.P2}</span>
                <span className="tabular-nums">{p2Rate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-800">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                  style={{ width: `${p2Rate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{PRIORITY_LABELS.P3}</span>
                <span className="tabular-nums">{p3Rate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-800">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
                  style={{ width: `${p3Rate}%` }}
                />
              </div>
            </div>
          </div>
        </article>
        <article className={`${cockpitPanelClass} p-5`}>
          <h2 className="text-sm font-semibold text-zinc-100">Volume par impact</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: donutBackground }}>
              <div className="absolute inset-4 flex items-center justify-center rounded-full bg-zinc-950 text-center ring-1 ring-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Dossiers</p>
                  <p className="text-xl font-semibold tabular-nums text-zinc-100">{impactBreakdown.total}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400">
              <p>
                <span className="text-fuchsia-200">{IMPACT_LABELS.onboarding}</span> :{" "}
                {impactBreakdown.counts.onboarding}
              </p>
              <p>
                <span className="text-orange-200">{IMPACT_LABELS.moderation}</span> :{" "}
                {impactBreakdown.counts.moderation}
              </p>
              <p>
                <span className="text-cyan-200">{IMPACT_LABELS.qualite_data}</span> :{" "}
                {impactBreakdown.counts.qualite_data}
              </p>
              <p>
                <span className="text-zinc-300">{IMPACT_LABELS.processus_interne}</span> :{" "}
                {impactBreakdown.counts.processus_interne}
              </p>
            </div>
          </div>
        </article>
        <article className={`${cockpitPanelClass} p-5`}>
          <h2 className="text-sm font-semibold text-zinc-100">Lecture rapide</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {totals.p1 > 0
              ? `${totals.p1} type${totals.p1 > 1 ? "s" : ""} de file en P1 — commence par le filtre P1 ci-dessous.`
              : totals.total === 0
                ? "Aucun dossier en attente : la file est vide."
                : "Aucun type critique P1 : tu peux traiter P2 ou la vue complète."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Lignes actives : P1 {totals.p1}, P2 {totals.p2}, P3 {totals.p3}
          </p>
        </article>
      </section>

      <section className={`${cockpitPanelClass} flex flex-wrap items-center gap-2 p-3`} aria-label="Filtres">
        {(["all", "P1", "P2", "P3"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPriorityFilter(value)}
            className={filterChipClass(priorityFilter === value)}
          >
            {value === "all" ? "Priorité : Toutes" : PRIORITY_LABELS[value]}
          </button>
        ))}
        {IMPACT_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setImpactFilter(filter.id)}
            className={filterChipClass(impactFilter === filter.id)}
          >
            {filter.label}
          </button>
        ))}
        {(priorityFilter !== "all" || impactFilter !== "all") && filteredItems.length > 0 ? (
          <p className="ml-auto text-xs text-zinc-500 tabular-nums">
            {filteredItems.length} ligne{filteredItems.length > 1 ? "s" : ""} · {filteredVolume} dossier
            {filteredVolume > 1 ? "s" : ""}
          </p>
        ) : null}
      </section>

      {loading ? (
        <div className={`${cockpitPanelClass} px-4 py-3 text-sm text-zinc-400`} aria-live="polite">
          Chargement de la file…
        </div>
      ) : null}

      {!loading && filteredItems.length === 0 ? (
        <div
          className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          {items.length === 0
            ? "Rien en attente : toutes les files sont vides pour l'instant."
            : "Aucune ligne pour ce filtre — élargis la priorité ou l'impact."}
        </div>
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <section className={`${cockpitPanelClass} overflow-hidden`} aria-labelledby="actions-table-heading">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <ListOrdered className="h-4 w-4 text-violet-300" aria-hidden />
            <h2 id="actions-table-heading" className="text-sm font-semibold text-zinc-100">
              Tableau de la file
            </h2>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[minmax(0,1.4fr)_90px_90px_140px_90px_minmax(0,1fr)_170px] gap-2 border-b border-white/[0.06] px-4 py-3 text-xs uppercase tracking-wide text-zinc-500">
                <span>Action</span>
                <span>Volume</span>
                <span>Prio</span>
                <span>Impact</span>
                <span>Score</span>
                <span>Source</span>
                <span>Ouverture</span>
              </div>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1.4fr)_90px_90px_140px_90px_minmax(0,1fr)_170px] items-center gap-2 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
                  </div>
                  <p className="text-sm tabular-nums text-zinc-200">{item.count}</p>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-xs ${priorityClass(item.priority)}`}
                  >
                    {item.priority}
                  </span>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-xs ${impactClass(item.impact)}`}
                  >
                    {IMPACT_LABELS[item.impact]}
                  </span>
                  <span className="inline-flex w-fit rounded-full border border-violet-400/35 bg-violet-500/10 px-2 py-0.5 text-xs tabular-nums text-violet-100">
                    {getMembersOpsScore(item)}
                  </span>
                  <p className="truncate text-xs text-zinc-500" title={item.source}>
                    {item.source}
                  </p>
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1 text-sm text-violet-200 transition hover:text-violet-50 ${hubFocusRingClass} rounded`}
                  >
                    Ouvrir
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </MembersCockpitShell>
  );
}
