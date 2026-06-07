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

export type MembersHubUser = {
  displayName: string;
  roleLabel: string;
  rawRole: string | null;
};

export type MembersHubState = {
  loading: boolean;
  refreshing: boolean;
  partial: boolean;
  generatedAt: string | null;
  user: MembersHubUser | null;
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

const SESSION_CACHE_KEY = "tenf:admin:members:hub:v1";

type MembersHubApiResponse = {
  user?: MembersHubUser;
  summary?: MembersHubSummary;
  ops?: MembersHubOps;
  dataHealth?: MembersHubDataHealth;
  syncMissingCount?: number;
  meta?: { generatedAt?: string; partial?: boolean };
};

function readSessionCache(): MembersHubApiResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MembersHubApiResponse;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: MembersHubApiResponse): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

function applyPayload(
  payload: MembersHubApiResponse,
  setters: {
    setUser: (v: MembersHubUser | null) => void;
    setSummary: (v: MembersHubSummary) => void;
    setOps: (v: MembersHubOps) => void;
    setDataHealth: (v: MembersHubDataHealth) => void;
    setSyncMissingCount: (v: number) => void;
    setGeneratedAt: (v: string | null) => void;
    setPartial: (v: boolean) => void;
  },
): void {
  if (payload.user) setters.setUser(payload.user);
  if (payload.summary) setters.setSummary(payload.summary);
  if (payload.ops) setters.setOps(payload.ops);
  if (payload.dataHealth) setters.setDataHealth(payload.dataHealth);
  if (typeof payload.syncMissingCount === "number") setters.setSyncMissingCount(payload.syncMissingCount);
  if (typeof payload.meta?.generatedAt === "string") setters.setGeneratedAt(payload.meta.generatedAt);
  if (typeof payload.meta?.partial === "boolean") setters.setPartial(payload.meta.partial);
}

export function useMembersHubData(): MembersHubState {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partial, setPartial] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [user, setUser] = useState<MembersHubUser | null>(null);
  const [summary, setSummary] = useState<MembersHubSummary>(DEFAULT_SUMMARY);
  const [ops, setOps] = useState<MembersHubOps>(DEFAULT_OPS);
  const [dataHealth, setDataHealth] = useState<MembersHubDataHealth>(DEFAULT_DATA_HEALTH);
  const [syncMissingCount, setSyncMissingCount] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/admin/members/hub", { cache: "no-store" });
      if (!response.ok) {
        if (!isRefresh && !readSessionCache()) setPartial(true);
        return;
      }

      const payload = (await response.json()) as MembersHubApiResponse;
      applyPayload(payload, {
        setUser,
        setSummary,
        setOps,
        setDataHealth,
        setSyncMissingCount,
        setGeneratedAt,
        setPartial,
      });
      writeSessionCache(payload);
    } catch {
      if (!isRefresh && !readSessionCache()) setPartial(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const cached = readSessionCache();
    if (cached?.user && cached.summary) {
      applyPayload(cached, {
        setUser,
        setSummary,
        setOps,
        setDataHealth,
        setSyncMissingCount,
        setGeneratedAt,
        setPartial,
      });
      setLoading(false);
    }
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
        label: "Revues cette semaine",
        count: summary.reviewDue7d,
        href: "/admin/membres/revues",
        hint: "Créateurs à revoir bientôt — anticiper évite le retard et la frustration.",
      });
    }
    if (dataHealth.warnings > 0) {
      signals.push({
        id: "data-warnings",
        label: "Fiches à compléter",
        count: dataHealth.warnings,
        href: "/admin/membres/qualite-data",
        hint: "Profils avec des champs manquants — un accompagnement doux suffit souvent.",
      });
    }
    if (dataHealth.discordMissingUsername > 0) {
      signals.push({
        id: "discord-missing",
        label: "Pseudos Discord manquants",
        count: dataHealth.discordMissingUsername,
        href: "/admin/membres/qualite-data?onglet=discord",
        hint: "Cohérence Discord/fiche — utile pour la modération et le suivi.",
      });
    }
    if (summary.incomplete > 0 && summary.incomplete < 10) {
      signals.push({
        id: "profiles-to-accompany",
        label: "Profils à accompagner",
        count: summary.incomplete,
        href: "/admin/membres/incomplets",
        hint: "Peu de fiches incomplètes — une relance personnalisée peut débloquer la situation.",
      });
    }
    if (syncMissingCount > 0 && syncMissingCount < 5) {
      signals.push({
        id: "sync-fragile",
        label: "Écarts de synchronisation",
        count: syncMissingCount,
        href: "/admin/membres/qualite-data?onglet=sync",
        hint: "Quelques écarts entre legacy et Supabase — à corriger avant qu'ils ne se multiplient.",
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
    user,
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
