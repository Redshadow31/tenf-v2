"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { computeMembersQualityScore, getMembersQualityTier } from "./membersQualityScore";
import {
  buildMembersOpsQueue,
  getMembersOpsScore,
  getTopMembersOpsActions,
  type MembersOpsItem,
} from "./membersOpsQueue";

/**
 * Hook unique qui agrège les données du hub /admin/membres.
 *
 * Centralise :
 *  - les appels API (5 endpoints) ;
 *  - le score qualité ;
 *  - la queue d'actions priorisée ;
 *  - le top 5 des actions à traiter ;
 *  - l'état loading / refreshing / generatedAt.
 *
 * Owners (localStorage) restent gérés par le composant qui en a besoin :
 * le hub n'expose plus d'édition d'owners (déléguée à /admin/membres/actions).
 */

export type MembersHubSummary = {
  total: number;
  missingDiscord: number;
  missingTwitchId: number;
  incomplete: number;
  reviewOverdue: number;
  reviewDue7d: number;
  avgCompletion: number;
  validatedProfiles: number;
};

export type MembersHubOps = {
  staffApplicationsPendingCount: number;
  staffApplicationsRedFlagCount: number;
  profileValidationPendingCount: number;
};

export type MembersHubDataHealth = {
  errors: number;
  warnings: number;
  discordMissingUsername: number;
};

export type MembersWeakSignal = {
  id: string;
  label: string;
  count: number;
  href: string;
  hint: string;
};

export type MembersHubState = {
  loading: boolean;
  refreshing: boolean;
  partial: boolean;
  generatedAt: string | null;
  summary: MembersHubSummary;
  ops: MembersHubOps;
  dataHealth: MembersHubDataHealth;
  syncMissingCount: number;
  qualityScore: number;
  qualityTier: ReturnType<typeof getMembersQualityTier>;
  opsQueue: MembersOpsItem[];
  /** Top actions urgentes/importantes (P1 + P2 ouvertes), max 5. */
  topActions: MembersOpsItem[];
  /** Détail : items P1 ouverts (urgents). */
  urgentActions: MembersOpsItem[];
  /** Détail : items P2 ouverts (importants). */
  importantActions: MembersOpsItem[];
  /** Total des actions ouvertes (P1 + P2 + P3). */
  pendingTotal: number;
  /** Signaux faibles : à surveiller sans urgence immédiate. */
  weakSignals: MembersWeakSignal[];
  refresh: () => Promise<void>;
};

const DEFAULT_SUMMARY: MembersHubSummary = {
  total: 0,
  missingDiscord: 0,
  missingTwitchId: 0,
  incomplete: 0,
  reviewOverdue: 0,
  reviewDue7d: 0,
  avgCompletion: 0,
  validatedProfiles: 0,
};

const DEFAULT_OPS: MembersHubOps = {
  staffApplicationsPendingCount: 0,
  staffApplicationsRedFlagCount: 0,
  profileValidationPendingCount: 0,
};

const DEFAULT_DATA_HEALTH: MembersHubDataHealth = {
  errors: 0,
  warnings: 0,
  discordMissingUsername: 0,
};

export function useMembersHubData(): MembersHubState {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partial, setPartial] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [summary, setSummary] = useState<MembersHubSummary>(DEFAULT_SUMMARY);
  const [ops, setOps] = useState<MembersHubOps>(DEFAULT_OPS);
  const [dataHealth, setDataHealth] = useState<MembersHubDataHealth>(DEFAULT_DATA_HEALTH);
  const [syncMissingCount, setSyncMissingCount] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    let anyFailed = false;
    try {
      const [aggregateRes, syncRes, alertsRes, discordDataRes] = await Promise.all([
        fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }).catch(() => null),
        fetch("/api/admin/migration/check-sync-members", { cache: "no-store" }).catch(() => null),
        fetch("/api/admin/control-center/alerts", { cache: "no-store" }).catch(() => null),
        fetch("/api/admin/members/discord-data", { cache: "no-store" }).catch(() => null),
      ]);

      if (aggregateRes?.ok) {
        const aggregateData = await aggregateRes.json();
        const s = aggregateData?.data?.summary || {};
        setSummary({
          total: Number(s.total || 0),
          missingDiscord: Number(s.missingDiscord || 0),
          missingTwitchId: Number(s.missingTwitchId || 0),
          incomplete: Number(s.incomplete || 0),
          reviewOverdue: Number(s.reviewOverdue || 0),
          reviewDue7d: Number(s.reviewDue7d || 0),
          avgCompletion: Number(s.avgCompletion || 0),
          validatedProfiles: Number(s.validatedProfiles || 0),
        });
        const o = aggregateData?.data?.ops || {};
        setOps({
          staffApplicationsPendingCount: Number(o.staffApplicationsPendingCount || 0),
          staffApplicationsRedFlagCount: Number(o.staffApplicationsRedFlagCount || 0),
          profileValidationPendingCount: Number(o.profileValidationPendingCount || 0),
        });
        const generated = aggregateData?.meta?.generatedAt;
        if (typeof generated === "string") setGeneratedAt(generated);
      } else {
        anyFailed = true;
      }

      if (syncRes?.ok) {
        const syncData = await syncRes.json();
        const missing = syncData?.data?.merged?.missingInSupabase;
        setSyncMissingCount(Array.isArray(missing) ? missing.length : 0);
      } else {
        anyFailed = true;
      }

      if (alertsRes?.ok) {
        const alertsData = await alertsRes.json();
        setDataHealth((prev) => ({
          ...prev,
          errors: Number(alertsData?.errors || 0),
          warnings: Number(alertsData?.warnings || 0),
        }));
      } else {
        anyFailed = true;
      }

      if (discordDataRes?.ok) {
        const discordData = await discordDataRes.json();
        const members = Array.isArray(discordData?.members) ? discordData.members : [];
        const missing = members.filter((m: unknown) => {
          const raw = (m as { discordUsername?: unknown })?.discordUsername;
          return !String(raw || "").trim();
        }).length;
        setDataHealth((prev) => ({ ...prev, discordMissingUsername: missing }));
      } else {
        anyFailed = true;
      }
    } catch {
      anyFailed = true;
    } finally {
      setPartial(anyFailed);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const qualityScore = useMemo(
    () =>
      computeMembersQualityScore({
        errors: dataHealth.errors,
        warnings: dataHealth.warnings,
        syncMissingCount,
        discordMissingUsername: dataHealth.discordMissingUsername,
      }),
    [dataHealth.errors, dataHealth.warnings, dataHealth.discordMissingUsername, syncMissingCount]
  );

  const qualityTier = useMemo(() => getMembersQualityTier(qualityScore), [qualityScore]);

  const opsQueue = useMemo(
    () =>
      buildMembersOpsQueue({
        profileValidationPendingCount: ops.profileValidationPendingCount,
        staffApplicationsPendingCount: ops.staffApplicationsPendingCount,
        reviewOverdue: summary.reviewOverdue,
        reviewDue7d: summary.reviewDue7d,
        incomplete: summary.incomplete,
        syncMissingCount,
        dataErrors: dataHealth.errors,
      }),
    [
      ops.profileValidationPendingCount,
      ops.staffApplicationsPendingCount,
      summary.reviewOverdue,
      summary.reviewDue7d,
      summary.incomplete,
      syncMissingCount,
      dataHealth.errors,
    ]
  );

  const urgentActions = useMemo(
    () =>
      opsQueue
        .filter((item) => item.priority === "P1" && item.count > 0)
        .sort((a, b) => getMembersOpsScore(b) - getMembersOpsScore(a)),
    [opsQueue]
  );
  const importantActions = useMemo(
    () =>
      opsQueue
        .filter((item) => item.priority === "P2" && item.count > 0)
        .sort((a, b) => getMembersOpsScore(b) - getMembersOpsScore(a)),
    [opsQueue]
  );
  const topActions = useMemo(() => getTopMembersOpsActions(opsQueue, 5), [opsQueue]);

  const pendingTotal = useMemo(
    () => opsQueue.reduce((sum, item) => sum + item.count, 0),
    [opsQueue]
  );

  // Signaux faibles : non-bloquants, mais utiles à surveiller.
  // Construit à partir des données déjà chargées — aucun nouveau fetch.
  const weakSignals = useMemo<MembersWeakSignal[]>(() => {
    const signals: MembersWeakSignal[] = [];

    if (summary.reviewDue7d > 0) {
      signals.push({
        id: "reviews-upcoming",
        label: "Revues à 7 jours",
        count: summary.reviewDue7d,
        href: "/admin/membres/revues",
        hint: "Créateurs à revoir cette semaine — anticiper pour éviter le retard.",
      });
    }
    if (dataHealth.warnings > 0) {
      signals.push({
        id: "data-warnings",
        label: "Alertes techniques",
        count: dataHealth.warnings,
        href: "/admin/membres/qualite-data",
        hint: "Signaux techniques à surveiller avant qu'ils deviennent bloquants.",
      });
    }
    if (dataHealth.discordMissingUsername > 0) {
      signals.push({
        id: "discord-missing",
        label: "Pseudos Discord à compléter",
        count: dataHealth.discordMissingUsername,
        href: "/admin/membres/qualite-data?onglet=discord",
        hint: "Cohérence Discord/fiche : traçabilité utile en cas de modération.",
      });
    }
    if (summary.incomplete > 0 && summary.incomplete < 10) {
      // Si peu de profils incomplets, c'est un signal à accompagner doucement
      // plutôt qu'une action urgente.
      signals.push({
        id: "profiles-to-accompany",
        label: "Profils à accompagner",
        count: summary.incomplete,
        href: "/admin/membres/incomplets",
        hint: "Profils encore incomplets — un message de relance peut suffire.",
      });
    }
    if (syncMissingCount > 0 && syncMissingCount < 5) {
      signals.push({
        id: "sync-fragile",
        label: "Écarts sync fragiles",
        count: syncMissingCount,
        href: "/admin/membres/qualite-data?onglet=sync",
        hint: "Quelques écarts entre source legacy et Supabase à résoudre.",
      });
    }

    return signals;
  }, [
    summary.reviewDue7d,
    summary.incomplete,
    dataHealth.warnings,
    dataHealth.discordMissingUsername,
    syncMissingCount,
  ]);

  return {
    loading,
    refreshing,
    partial,
    generatedAt,
    summary,
    ops,
    dataHealth,
    syncMissingCount,
    qualityScore,
    qualityTier,
    opsQueue,
    topActions,
    urgentActions,
    importantActions,
    pendingTotal,
    weakSignals,
    refresh: () => load(true),
  };
}
