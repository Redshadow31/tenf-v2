"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";

type QueueImpact = "bloquant_onboarding" | "risque_moderation" | "qualite_data" | "processus_interne";

type QueueItem = {
  id: string;
  title: string;
  description: string;
  count: number;
  priority: "P1" | "P2" | "P3";
  impact: QueueImpact;
  href: string;
  source: string;
};

function priorityClass(priority: QueueItem["priority"]): string {
  if (priority === "P1") return "bg-rose-500/15 border-rose-400/40 text-rose-200";
  if (priority === "P2") return "bg-amber-500/15 border-amber-400/40 text-amber-200";
  return "bg-sky-500/15 border-sky-400/40 text-sky-200";
}

function impactClass(impact: QueueImpact): string {
  if (impact === "bloquant_onboarding") return "bg-fuchsia-500/15 border-fuchsia-400/40 text-fuchsia-200";
  if (impact === "risque_moderation") return "bg-orange-500/15 border-orange-400/40 text-orange-200";
  if (impact === "qualite_data") return "bg-cyan-500/15 border-cyan-400/40 text-cyan-200";
  return "bg-slate-500/15 border-slate-400/40 text-slate-200";
}

function impactLabel(impact: QueueImpact): string {
  if (impact === "bloquant_onboarding") return "Onboarding";
  if (impact === "risque_moderation") return "Moderation";
  if (impact === "qualite_data") return "Qualite data";
  return "Processus";
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function MembersActionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<QueueItem["priority"] | "all">("all");
  const [impactFilter, setImpactFilter] = useState<QueueImpact | "all">("all");
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

      const next: QueueItem[] = [];

      if (profileValidationRes.status === "fulfilled" && profileValidationRes.value.ok) {
        const payload = await profileValidationRes.value.json();
        const count = Array.isArray(payload?.pending) ? payload.pending.length : 0;
        next.push({
          id: "profile-validation",
          title: "Validation de profils",
          description: "Demandes de modifications de profil en attente de traitement.",
          count,
          priority: count > 12 ? "P1" : count > 0 ? "P2" : "P3",
          impact: "bloquant_onboarding",
          href: "/admin/membres/validation-profil",
          source: "member_profile_pending",
        });
      }

      if (staffApplicationsRes.status === "fulfilled" && staffApplicationsRes.value.ok) {
        const payload = await staffApplicationsRes.value.json();
        const applications = Array.isArray(payload?.applications) ? payload.applications : [];
        const pendingStatuses = new Set(["nouveau", "a_contacter", "entretien_prevu"]);
        const count = applications.filter((application: any) => pendingStatuses.has(String(application?.admin_status || ""))).length;
        next.push({
          id: "staff-applications",
          title: "Postulations staff",
          description: "Candidatures à instruire ou relancer.",
          count,
          priority: count > 10 ? "P1" : count > 0 ? "P2" : "P3",
          impact: "risque_moderation",
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
          title: "Ecarts sync membres",
          description: "Profils presents en legacy mais absents Supabase.",
          count,
          priority: count > 20 ? "P1" : count > 0 ? "P2" : "P3",
          impact: "qualite_data",
          href: "/admin/membres/synchronisation",
          source: "migration/check-sync-members",
        });
      }

      if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
        const payload = await alertsRes.value.json();
        const incompleteAccounts = Number(payload?.incompleteAccounts || 0);
        const errors = Number(payload?.errors || 0);
        next.push({
          id: "incomplete",
          title: "Comptes incomplets",
          description: "Profils avec champs obligatoires manquants.",
          count: incompleteAccounts,
          priority: incompleteAccounts > 25 ? "P2" : "P3",
          impact: "bloquant_onboarding",
          href: "/admin/membres/incomplets",
          source: "control-center/alerts",
        });
        next.push({
          id: "errors",
          title: "Incoherences membres",
          description: "Anomalies de donnees a corriger (logins, IDs, incoherences).",
          count: errors,
          priority: errors > 12 ? "P1" : errors > 0 ? "P2" : "P3",
          impact: "qualite_data",
          href: "/admin/membres/erreurs",
          source: "control-center/alerts",
        });
      }

      if (aggregateRes.status === "fulfilled" && aggregateRes.value.ok) {
        const payload = await aggregateRes.value.json();
        const overdue = Number(payload?.data?.summary?.reviewOverdue || 0);
        next.push({
          id: "reviews",
          title: "Revues membres en retard",
          description: "Membres a revoir selon la date de prochaine revue.",
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
            const score = (value: QueueItem["priority"]) => (value === "P1" ? 3 : value === "P2" ? 2 : 1);
            const priorityDiff = score(b.priority) - score(a.priority);
            if (priorityDiff !== 0) return priorityDiff;
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

  const impactBreakdown = useMemo(() => {
    const counts = {
      bloquant_onboarding: 0,
      risque_moderation: 0,
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
        bloquant_onboarding: pct(counts.bloquant_onboarding),
        risque_moderation: pct(counts.risque_moderation),
        qualite_data: pct(counts.qualite_data),
        processus_interne: pct(counts.processus_interne),
      },
    };
  }, [items]);

  const donutBackground = useMemo(() => {
    if (impactBreakdown.total === 0) return "conic-gradient(#1f2433 0% 100%)";
    const p1 = impactBreakdown.pcts.bloquant_onboarding;
    const p2 = impactBreakdown.pcts.risque_moderation;
    const p3 = impactBreakdown.pcts.qualite_data;
    const p4 = Math.max(0, 100 - (p1 + p2 + p3));
    return `conic-gradient(#e879f9 0% ${p1}%, #fb923c ${p1}% ${p1 + p2}%, #22d3ee ${p1 + p2}% ${p1 + p2 + p3}%, #94a3b8 ${p1 + p2 + p3}% ${p1 + p2 + p3 + p4}%)`;
  }, [impactBreakdown]);

  const p1Rate = totals.total > 0 ? Math.round((items.filter((item) => item.priority === "P1").reduce((sum, item) => sum + item.count, 0) / totals.total) * 100) : 0;
  const p2Rate = totals.total > 0 ? Math.round((items.filter((item) => item.priority === "P2").reduce((sum, item) => sum + item.count, 0) / totals.total) * 100) : 0;
  const p3Rate = Math.max(0, 100 - p1Rate - p2Rate);

  return (
    <div className="text-white space-y-6">
      <section className={`${glassCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link href="/admin/membres" className="text-slate-300 hover:text-white transition-colors mb-3 inline-block">
          ← Retour au Dashboard membres
        </Link>
            <h1 className="bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent">
              Gestion des membres - Actions a traiter
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Queue unifiee des actions prioritaires profils, recrutement staff, sync et qualite des donnees.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshTick((prev) => prev + 1)}
            className={subtleButtonClass}
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser la queue
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-sm text-slate-400">Files actives</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-sm text-slate-400">Volume total</p>
          <p className="mt-2 text-3xl font-bold">{totals.total}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-sm text-slate-400">Files P1</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{totals.p1}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Progression par priorite</h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>P1 critique</span><span>{p1Rate}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-300" style={{ width: `${p1Rate}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>P2 important</span><span>{p2Rate}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${p2Rate}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>P3 normal</span><span>{p3Rate}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-300" style={{ width: `${p3Rate}%` }} /></div>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Camembert impact</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 rounded-full" style={{ background: donutBackground }}>
              <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[#0f1321] text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Volume</p>
                  <p className="text-xl font-semibold text-slate-100">{impactBreakdown.total}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="text-fuchsia-200">Onboarding: {impactBreakdown.counts.bloquant_onboarding}</p>
              <p className="text-orange-200">Moderation: {impactBreakdown.counts.risque_moderation}</p>
              <p className="text-cyan-200">Qualite data: {impactBreakdown.counts.qualite_data}</p>
              <p className="text-slate-300">Processus: {impactBreakdown.counts.processus_interne}</p>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Lecture rapide</h2>
          <p className="mt-2 text-sm text-slate-300">
            {totals.p1 > 0
              ? `${totals.p1} files critiques ouvertes. Prioriser P1 en premier.`
              : "Aucune file critique detectee."}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Repartition files: P1 {totals.p1}, P2 {totals.p2}, P3 {totals.p3}
          </p>
        </article>
      </section>

      <section className={`${sectionCardClass} flex flex-wrap items-center gap-2 p-3`}>
        {(["all", "P1", "P2", "P3"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPriorityFilter(value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              priorityFilter === value
                ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35 hover:text-indigo-100"
            }`}
          >
            {value === "all" ? "Priorite: Toutes" : value}
          </button>
        ))}
        {(["all", "bloquant_onboarding", "risque_moderation", "qualite_data", "processus_interne"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setImpactFilter(value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              impactFilter === value
                ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35 hover:text-indigo-100"
            }`}
          >
            {value === "all" ? "Impact: Tous" : impactLabel(value)}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">Chargement de la queue...</div>
      ) : null}

      {!loading && filteredItems.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Aucun item en attente detecte pour ce filtre.
        </div>
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div className={`${sectionCardClass} overflow-hidden`}>
          <div className="grid grid-cols-[1.4fr_90px_80px_130px_90px_1fr_170px] gap-2 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
            <span>Action</span>
            <span>Volume</span>
            <span>Prio</span>
            <span>Impact</span>
            <span>Score</span>
            <span>Source</span>
            <span>Ouverture</span>
          </div>
          {filteredItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.4fr_90px_80px_130px_90px_1fr_170px] gap-2 px-4 py-3 border-b border-white/5 items-center">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
              <p className="text-sm text-white">{item.count}</p>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs w-fit ${priorityClass(item.priority)}`}>{item.priority}</span>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs w-fit ${impactClass(item.impact)}`}>{impactLabel(item.impact)}</span>
              <span className="inline-flex rounded-full border border-indigo-300/35 bg-indigo-300/10 px-2 py-0.5 text-xs w-fit text-indigo-100">
                {Math.round(item.count * (item.priority === "P1" ? 3 : item.priority === "P2" ? 2 : 1))}
              </span>
              <p className="text-xs text-gray-400">{item.source}</p>
              <Link href={item.href} className="inline-flex items-center gap-1 text-sm text-indigo-200 hover:text-indigo-100 transition-colors">
                Ouvrir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

