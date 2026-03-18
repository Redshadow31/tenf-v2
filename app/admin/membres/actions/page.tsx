"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QueueItem = {
  id: string;
  title: string;
  description: string;
  count: number;
  priority: "P1" | "P2" | "P3";
  href: string;
  source: string;
};

function priorityClass(priority: QueueItem["priority"]): string {
  if (priority === "P1") return "bg-rose-500/15 border-rose-400/40 text-rose-200";
  if (priority === "P2") return "bg-amber-500/15 border-amber-400/40 text-amber-200";
  return "bg-sky-500/15 border-sky-400/40 text-sky-200";
}

export default function MembersActionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadQueues() {
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

        if (!mounted) return;

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
            title: "Écarts sync membres",
            description: "Profils présents en legacy mais absents Supabase.",
            count,
            priority: count > 20 ? "P1" : count > 0 ? "P2" : "P3",
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
            priority: incompleteAccounts > 25 ? "P2" : incompleteAccounts > 0 ? "P3" : "P3",
            href: "/admin/membres/incomplets",
            source: "control-center/alerts",
          });
          next.push({
            id: "errors",
            title: "Incohérences membres",
            description: "Anomalies de données à corriger (logins, IDs, incohérences).",
            count: errors,
            priority: errors > 12 ? "P1" : errors > 0 ? "P2" : "P3",
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
            description: "Membres à revoir selon la date de prochaine revue.",
            count: overdue,
            priority: overdue > 20 ? "P1" : overdue > 0 ? "P2" : "P3",
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
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadQueues();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const p1 = items.filter((item) => item.priority === "P1").length;
    return { total, p1 };
  }, [items]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/membres" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au Dashboard membres
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Gestion des membres - Actions à traiter</h1>
        <p className="text-gray-300">Queue unifiée des actions prioritaires sur profils, recrutement staff, sync et qualité des données.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Files actives</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Volume total</p>
          <p className="mt-2 text-3xl font-bold">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Files P1</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{totals.p1}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">Chargement de la queue...</div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Aucun item en attente détecté.
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] overflow-hidden">
          <div className="grid grid-cols-[1.4fr_90px_80px_1fr_170px] gap-2 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
            <span>Action</span>
            <span>Volume</span>
            <span>Prio</span>
            <span>Source</span>
            <span>Ouverture</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.4fr_90px_80px_1fr_170px] gap-2 px-4 py-3 border-b border-white/5 items-center">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
              <p className="text-sm text-white">{item.count}</p>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs w-fit ${priorityClass(item.priority)}`}>{item.priority}</span>
              <p className="text-xs text-gray-400">{item.source}</p>
              <Link href={item.href} className="text-sm text-amber-300 hover:text-amber-200 transition-colors">
                Ouvrir la page →
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

