"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  Calendar,
  FileText,
  HeartHandshake,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

type MigrationType = "members" | "events" | "evaluations" | "follows";

interface SyncStatusItem {
  type: MigrationType;
  label: string;
  inSource: number;
  inTarget: number;
  missing: number;
}

interface SyncAllResponse {
  success: boolean;
  data?: {
    events?: { inBlobs?: number; inSupabase?: number; missingInSupabase?: unknown[] };
    evaluations?: { inBlobs?: number; inSupabase?: number; missingInSupabase?: unknown[] };
    follows?: { inBlobs?: number; inSupabase?: number; missingInSupabase?: unknown[] };
    members?: { totalInBlobs?: number; totalInSupabase?: number; missingInSupabase?: unknown[] };
  };
  error?: string;
}

interface MigrateAllResponse {
  success: boolean;
  message: string;
  results?: Partial<Record<MigrationType, { migrated: number; skipped: number; errors: number }>>;
  errors?: string[];
  error?: string;
}

const steps: Array<{ type: MigrationType; title: string; href: string; icon: React.ReactNode; desc: string }> = [
  {
    type: "members",
    title: "Membres",
    href: "/admin/migration/members",
    icon: <Users className="w-5 h-5" />,
    desc: "Profils, rôles et identifiants membres.",
  },
  {
    type: "events",
    title: "Événements",
    href: "/admin/migration/events",
    icon: <Calendar className="w-5 h-5" />,
    desc: "Événements, inscriptions et présences.",
  },
  {
    type: "evaluations",
    title: "Évaluations",
    href: "/admin/migration/evaluations",
    icon: <FileText className="w-5 h-5" />,
    desc: "Évaluations mensuelles et calculs.",
  },
  {
    type: "follows",
    title: "Follows",
    href: "/admin/migration/follows",
    icon: <HeartHandshake className="w-5 h-5" />,
    desc: "Validations de follows et historique.",
  },
];

export default function MigrationHubPage() {
  const [checking, setChecking] = useState(false);
  const [migratingType, setMigratingType] = useState<MigrationType | null>(null);
  const [migratingAll, setMigratingAll] = useState(false);
  const [syncItems, setSyncItems] = useState<SyncStatusItem[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");

  const missingTotal = useMemo(
    () => syncItems.reduce((acc, item) => acc + item.missing, 0),
    [syncItems]
  );

  const refreshSync = async () => {
    setChecking(true);
    setError("");
    setFeedback("");
    try {
      const response = await fetch("/api/admin/migration/check-sync-all", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as SyncAllResponse;
      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      const items: SyncStatusItem[] = [];
      if (data.data.members) {
        const source = data.data.members.totalInBlobs || 0;
        const target = data.data.members.totalInSupabase || 0;
        items.push({
          type: "members",
          label: "Membres",
          inSource: source,
          inTarget: target,
          missing: data.data.members.missingInSupabase?.length || 0,
        });
      }
      if (data.data.events) {
        items.push({
          type: "events",
          label: "Événements",
          inSource: data.data.events.inBlobs || 0,
          inTarget: data.data.events.inSupabase || 0,
          missing: data.data.events.missingInSupabase?.length || 0,
        });
      }
      if (data.data.evaluations) {
        items.push({
          type: "evaluations",
          label: "Évaluations",
          inSource: data.data.evaluations.inBlobs || 0,
          inTarget: data.data.evaluations.inSupabase || 0,
          missing: data.data.evaluations.missingInSupabase?.length || 0,
        });
      }
      if (data.data.follows) {
        items.push({
          type: "follows",
          label: "Follows",
          inSource: data.data.follows.inBlobs || 0,
          inTarget: data.data.follows.inSupabase || 0,
          missing: data.data.follows.missingInSupabase?.length || 0,
        });
      }

      setSyncItems(items);
      setFeedback("Diagnostic terminé. Tu peux migrer bloc par bloc.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setChecking(false);
    }
  };

  const migrateTypes = async (types: MigrationType[]) => {
    setError("");
    setFeedback("");
    try {
      const response = await fetch("/api/admin/migration/migrate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ types }),
      });
      const data = (await response.json()) as MigrateAllResponse;
      if (!response.ok || (!data.success && !data.results)) {
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }
      setFeedback(data.message || "Migration exécutée.");
      await refreshSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const migrateOne = async (type: MigrationType) => {
    setMigratingType(type);
    await migrateTypes([type]);
    setMigratingType(null);
  };

  const migrateAllMissing = async () => {
    const typesToRun = syncItems.filter((s) => s.missing > 0).map((s) => s.type);
    if (typesToRun.length === 0) {
      setFeedback("Aucune donnée manquante détectée.");
      return;
    }
    setMigratingAll(true);
    await migrateTypes(typesToRun);
    setMigratingAll(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader
        title="🧭 Migration des données"
        navLinks={[
          { href: "/admin/control-center", label: "Centre de contrôle" },
          { href: "/admin/migration", label: "Migration", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        <section className="rounded-xl border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Ancien fonctionnement vers nouveau Supabase
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Lance un diagnostic puis migre les données point par point. Tu peux aussi ouvrir les pages détaillées pour contrôler chaque lot.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshSync}
              disabled={checking}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {checking ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </span>
              ) : (
                "1) Vérifier l'état des données"
              )}
            </button>
            <button
              onClick={migrateAllMissing}
              disabled={migratingAll || syncItems.length === 0}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#16a34a" }}
            >
              {migratingAll ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Migration globale...
                </span>
              ) : (
                "3) Migrer tous les blocs manquants"
              )}
            </button>
            <Link
              href="/admin/migration/all"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              Ouvrir la migration globale avancée
            </Link>
          </div>
        </section>

        {syncItems.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {syncItems.map((item) => (
              <div
                key={item.type}
                className="rounded-xl border p-4"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>{item.label}</h3>
                  {item.missing === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Source: <span style={{ color: "var(--color-text)" }}>{item.inSource}</span> | Cible: <span style={{ color: "var(--color-text)" }}>{item.inTarget}</span>
                </p>
                <p className="text-sm mt-1" style={{ color: item.missing > 0 ? "#f59e0b" : "#22c55e" }}>
                  Manquants: {item.missing}
                </p>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            2) Migration bloc par bloc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step) => {
              const status = syncItems.find((s) => s.type === step.type);
              const isRunning = migratingType === step.type;
              return (
                <div
                  key={step.type}
                  className="rounded-xl border p-5"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center gap-3 mb-2" style={{ color: "var(--color-text)" }}>
                    {step.icon}
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
                    {step.desc}
                  </p>
                  {status && (
                    <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
                      Source {status.inSource} | Cible {status.inTarget} | Manquants {status.missing}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => migrateOne(step.type)}
                      disabled={isRunning || checking}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {isRunning ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Migration...
                        </span>
                      ) : (
                        "Migrer ce bloc"
                      )}
                    </button>
                    <Link
                      href={step.href}
                      className="px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1"
                      style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                    >
                      Détail <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {(feedback || error) && (
          <section
            className="rounded-xl border p-4"
            style={{
              backgroundColor: error ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              borderColor: error ? "#ef4444" : "#22c55e",
              color: error ? "#fca5a5" : "#86efac",
            }}
          >
            {error || feedback}
          </section>
        )}

        {syncItems.length > 0 && (
          <section
            className="rounded-xl border p-4 text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            Résumé actuel: <strong style={{ color: "var(--color-text)" }}>{missingTotal}</strong> élément(s) encore manquant(s) dans la cible.
          </section>
        )}
      </div>
    </div>
  );
}
