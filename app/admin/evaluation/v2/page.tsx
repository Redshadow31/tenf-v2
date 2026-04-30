"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type EvaluationV2Row = {
  twitchLogin: string;
  displayName: string;
  role: string;
  isActive: boolean;
  alerts?: string[];
  createdAt?: string | null;
  totals: {
    totalWithoutBonus: number;
    totalWithBonus: number;
  };
  blocs: {
    bloc1VisibleSupport: number;
    bloc2Discord: number;
    bloc3Regularite: number;
    bloc4ImplicationGlobale: number;
  };
  details: {
    bloc1: {
      raids: number;
      spotlight: number;
      events: number;
      raidsDone: number;
      spotlightPresences: number;
      spotlightTotal: number;
      regularEventPresences: number;
      regularEventsTotal: number;
    };
    bloc2: {
      noteEcrit: number;
      noteVocal: number;
      participationUtile: number;
      nbMessages: number;
      nbVocalMinutes: number;
    };
    bloc3: {
      networkSignalCount: number;
      followScore: number;
      networkParticipationScore: number;
      entraideScore: number;
    };
    bloc4: {
      regularityScore: number;
      obligationsScore: number;
      behaviorScore: number;
      responsivenessScore: number;
      abusePenaltyScore: number;
      reliabilityScore: number;
      staffCaseScore?: number;
    };
    bonus: {
      raw: number;
      capped: number;
    };
    sourceConfidence?: {
      bloc1: number;
      bloc2: number;
      bloc3: number;
      bloc4: number;
      global: number;
      discordSourceUsed: "primary" | "fallback" | "none";
      followSourceUsed: "sheet" | "snapshot" | "none";
    };
    manualOverride?: {
      bloc1?: number;
      bloc2?: number;
      bloc3?: number;
      bloc4?: number;
      bonus?: number;
      reason?: string;
      updatedAt?: string;
      updatedBy?: string;
    };
  };
};

type EvaluationV2Payload = {
  success: boolean;
  month: string;
  system?: "legacy" | "new";
  quality?: {
    checklist: {
      sourcesPresent: {
        discord: boolean;
        follow: boolean;
        events: boolean;
      };
      overridesJustified: boolean;
      hasBlockingAlerts: boolean;
      readyToValidate: boolean;
    };
    alerts: {
      total: number;
      blocking: number;
      warning: number;
      byCode: Record<string, number>;
      rowsWithAnyAlert: number;
      rowsWithBlockingAlert: number;
      rowsWithWarningOnly: number;
    };
    overrides: {
      total: number;
      withoutReason: number;
      justified: boolean;
    };
    sourceConfidence?: {
      bloc1: number;
      bloc2: number;
      bloc3: number;
      bloc4: number;
      global: number;
    };
  };
  validation?: {
    month: string;
    system: "legacy" | "new";
    validated: boolean;
    validationStage?: "none" | "data_prevalidated" | "staff_validated";
    dataPrevalidatedAt?: string;
    dataPrevalidatedBy?: string;
    dataPrevalidatedByUsername?: string;
    staffValidatedAt?: string;
    staffValidatedBy?: string;
    staffValidatedByUsername?: string;
    frozen?: boolean;
    frozenAt?: string;
    frozenBy?: string;
    frozenByUsername?: string;
    validatedAt?: string;
    validatedBy?: string;
    validatedByUsername?: string;
    validationNote?: string;
    updatedAt: string;
  } | null;
  lifecycle?: {
    frozen: boolean;
    persistenceLocked: boolean;
  };
  runs?: {
    latest?: {
      id: string;
      month: string;
      system: "legacy" | "new";
      runAt: string;
      trigger: "auto_result_refresh" | "manual_action";
      triggeredBy?: string;
      triggeredByUsername?: string;
      summary: {
        rowsCount: number;
        newRows: number;
        removedRows: number;
        changedRows: number;
        avgFinalDelta: number;
        maxFinalDelta: number;
      };
      note?: string;
    } | null;
  };
  stats: {
    membersCount: number;
    avgTotalWithBonus: number;
    avgBloc1: number;
    avgBloc2: number;
    avgBloc3: number;
    avgBloc4: number;
    topCount: number;
    watchCount: number;
  };
  rows: EvaluationV2Row[];
};

type MainTab = "total" | "b1" | "b2" | "b3" | "b4" | "bonus";
type SegmentFilter = "all" | "newcomers" | "community";
type ConfidenceFilter = "all" | "lt70" | "lt50";
type SortField =
  | "final"
  | "totalWithoutBonus"
  | "b1"
  | "b2"
  | "b3"
  | "b4"
  | "bonus"
  | "confidence"
  | "name"
  | "role"
  | "createdAt";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    options.push(`${year}-${month}`);
  }
  return options;
}

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  const names = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${names[Math.max(0, Number(month) - 1)]} ${year}`;
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthFromIso(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function roleNormalized(role: string): string {
  return (role || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isCommunityRole(role: string): boolean {
  return roleNormalized(role).includes("communaute");
}

function isNewcomer(row: EvaluationV2Row, selectedMonth: string): boolean {
  const normalizedRole = roleNormalized(row.role);
  if (normalizedRole.includes("nouveau")) return true;
  const createdMonth = monthFromIso(row.createdAt);
  if (!createdMonth) return false;
  const prevMonth = getPreviousMonthKey(selectedMonth);
  return createdMonth === selectedMonth || createdMonth === prevMonth;
}

function statCard(title: string, value: string, subtitle?: string) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </p>
      <p className="text-xl font-bold">{value}</p>
      {subtitle ? (
        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function alertLabel(alertCode: string): string {
  switch (alertCode) {
    case "donnee_manquante":
      return "Donnée manquante";
    case "follow_indisponible":
      return "Source follow indisponible";
    case "mois_incomplet":
      return "Mois incomplet";
    case "override_manuel":
      return "Override manuel présent";
    case "membre_non_eligible":
      return "Membre non éligible";
    case "score_incoherent":
      return "Score incohérent";
    default:
      return alertCode;
  }
}

function confidenceTone(value: number): {
  label: string;
  borderColor: string;
  color: string;
  backgroundColor: string;
} {
  if (value >= 85) {
    return {
      label: "Elevee",
      borderColor: "rgba(34,197,94,0.5)",
      color: "#86efac",
      backgroundColor: "rgba(34,197,94,0.12)",
    };
  }
  if (value >= 70) {
    return {
      label: "Correcte",
      borderColor: "rgba(59,130,246,0.5)",
      color: "#93c5fd",
      backgroundColor: "rgba(59,130,246,0.12)",
    };
  }
  if (value >= 50) {
    return {
      label: "Fragile",
      borderColor: "rgba(245,158,11,0.5)",
      color: "#fcd34d",
      backgroundColor: "rgba(245,158,11,0.12)",
    };
  }
  return {
    label: "Faible",
    borderColor: "rgba(239,68,68,0.5)",
    color: "#fca5a5",
    backgroundColor: "rgba(239,68,68,0.12)",
  };
}

export default function EvaluationV2Page() {
  const searchParams = useSearchParams();
  const initialSystem = searchParams?.get("system") === "new" ? "new" : "legacy";
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedSystem, setSelectedSystem] = useState<"legacy" | "new">(initialSystem);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EvaluationV2Payload | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [savingValidation, setSavingValidation] = useState(false);
  const [validationNote, setValidationNote] = useState("");

  const [activeTab, setActiveTab] = useState<MainTab>("total");
  const [searchQuery, setSearchQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [sortField, setSortField] = useState<SortField>("final");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (confidenceFilter !== "all" && activeTab !== "total") {
      setActiveTab("total");
    }
  }, [confidenceFilter, activeTab]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/evaluations/v2/result?month=${selectedMonth}&system=${selectedSystem}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.debugError || payload.error || "Chargement impossible");
        }
        if (mounted) setData(payload as EvaluationV2Payload);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [selectedMonth, selectedSystem, refreshTick]);

  useEffect(() => {
    setValidationNote(data?.validation?.validationNote || "");
  }, [data?.validation?.validationNote]);

  const labels = selectedSystem === "new"
    ? {
        b1: "Soutien visible",
        b2: "Engagement Discord",
        b3: "Soutien réseau",
        b4: "Fiabilité",
        subtitle: "Nouveau système (/20 + bonus /5).",
      }
    : {
        b1: "Mise en avant & soutien visible",
        b2: "Engagement Discord",
        b3: "Régularité communautaire",
        b4: "Implication globale",
        subtitle: "Système actuel (legacy) conservé pendant la migration.",
      };

  const allRows = useMemo(() => data?.rows || [], [data]);

  const filteredRows = useMemo(() => {
    let rows = [...allRows];

    if (!includeInactive) {
      rows = rows.filter((row) => row.isActive !== false);
    }

    if (segmentFilter === "newcomers") {
      rows = rows.filter((row) => isNewcomer(row, selectedMonth));
    } else if (segmentFilter === "community") {
      rows = rows.filter((row) => isCommunityRole(row.role));
    }

    if (confidenceFilter === "lt70") {
      rows = rows.filter((row) => (row.details.sourceConfidence?.global || 100) < 70);
    } else if (confidenceFilter === "lt50") {
      rows = rows.filter((row) => (row.details.sourceConfidence?.global || 100) < 50);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) => {
        return (
          row.displayName.toLowerCase().includes(q) ||
          row.twitchLogin.toLowerCase().includes(q) ||
          row.role.toLowerCase().includes(q)
        );
      });
    }

    rows.sort((a, b) => {
      let left: number | string = 0;
      let right: number | string = 0;

      switch (sortField) {
        case "final":
          left = a.totals.totalWithBonus;
          right = b.totals.totalWithBonus;
          break;
        case "totalWithoutBonus":
          left = a.totals.totalWithoutBonus;
          right = b.totals.totalWithoutBonus;
          break;
        case "b1":
          left = a.blocs.bloc1VisibleSupport;
          right = b.blocs.bloc1VisibleSupport;
          break;
        case "b2":
          left = a.blocs.bloc2Discord;
          right = b.blocs.bloc2Discord;
          break;
        case "b3":
          left = a.blocs.bloc3Regularite;
          right = b.blocs.bloc3Regularite;
          break;
        case "b4":
          left = a.blocs.bloc4ImplicationGlobale;
          right = b.blocs.bloc4ImplicationGlobale;
          break;
        case "bonus":
          left = a.details.bonus.capped;
          right = b.details.bonus.capped;
          break;
        case "confidence":
          left = a.details.sourceConfidence?.global ?? -1;
          right = b.details.sourceConfidence?.global ?? -1;
          break;
        case "name":
          left = a.displayName.toLowerCase();
          right = b.displayName.toLowerCase();
          break;
        case "role":
          left = a.role.toLowerCase();
          right = b.role.toLowerCase();
          break;
        case "createdAt":
          left = new Date(a.createdAt || "1970-01-01").getTime();
          right = new Date(b.createdAt || "1970-01-01").getTime();
          break;
      }

      if (typeof left === "string" && typeof right === "string") {
        const comp = left.localeCompare(right);
        return sortDirection === "asc" ? comp : -comp;
      }

      const diff = Number(left) - Number(right);
      return sortDirection === "asc" ? diff : -diff;
    });

    return rows;
  }, [allRows, includeInactive, segmentFilter, confidenceFilter, searchQuery, sortField, sortDirection, selectedMonth]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const activeCount = filteredRows.filter((row) => row.isActive !== false).length;
    const communityCount = filteredRows.filter((row) => isCommunityRole(row.role)).length;
    const newcomersCount = filteredRows.filter((row) => isNewcomer(row, selectedMonth)).length;
    const alertsCount = filteredRows.filter((row) => (row.alerts || []).length > 0).length;

    const avg = (getter: (r: EvaluationV2Row) => number) =>
      total === 0 ? 0 : filteredRows.reduce((sum, row) => sum + getter(row), 0) / total;

    return {
      total,
      activeCount,
      communityCount,
      newcomersCount,
      alertsCount,
      avgFinal: avg((r) => r.totals.totalWithBonus),
      avgB1: avg((r) => r.blocs.bloc1VisibleSupport),
      avgB2: avg((r) => r.blocs.bloc2Discord),
      avgB3: avg((r) => r.blocs.bloc3Regularite),
      avgB4: avg((r) => r.blocs.bloc4ImplicationGlobale),
    };
  }, [filteredRows, selectedMonth]);

  const preValidation = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of filteredRows) {
      for (const alert of row.alerts || []) {
        counts.set(alert, (counts.get(alert) || 0) + 1);
      }
    }
    const entries = Array.from(counts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    const blockingCodes = new Set(["donnee_manquante", "follow_indisponible", "mois_incomplet", "score_incoherent"]);
    const blockingCount = entries.reduce((sum, item) => sum + (blockingCodes.has(item.code) ? item.count : 0), 0);

    return {
      totalAlerts: entries.reduce((sum, item) => sum + item.count, 0),
      blockingCount,
      entries,
      ready: blockingCount === 0,
    };
  }, [filteredRows]);

  const checklist = data?.quality?.checklist;
  const checklistItems = [
    {
      key: "discord",
      label: "Source Discord presente",
      ok: checklist ? checklist.sourcesPresent.discord : true,
      detail: "Import messages/vocaux disponible pour le mois.",
    },
    {
      key: "follow",
      label: "Source follow presente",
      ok: checklist ? checklist.sourcesPresent.follow : true,
      detail: "Donnees follow disponibles pour le mois.",
    },
    {
      key: "events",
      label: "Mois avec events identifies",
      ok: checklist ? checklist.sourcesPresent.events : true,
      detail: "Au moins un event trouve sur le mois cible.",
    },
    {
      key: "overrides",
      label: "Overrides justifies",
      ok: checklist ? checklist.overridesJustified : true,
      detail: "Chaque override manuel possede une raison.",
    },
    {
      key: "blocking",
      label: "Aucune alerte bloquante",
      ok: checklist ? !checklist.hasBlockingAlerts : preValidation.blockingCount === 0,
      detail: "Donnee manquante / follow indisponible / mois incomplet / score incoherent.",
    },
  ];

  const lowConfidenceSummary = useMemo(() => {
    const rowsWithConfidence = filteredRows.filter(
      (row) => row.details.sourceConfidence && Number.isFinite(row.details.sourceConfidence.global),
    );
    const low = rowsWithConfidence.filter((row) => (row.details.sourceConfidence?.global || 0) < 70).length;
    const veryLow = rowsWithConfidence.filter((row) => (row.details.sourceConfidence?.global || 0) < 50).length;
    return {
      tracked: rowsWithConfidence.length,
      low,
      veryLow,
    };
  }, [filteredRows]);

  async function saveMonthlyValidationAction(action: "set_data_prevalidated" | "set_staff_validated" | "clear_validation" | "set_frozen" | "unset_frozen") {
    try {
      setSavingValidation(true);
      setError(null);
      const response = await fetch("/api/evaluations/v2/validation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          system: selectedSystem,
          action,
          validationNote,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de sauvegarder la validation");
      }
      setRefreshTick((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSavingValidation(false);
    }
  }

  function exportAlertsCsv() {
    const rows = filteredRows.filter((row) => (row.alerts || []).length > 0);
    if (rows.length === 0) return;

    const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [
      "twitchLogin",
      "displayName",
      "role",
      "isActive",
      "alerts",
      "bloc1",
      "bloc2",
      "bloc3",
      "bloc4",
      "bonus",
      "totalWithoutBonus",
      "totalWithBonus",
    ];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(
        [
          escapeCsv(row.twitchLogin),
          escapeCsv(row.displayName),
          escapeCsv(row.role),
          row.isActive ? "true" : "false",
          escapeCsv((row.alerts || []).join("|")),
          row.blocs.bloc1VisibleSupport.toFixed(2),
          row.blocs.bloc2Discord.toFixed(2),
          row.blocs.bloc3Regularite.toFixed(2),
          row.blocs.bloc4ImplicationGlobale.toFixed(2),
          row.details.bonus.capped.toFixed(2),
          row.totals.totalWithoutBonus.toFixed(2),
          row.totals.totalWithBonus.toFixed(2),
        ].join(","),
      );
    }

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-v2-alertes-${selectedSystem}-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen text-white p-8 space-y-6" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/admin/evaluation" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            ← Retour au pilotage évaluation
          </Link>
          <h1 className="text-3xl font-bold mt-2">Évaluation v2</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {labels.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/admin/evaluation/v2/guide?system=${selectedSystem}`}
            className="rounded-lg px-3 py-2 text-sm font-medium border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            Guide évaluation v2
          </Link>
          <Link
            href="/admin/evaluation/v2/sources"
            className="rounded-lg px-3 py-2 text-sm font-medium border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            Données manquantes v2
          </Link>
          <Link
            href={`/admin/evaluation/v2/pilotage?system=${selectedSystem}`}
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "#9146ff", color: "white" }}
          >
            Pilotage manuel v2
          </Link>
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Mois
          </label>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value as "legacy" | "new")}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <option value="legacy">Système legacy</option>
            <option value="new">Nouveau système</option>
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {getMonthOptions().map((option) => (
              <option key={option} value={option}>
                {formatMonthKey(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "total", label: "Total global" },
            { id: "b1", label: labels.b1 },
            { id: "b2", label: labels.b2 },
            { id: "b3", label: labels.b3 },
            { id: "b4", label: labels.b4 },
            { id: "bonus", label: "Bonus" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainTab)}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{
                borderColor: activeTab === tab.id ? "#9146ff" : "var(--color-border)",
                backgroundColor: activeTab === tab.id ? "#9146ff" : "var(--color-surface)",
                color: activeTab === tab.id ? "white" : "var(--color-text)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un membre..."
            className="w-full max-w-sm rounded-lg px-3 py-2 border text-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />

          <label className="text-sm flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Inclure les inactifs
          </label>

          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as SegmentFilter)}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <option value="all">Tous</option>
            <option value="newcomers">Tri: Nouveaux (rôle Nouveau + entrés mois courant/précédent)</option>
            <option value="community">Tri: Communauté</option>
          </select>

          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceFilter)}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <option value="all">Confiance: Tous</option>
            <option value="lt70">Confiance: &lt; 70%</option>
            <option value="lt50">Confiance: &lt; 50%</option>
          </select>

          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <option value="final">Tri avancé: Final /25</option>
            <option value="totalWithoutBonus">Tri avancé: Total /20</option>
            <option value="b1">Tri avancé: {labels.b1}</option>
            <option value="b2">Tri avancé: {labels.b2}</option>
            <option value="b3">Tri avancé: {labels.b3}</option>
            <option value="b4">Tri avancé: {labels.b4}</option>
            <option value="bonus">Tri avancé: Bonus</option>
            <option value="confidence">Tri avancé: Confiance sources</option>
            <option value="name">Tri avancé: Nom</option>
            <option value="role">Tri avancé: Rôle</option>
            <option value="createdAt">Tri avancé: Date entrée</option>
          </select>

          <button
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            {sortDirection === "asc" ? "Ordre: croissant" : "Ordre: décroissant"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          Chargement de l'évaluation v2...
        </div>
      )}

      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "#dc2626", color: "#fecaca" }}>
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div
            className="rounded-lg border p-4 space-y-4"
            style={{
              borderColor: preValidation.ready ? "#16a34a" : "#f59e0b",
              backgroundColor: preValidation.ready ? "rgba(22,163,74,0.10)" : "rgba(245,158,11,0.10)",
            }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold">
                  {preValidation.ready
                    ? "Pré-validation: tableau prêt à valider"
                    : "Pré-validation: actions admin requises avant validation"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {preValidation.ready
                    ? "Checklist complete. Validation mensuelle possible."
                    : `${preValidation.blockingCount} alerte(s) bloquante(s) detectee(s) sur le perimetre affiche.`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Bloquantes: {data?.quality?.alerts.blocking ?? preValidation.blockingCount} - Warnings:{" "}
                  {data?.quality?.alerts.warning ?? 0}
                </p>
                {data?.quality?.sourceConfidence && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    Confiance sources (global): {data.quality.sourceConfidence.global.toFixed(2)}%
                  </p>
                )}
                {data?.quality?.sourceConfidence && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[
                      { id: "b1", label: labels.b1, value: data.quality.sourceConfidence.bloc1 },
                      { id: "b2", label: labels.b2, value: data.quality.sourceConfidence.bloc2 },
                      { id: "b3", label: labels.b3, value: data.quality.sourceConfidence.bloc3 },
                      { id: "b4", label: labels.b4, value: data.quality.sourceConfidence.bloc4 },
                    ].map((item) => {
                      const tone = confidenceTone(item.value);
                      return (
                        <span
                          key={item.id}
                          className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ borderColor: tone.borderColor, color: tone.color, backgroundColor: tone.backgroundColor }}
                        >
                          {item.label}: {item.value.toFixed(1)}%
                        </span>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
                  Lignes confiance &lt;70%: {lowConfidenceSummary.low} · &lt;50%: {lowConfidenceSummary.veryLow}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={exportAlertsCsv}
                  disabled={(data?.quality?.alerts.rowsWithAnyAlert ?? preValidation.totalAlerts) === 0}
                  className="rounded-lg px-3 py-2 text-xs font-medium border disabled:opacity-50"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  Export CSV alertes
                </button>
                <Link
                  href="/admin/evaluation/v2/sources"
                  className="rounded-lg px-3 py-2 text-xs font-medium border"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  Ouvrir le pilotage des données manquantes
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {checklistItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border px-3 py-2"
                  style={{ borderColor: item.ok ? "#16a34a" : "#f59e0b", backgroundColor: "var(--color-surface)" }}
                >
                  <p className="text-xs font-semibold">{item.ok ? "OK" : "A verifier"} - {item.label}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            {preValidation.entries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preValidation.entries.map((item) => (
                  <span
                    key={item.code}
                    className="text-[11px] px-2 py-1 rounded-full border"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {alertLabel(item.code)}: {item.count}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-xs font-semibold">Validation lot mensuel (trace admin)</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Etape:{" "}
                {data?.validation?.validationStage === "staff_validated"
                  ? "Validation staff"
                  : data?.validation?.validationStage === "data_prevalidated"
                    ? "Pre-validation data"
                    : "Non valide"}
              </p>
              {data?.validation?.dataPrevalidatedAt && (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Pre-valide data par {data.validation.dataPrevalidatedByUsername || data.validation.dataPrevalidatedBy || "admin"} le{" "}
                  {new Date(data.validation.dataPrevalidatedAt).toLocaleString("fr-FR")}
                </p>
              )}
              {data?.validation?.staffValidatedAt && (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Valide staff par {data.validation.staffValidatedByUsername || data.validation.staffValidatedBy || "admin"} le{" "}
                  {new Date(data.validation.staffValidatedAt).toLocaleString("fr-FR")}
                </p>
              )}
              <p className="text-xs" style={{ color: data?.validation?.frozen ? "#fca5a5" : "var(--color-text-secondary)" }}>
                Statut gel: {data?.validation?.frozen ? "Mois gele (modifications verrouillees)" : "Non gele"}
              </p>

              <textarea
                value={validationNote}
                onChange={(e) => setValidationNote(e.target.value)}
                placeholder="Note de validation (contexte, decisions, points a suivre)"
                className="w-full rounded-lg px-3 py-2 border text-sm min-h-[80px]"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => saveMonthlyValidationAction("set_data_prevalidated")}
                  disabled={savingValidation || !((checklist ? checklist.readyToValidate : preValidation.ready) || preValidation.ready)}
                  className="rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#2563eb", color: "white" }}
                >
                  {savingValidation ? "Enregistrement..." : "Marquer pre-valide data"}
                </button>
                <button
                  onClick={() => saveMonthlyValidationAction("set_staff_validated")}
                  disabled={savingValidation || !(checklist ? checklist.readyToValidate : preValidation.ready)}
                  className="rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#16a34a", color: "white" }}
                >
                  {savingValidation ? "Enregistrement..." : "Marquer valide staff"}
                </button>
                <button
                  onClick={() => saveMonthlyValidationAction("set_frozen")}
                  disabled={savingValidation || data?.validation?.validationStage !== "staff_validated" || data?.validation?.frozen === true}
                  className="rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#dc2626", color: "white" }}
                >
                  Geler le mois
                </button>
                <button
                  onClick={() => saveMonthlyValidationAction("unset_frozen")}
                  disabled={savingValidation || !data?.validation?.frozen}
                  className="rounded-lg px-3 py-2 text-xs font-medium border disabled:opacity-50"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  Degeler
                </button>
                <button
                  onClick={() => saveMonthlyValidationAction("clear_validation")}
                  disabled={savingValidation}
                  className="rounded-lg px-3 py-2 text-xs font-medium border disabled:opacity-50"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  Reinitialiser validation
                </button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-xs font-semibold">Historique recalcul (S3)</p>
              {data?.runs?.latest ? (
                <>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Dernier run: {new Date(data.runs.latest.runAt).toLocaleString("fr-FR")} par{" "}
                    {data.runs.latest.triggeredByUsername || data.runs.latest.triggeredBy || "system"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Lignes modifiees: {data.runs.latest.summary.changedRows} · nouvelles: {data.runs.latest.summary.newRows} · retirees:{" "}
                    {data.runs.latest.summary.removedRows}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Delta final moyen: {data.runs.latest.summary.avgFinalDelta.toFixed(2)} · max:{" "}
                    {data.runs.latest.summary.maxFinalDelta.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Aucun changement detecte sur la synthese depuis le dernier chargement.
                </p>
              )}
              <Link
                href={`/api/evaluations/v2/runs?month=${selectedMonth}&system=${selectedSystem}&limit=20`}
                className="inline-flex mt-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                target="_blank"
              >
                Ouvrir les runs JSON
              </Link>
            </div>
          </div>

          {activeTab === "total" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
                {statCard("Membres affichés", String(summary.total), `Actifs: ${summary.activeCount}`)}
                {statCard("Moyenne /25", summary.avgFinal.toFixed(2))}
                {statCard(`Moy. ${labels.b1}`, summary.avgB1.toFixed(2))}
                {statCard(`Moy. ${labels.b2}`, summary.avgB2.toFixed(2))}
                {statCard(`Moy. ${labels.b3}`, summary.avgB3.toFixed(2))}
                {statCard(`Moy. ${labels.b4}`, summary.avgB4.toFixed(2))}
                {statCard("Nouveaux", String(summary.newcomersCount))}
                {statCard("Alertes", String(summary.alertsCount), `Communauté: ${summary.communityCount}`)}
                {statCard("Confiance faible", String(lowConfidenceSummary.low), `<50%: ${lowConfidenceSummary.veryLow}`)}
              </div>

              <div className="rounded-lg border overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderBottomColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                      <th className="px-3 py-2 text-left">Membre</th>
                      <th className="px-3 py-2 text-center">{labels.b1}</th>
                      <th className="px-3 py-2 text-center">{labels.b2}</th>
                      <th className="px-3 py-2 text-center">{labels.b3}</th>
                      <th className="px-3 py-2 text-center">{labels.b4}</th>
                      <th className="px-3 py-2 text-center">Bonus</th>
                      <th className="px-3 py-2 text-center">Total /20</th>
                      <th className="px-3 py-2 text-center">Final /25</th>
                      <th className="px-3 py-2 text-center">Confiance</th>
                      <th className="px-3 py-2 text-left">Alertes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.twitchLogin}
                        className="border-b"
                        style={{
                          borderBottomColor: "var(--color-border)",
                          backgroundColor:
                            (row.details.sourceConfidence?.global || 100) < 50
                              ? "rgba(239,68,68,0.06)"
                              : (row.details.sourceConfidence?.global || 100) < 70
                                ? "rgba(245,158,11,0.06)"
                                : undefined,
                        }}
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.displayName}</div>
                          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {row.twitchLogin} · {row.role} · {row.isActive ? "Actif" : "Inactif"}
                          </div>
                          {row.details.sourceConfidence && row.details.sourceConfidence.global < 70 && (
                            <div className="mt-1">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full border"
                                style={{
                                  borderColor: confidenceTone(row.details.sourceConfidence.global).borderColor,
                                  color: confidenceTone(row.details.sourceConfidence.global).color,
                                  backgroundColor: confidenceTone(row.details.sourceConfidence.global).backgroundColor,
                                }}
                              >
                                Confiance {row.details.sourceConfidence.global.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">{row.blocs.bloc1VisibleSupport.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{row.blocs.bloc2Discord.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{row.blocs.bloc3Regularite.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{row.blocs.bloc4ImplicationGlobale.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{row.details.bonus.capped.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{row.totals.totalWithoutBonus.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center font-semibold">{row.totals.totalWithBonus.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          {row.details.sourceConfidence ? (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full border"
                              style={{
                                borderColor: confidenceTone(row.details.sourceConfidence.global).borderColor,
                                color: confidenceTone(row.details.sourceConfidence.global).color,
                                backgroundColor: confidenceTone(row.details.sourceConfidence.global).backgroundColor,
                              }}
                            >
                              {row.details.sourceConfidence.global.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {(row.alerts || []).length === 0 ? (
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              Aucune
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(row.alerts || []).map((alert) => (
                                <span
                                  key={alert}
                                  className="text-[10px] px-2 py-0.5 rounded-full border"
                                  style={{ borderColor: "#f59e0b", color: "#fcd34d", backgroundColor: "rgba(245,158,11,0.12)" }}
                                >
                                  {alert}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "b1" && (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="px-3 py-2 text-left">Membre</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Raids utiles /2" : "Raids /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Spotlight /2" : "Spotlight /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Events /1" : "Events /5"}</th>
                    <th className="px-3 py-2 text-center">{labels.b1} final /5</th>
                    <th className="px-3 py-2 text-center">Volumétrie</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`b1-${row.twitchLogin}`} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                      <td className="px-3 py-2">{row.displayName}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc1.raids.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc1.spotlight.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc1.events.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-semibold">{row.blocs.bloc1VisibleSupport.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {row.details.bloc1.raidsDone} raids • {row.details.bloc1.spotlightPresences}/{row.details.bloc1.spotlightTotal} spotlight •{" "}
                        {row.details.bloc1.regularEventPresences}/{row.details.bloc1.regularEventsTotal} events
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "b2" && (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="px-3 py-2 text-left">Membre</th>
                    <th className="px-3 py-2 text-center">Écrit /5</th>
                    <th className="px-3 py-2 text-center">Vocal /5</th>
                    <th className="px-3 py-2 text-center">Participation utile /5</th>
                    <th className="px-3 py-2 text-center">Engagement Discord final /5</th>
                    <th className="px-3 py-2 text-center">Volume brut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`b2-${row.twitchLogin}`} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                      <td className="px-3 py-2">{row.displayName}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc2.noteEcrit.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc2.noteVocal.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc2.participationUtile.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-semibold">{row.blocs.bloc2Discord.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {row.details.bloc2.nbMessages} msg • {row.details.bloc2.nbVocalMinutes} min vocal
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "b3" && (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="px-3 py-2 text-left">Membre</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Soutien follow /5" : "Follow /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Participation réseau /5" : "Semaines /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Entraide globale /5" : "Diversité /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Signaux réseau" : "Signaux"}</th>
                    <th className="px-3 py-2 text-center">{labels.b3} final /5</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`b3-${row.twitchLogin}`} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                      <td className="px-3 py-2">{row.displayName}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc3.followScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc3.networkParticipationScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc3.entraideScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc3.networkSignalCount}</td>
                      <td className="px-3 py-2 text-center font-semibold">{row.blocs.bloc3Regularite.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "b4" && (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="px-3 py-2 text-left">Membre</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Régularité /5" : "Synthèse /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Obligations /5" : "Fiabilité /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Comportement /5" : "Comportement /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Réactivité /5" : "Réactivité /5"}</th>
                    <th className="px-3 py-2 text-center">{selectedSystem === "new" ? "Absence d'abus /5" : "Absence d'abus /5"}</th>
                    <th className="px-3 py-2 text-center">Cas staff /5</th>
                    <th className="px-3 py-2 text-center">{labels.b4} finale /5</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`b4-${row.twitchLogin}`} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                      <td className="px-3 py-2">{row.displayName}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc4.regularityScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc4.obligationsScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc4.behaviorScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{row.details.bloc4.responsivenessScore.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{(5 - row.details.bloc4.abusePenaltyScore).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        {row.details.bloc4.staffCaseScore !== undefined ? row.details.bloc4.staffCaseScore.toFixed(2) : "-"}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">{row.blocs.bloc4ImplicationGlobale.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "bonus" && (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="px-3 py-2 text-left">Membre</th>
                    <th className="px-3 py-2 text-center">Bonus brut</th>
                    <th className="px-3 py-2 text-center">Bonus capé /5</th>
                    <th className="px-3 py-2 text-center">Override manuel</th>
                    <th className="px-3 py-2 text-left">Raison override</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`bonus-${row.twitchLogin}`} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                      <td className="px-3 py-2">{row.displayName}</td>
                      <td className="px-3 py-2 text-center">{row.details.bonus.raw.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-semibold">{row.details.bonus.capped.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        {row.details.manualOverride?.bonus !== undefined ? row.details.manualOverride.bonus.toFixed(2) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {row.details.manualOverride?.reason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

