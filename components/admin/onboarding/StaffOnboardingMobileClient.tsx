"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Monitor, RefreshCw, Users } from "lucide-react";
import ModeratorRegistrationModal from "@/components/admin/ModeratorRegistrationModal";
import {
  loadStaffOnboardingSnapshot,
  type StaffOnboardingIntegration,
  type StaffOnboardingModeratorStats,
  type StaffOnboardingRegistrationStats,
} from "@/lib/admin/staffOnboardingSnapshot";
import { staffingBadgeLabel } from "@/lib/integrationStaffSessionRules";

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function staffTone(stats?: StaffOnboardingModeratorStats): { label: string; className: string } {
  if (!stats) return { label: "—", className: "bg-zinc-700/40 text-zinc-300 ring-1 ring-zinc-600/40" };
  if (stats.isFullyStaffed) {
    return { label: "OK", className: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/35" };
  }
  if (stats.status === "partial") {
    return { label: "Partiel", className: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/35" };
  }
  return { label: "Urgent", className: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-500/35" };
}

export default function StaffOnboardingMobileClient() {
  const [integrations, setIntegrations] = useState<StaffOnboardingIntegration[]>([]);
  const [moderatorStats, setModeratorStats] = useState<Record<string, StaffOnboardingModeratorStats>>({});
  const [registrationStats, setRegistrationStats] = useState<Record<string, StaffOnboardingRegistrationStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [selected, setSelected] = useState<StaffOnboardingIntegration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationRefreshKey, setRegistrationRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const snap = await loadStaffOnboardingSnapshot();
      setIntegrations(snap.integrations);
      setModeratorStats(snap.moderatorStats);
      setRegistrationStats(snap.registrationStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sorted = useMemo(
    () => [...integrations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [integrations]
  );

  const filtered = useMemo(() => {
    if (!onlyAtRisk) return sorted;
    return sorted.filter((i) => !moderatorStats[i.id]?.isFullyStaffed);
  }, [sorted, onlyAtRisk, moderatorStats]);

  const kpis = useMemo(() => {
    let covered = 0;
    let atRisk = 0;
    sorted.forEach((i) => {
      if (moderatorStats[i.id]?.isFullyStaffed) covered += 1;
      else atRisk += 1;
    });
    return { total: sorted.length, covered, atRisk };
  }, [sorted, moderatorStats]);

  const openSession = (i: StaffOnboardingIntegration) => {
    setSelected(i);
    setModalOpen(true);
  };

  const handleRegister = async (formData: {
    pseudo: string;
    role: string;
    roleKey?: string | null;
    placement: "Animateur" | "Co-animateur" | "Observateur";
  }) => {
    if (!selected) return;
    setRegistering(true);
    try {
      const response = await fetch(`/api/integrations/${selected.id}/moderators/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || "Inscription enregistrée."}`);
        const modResponse = await fetch(`/api/integrations/${selected.id}/moderators`, {
          cache: "no-store",
          credentials: "include",
        });
        if (modResponse.ok) {
          const modData = await modResponse.json();
          const registrations = modData.registrations || [];
          const staffing = modData.staffing;
          setModeratorStats((prev) => ({
            ...prev,
            [selected.id]: staffing
              ? { ...staffing, registrations, adminCount: staffing.adminModeratorCount }
              : {
                  total: registrations.length,
                  founderCount: 0,
                  adminModeratorCount: 0,
                  staffCount: 0,
                  isFullyStaffed: false,
                  status: "critical" as const,
                  registrations,
                  adminCount: 0,
                },
          }));
          setRegistrationRefreshKey((k) => k + 1);
        }
      } else {
        const err = await response.json();
        alert(
          response.status === 409
            ? `ℹ️ ${err.error || "Déjà inscrit."}`
            : response.status === 403
              ? `⚠️ ${err.error || "Quota atteint."}`
              : `❌ ${err.error || "Erreur"}`,
        );
      }
    } catch {
      alert("❌ Erreur réseau");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="-mx-4 -mb-4 min-h-[calc(100dvh-5rem)] bg-[#0b0c10] px-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-white md:-mx-0 md:-mb-0 md:min-h-[calc(100dvh-5rem)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0c10]/95 px-4 py-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] md:px-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 md:max-w-none">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/90">Onboarding</p>
            <h1 className="truncate text-lg font-bold leading-tight">Équipe sur session</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200 active:bg-white/10 disabled:opacity-50"
              aria-label="Actualiser"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/admin/onboarding/staff"
              className="flex h-11 items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3 text-xs font-semibold text-indigo-100 active:bg-indigo-500/25"
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Bureau</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-3 md:max-w-none md:px-3">
        {error ? (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-950/40 px-3 py-2.5 text-sm text-rose-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mb-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[28%] snap-start rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5">
            <p className="text-[10px] uppercase text-zinc-500">Sessions</p>
            <p className="text-xl font-black tabular-nums">{kpis.total}</p>
          </div>
          <div className="min-w-[28%] snap-start rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-3 py-2.5">
            <p className="text-[10px] uppercase text-emerald-200/80">Couvertes</p>
            <p className="text-xl font-black tabular-nums text-emerald-200">{kpis.covered}</p>
          </div>
          <div className="min-w-[28%] snap-start rounded-xl border border-amber-500/25 bg-amber-950/25 px-3 py-2.5">
            <p className="text-[10px] uppercase text-amber-200/80">À compléter</p>
            <p className="text-xl font-black tabular-nums text-amber-100">{kpis.atRisk}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnlyAtRisk((v) => !v)}
          className={`mb-4 w-full rounded-xl border py-3 text-sm font-semibold transition active:scale-[0.99] ${
            onlyAtRisk
              ? "border-amber-400/50 bg-amber-500/20 text-amber-50"
              : "border-white/12 bg-white/5 text-zinc-300"
          }`}
        >
          {onlyAtRisk ? "Afficher toutes les sessions" : "Voir seulement les sessions incomplètes"}
        </button>

        {loading && !integrations.length ? (
          <div className="space-y-3 py-8">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="h-20 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {integrations.length === 0 ? "Aucune session pour l’instant." : "Aucune session ne correspond à ce filtre."}
          </p>
        ) : (
          <ul className="space-y-2 pb-24">
            {filtered.map((i) => {
              const stats = moderatorStats[i.id];
              const regs = registrationStats[i.id];
              const tone = staffTone(stats);
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => openSession(i)}
                    className="flex w-full min-h-[4.5rem] items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 px-3 py-3 text-left active:bg-zinc-800/80"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-semibold text-white">{i.title}</span>
                      <span className="text-xs text-zinc-500">{formatSessionDate(i.date)}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" aria-hidden />
                          {regs?.normalCount ?? 0} inscrits
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span>{stats ? staffingBadgeLabel(stats) : "—"}</span>
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone.className}`}>{tone.label}</span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected ? (
        <ModeratorRegistrationModal
          integration={{
            ...selected,
            date: new Date(selected.date),
          }}
          isOpen={modalOpen}
          refreshKey={registrationRefreshKey}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
          onRegister={handleRegister}
          isLoading={registering}
        />
      ) : null}
    </div>
  );
}
