"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BacklogItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  priority: "P1" | "P2" | "P3";
  source: string;
};

function priorityBadge(priority: BacklogItem["priority"]): string {
  if (priority === "P1") return "bg-rose-500/15 border-rose-400/40 text-rose-200";
  if (priority === "P2") return "bg-amber-500/15 border-amber-400/40 text-amber-200";
  return "bg-sky-500/15 border-sky-400/40 text-sky-200";
}

export default function PilotageBacklogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BacklogItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [
          aggregateRes,
          profileRes,
          proposalsRes,
          raidsDeclRes,
          raidsSubPointsRes,
          evalResultRes,
          alertsRes,
        ] = await Promise.allSettled([
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
          fetch("/api/admin/members/profile-validation", { cache: "no-store" }),
          fetch("/api/admin/events/proposals", { cache: "no-store" }),
          fetch("/api/admin/engagement/raids-declarations?status=all", { cache: "no-store" }),
          fetch("/api/admin/engagement/raids-sub/points?includeTodo=true&includeHistory=false", { cache: "no-store" }),
          fetch("/api/evaluations/result", { cache: "no-store" }),
          fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        const next: BacklogItem[] = [];

        if (aggregateRes.status === "fulfilled" && aggregateRes.value.ok) {
          const payload = await aggregateRes.value.json();
          const pendingEvents = Number(payload?.data?.recap?.upcomingKpis?.pendingEventValidations || 0);
          const pendingPoints = Number(payload?.data?.ops?.discordPointsPendingCount || 0);
          const staffPending = Number(payload?.data?.ops?.staffApplicationsPendingCount || 0);
          if (pendingEvents > 0) {
            next.push({
              id: "event-presence",
              label: "Valider les présences événements",
              count: pendingEvents,
              href: "/admin/events/presence",
              priority: pendingEvents > 10 ? "P1" : "P2",
              source: "Dashboard aggregate",
            });
          }
          if (pendingPoints > 0) {
            next.push({
              id: "discord-points",
              label: "Valider les points Discord raids",
              count: pendingPoints,
              href: "/admin/engagement/points-discord",
              priority: pendingPoints > 10 ? "P1" : "P2",
              source: "Dashboard aggregate",
            });
          }
          if (staffPending > 0) {
            next.push({
              id: "staff-apps",
              label: "Traiter les postulations staff",
              count: staffPending,
              href: "/admin/membres/postulations",
              priority: "P2",
              source: "Dashboard aggregate",
            });
          }
        }

        if (profileRes.status === "fulfilled" && profileRes.value.ok) {
          const payload = await profileRes.value.json();
          const pending = Array.isArray(payload?.pending) ? payload.pending.length : Number(payload?.pendingCount || 0);
          if (pending > 0) {
            next.push({
              id: "profile-validation",
              label: "Demandes de validation profil",
              count: pending,
              href: "/admin/membres/validation-profil",
              priority: pending > 20 ? "P1" : "P2",
              source: "Profile validation",
            });
          }
        }

        if (proposalsRes.status === "fulfilled" && proposalsRes.value.ok) {
          const payload = await proposalsRes.value.json();
          const proposals = Array.isArray(payload?.proposals) ? payload.proposals : [];
          const pending = proposals.filter((proposal: any) => {
            const status = String(proposal?.status || "").toLowerCase();
            return status === "pending" || status === "nouveau" || status === "to_review";
          }).length;
          if (pending > 0) {
            next.push({
              id: "event-proposals",
              label: "Propositions d'événements en attente",
              count: pending,
              href: "/admin/events/propositions",
              priority: pending > 8 ? "P1" : "P2",
              source: "Events proposals",
            });
          }
        }

        if (raidsDeclRes.status === "fulfilled" && raidsDeclRes.value.ok) {
          const payload = await raidsDeclRes.value.json();
          const declarations = Array.isArray(payload?.declarations) ? payload.declarations : [];
          const pending = declarations.filter((item: any) => {
            const status = String(item?.status || "").toLowerCase();
            return status === "processing" || status === "to_study";
          }).length;
          if (pending > 0) {
            next.push({
              id: "raids-validation",
              label: "Raids à valider",
              count: pending,
              href: "/admin/engagement/raids-a-valider",
              priority: pending > 10 ? "P1" : "P2",
              source: "Raids declarations",
            });
          }
        }

        if (raidsSubPointsRes.status === "fulfilled" && raidsSubPointsRes.value.ok) {
          const payload = await raidsSubPointsRes.value.json();
          const todo = Array.isArray(payload?.todo) ? payload.todo.length : Number(payload?.todoCount || 0);
          if (todo > 0) {
            next.push({
              id: "raids-sub-review",
              label: "Raids Sub à revoir",
              count: todo,
              href: "/admin/engagement/raids-sub",
              priority: todo > 10 ? "P1" : "P2",
              source: "Raids Sub points",
            });
          }
        }

        if (evalResultRes.status === "fulfilled" && evalResultRes.value.ok) {
          const payload = await evalResultRes.value.json();
          const members = Number(payload?.stats?.membersCount || 0);
          const validated = Number(payload?.stats?.validatedCount || 0);
          const remaining = Math.max(0, members - validated);
          if (remaining > 0) {
            next.push({
              id: "evaluation-validation",
              label: "Résultats mensuels à valider",
              count: remaining,
              href: "/admin/evaluation/result",
              priority: remaining > 25 ? "P1" : "P2",
              source: "Evaluations result",
            });
          }
        }

        if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
          const payload = await alertsRes.value.json();
          const incomplete = Number(payload?.incompleteAccounts || 0);
          const errors = Number(payload?.errors || 0);
          if (incomplete > 0) {
            next.push({
              id: "incomplete-accounts",
              label: "Comptes membres incomplets",
              count: incomplete,
              href: "/admin/membres/incomplets",
              priority: incomplete > 20 ? "P2" : "P3",
              source: "Control center alerts",
            });
          }
          if (errors > 0) {
            next.push({
              id: "member-errors",
              label: "Incohérences données membres",
              count: errors,
              href: "/admin/membres/erreurs",
              priority: errors > 10 ? "P1" : "P2",
              source: "Control center alerts",
            });
          }
        }

        setItems(
          next
            .filter((item) => item.count > 0)
            .sort((a, b) => {
              const pa = a.priority === "P1" ? 3 : a.priority === "P2" ? 2 : 1;
              const pb = b.priority === "P1" ? 3 : b.priority === "P2" ? 2 : 1;
              if (pa !== pb) return pb - pa;
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
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.count, 0), [items]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/pilotage" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au cockpit pilotage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Backlog opérationnel unifié</h1>
        <p className="text-gray-300">File d'attente transverse des actions en retard ou à traiter immédiatement.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Items backlog</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Volume total</p>
          <p className="mt-2 text-3xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">P1 critiques</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{items.filter((item) => item.priority === "P1").length}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          Chargement du backlog...
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Aucun backlog en attente détecté pour le moment.
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] overflow-hidden">
          <div className="grid grid-cols-[1.6fr_90px_80px_1fr_160px] gap-2 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
            <span>Action</span>
            <span>Volume</span>
            <span>Priorité</span>
            <span>Source</span>
            <span>Accès</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.6fr_90px_80px_1fr_160px] gap-2 px-4 py-3 border-b border-white/5 items-center">
              <div className="text-sm font-medium text-white">{item.label}</div>
              <div className="text-sm text-white">{item.count}</div>
              <div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${priorityBadge(item.priority)}`}>{item.priority}</span>
              </div>
              <div className="text-xs text-gray-400">{item.source}</div>
              <Link href={item.href} className="text-sm text-amber-300 hover:text-amber-200 transition-colors">
                Ouvrir →
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

