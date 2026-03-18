"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Siren, Wrench } from "lucide-react";

type ConnectionsPayload = {
  summary?: {
    total?: number;
    success?: number;
    errors?: number;
    warnings?: number;
    notTestable?: number;
  };
  results?: Array<{ service?: string; status?: string; message?: string }>;
};

type AlertsPayload = {
  incompleteAccounts?: number;
  errors?: number;
  spotlightsPending?: number;
  evaluationsPending?: number | null;
};

export default function PilotageIncidentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionsPayload>({});
  const [alerts, setAlerts] = useState<AlertsPayload>({});
  const [safeMode, setSafeMode] = useState<"enabled" | "disabled" | "forbidden" | "unknown">("unknown");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [connectionsRes, alertsRes, safeModeRes] = await Promise.allSettled([
          fetch("/api/admin/system-test/connections", { cache: "no-store" }),
          fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
          fetch("/api/admin/safe-mode", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (connectionsRes.status === "fulfilled" && connectionsRes.value.ok) {
          setConnections((await connectionsRes.value.json()) as ConnectionsPayload);
        }

        if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
          setAlerts((await alertsRes.value.json()) as AlertsPayload);
        }

        if (safeModeRes.status === "fulfilled") {
          if (safeModeRes.value.status === 403) {
            setSafeMode("forbidden");
          } else if (safeModeRes.value.ok) {
            const payload = await safeModeRes.value.json();
            setSafeMode(payload?.safeModeEnabled ? "enabled" : "disabled");
          }
        }
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

  const incidents = useMemo(() => {
    const rows: Array<{ id: string; severity: "high" | "medium" | "low"; title: string; description: string; href?: string }> = [];

    const systemErrors = Number(connections?.summary?.errors || 0);
    const systemWarnings = Number(connections?.summary?.warnings || 0);
    if (systemErrors > 0) {
      rows.push({
        id: "system-errors",
        severity: "high",
        title: "Services en erreur",
        description: `${systemErrors} service(s) KO détecté(s) par le test de connexions.`,
        href: "/admin/pilotage/release-readiness",
      });
    }
    if (systemWarnings > 0) {
      rows.push({
        id: "system-warnings",
        severity: "medium",
        title: "Services en warning",
        description: `${systemWarnings} service(s) dégradé(s) ou non configuré(s).`,
        href: "/admin/pilotage/release-readiness",
      });
    }

    const dataErrors = Number(alerts?.errors || 0);
    if (dataErrors > 0) {
      rows.push({
        id: "data-errors",
        severity: "high",
        title: "Incohérences données",
        description: `${dataErrors} incohérence(s) membres détectée(s).`,
        href: "/admin/membres/erreurs",
      });
    }

    const incomplete = Number(alerts?.incompleteAccounts || 0);
    if (incomplete > 0) {
      rows.push({
        id: "incomplete-accounts",
        severity: "medium",
        title: "Comptes incomplets",
        description: `${incomplete} compte(s) incomplet(s) à traiter.`,
        href: "/admin/membres/incomplets",
      });
    }

    if (safeMode === "enabled") {
      rows.push({
        id: "safe-mode",
        severity: "high",
        title: "Safe mode actif",
        description: "Le safe mode est activé. Vérifier les incidents en cours et le plan de remédiation.",
        href: "/admin/gestion-acces/admin-avance",
      });
    }

    return rows;
  }, [alerts, connections, safeMode]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/pilotage" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au cockpit pilotage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Alertes & incidents</h1>
        <p className="text-gray-300">Lecture opérationnelle des incidents techniques et risques data.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Incidents ouverts</p>
          <p className={`mt-2 text-3xl font-bold ${incidents.length > 0 ? "text-rose-300" : "text-emerald-300"}`}>{incidents.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Critiques</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{incidents.filter((item) => item.severity === "high").length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Warnings techniques</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{Number(connections?.summary?.warnings || 0)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Safe mode</p>
          <p className={`mt-2 text-3xl font-bold ${safeMode === "enabled" ? "text-rose-300" : "text-emerald-300"}`}>
            {safeMode === "enabled" ? "ON" : "OFF"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">Chargement des incidents...</div>
      ) : null}

      {!loading && incidents.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Aucun incident ouvert actuellement.
        </div>
      ) : null}

      {!loading && incidents.length > 0 ? (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="rounded-xl border border-white/10 bg-[#15151c] p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {incident.severity === "high" ? (
                    <Siren className="h-4 w-4 text-rose-300" />
                  ) : incident.severity === "medium" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-sky-300" />
                  )}
                  <p className="font-semibold">{incident.title}</p>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                      incident.severity === "high"
                        ? "bg-rose-500/15 border-rose-400/40 text-rose-200"
                        : incident.severity === "medium"
                          ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                          : "bg-sky-500/15 border-sky-400/40 text-sky-200"
                    }`}
                  >
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{incident.description}</p>
              </div>
              {incident.href ? (
                <Link href={incident.href} className="text-sm text-amber-300 hover:text-amber-200 transition-colors">
                  Ouvrir →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Actions utiles</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Link href="/admin/pilotage/release-readiness" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
            Vérifier la connectivité services
          </Link>
          <Link href="/admin/membres/erreurs" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
            Corriger les incohérences membres
          </Link>
          <Link href="/admin/gestion-acces/admin-avance" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
            Gérer le safe mode
          </Link>
        </div>
      </div>
    </div>
  );
}

