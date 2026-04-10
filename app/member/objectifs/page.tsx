"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Flag, ShieldCheck } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

function isSpotlightCategory(category?: string): boolean {
  return String(category || "").toLowerCase().includes("spotlight");
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function objectiveMessage(current: number, target: number): string {
  const remaining = Math.max(0, target - current);
  const progress = progressPercent(current, target);
  if (remaining <= 0) return "Objectif validé, excellent travail.";
  if (remaining === 1) return "Plus qu'une action pour valider cet objectif.";
  if (progress >= 75) return "Tu es proche du palier, continue comme ça.";
  if (progress >= 40) return "Bonne dynamique, garde le rythme.";
  return "Priorité du mois : lance cet objectif dès maintenant.";
}

function globalObjectiveMessage(score: number): string {
  if (score >= 100) return "Tous tes objectifs de ce mois sont atteints. Bravo.";
  if (score >= 80) return "Dernière ligne droite : tu peux valider ce mois rapidement.";
  if (score >= 50) return "Très belle progression. Encore un effort pour finaliser le mois.";
  return "Le mois est en cours : une action aujourd'hui peut tout lancer.";
}

type GoalKey = "events" | "spotlight" | "raids" | "formations";
type GoalValidationMap = Record<string, Partial<Record<GoalKey, string>>>;
const GOALS_VALIDATION_STORAGE_KEY = "member-monthly-goals-validation-v1";

function readGoalValidationMap(): GoalValidationMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GOALS_VALIDATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GoalValidationMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeGoalValidationMap(map: GoalValidationMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOALS_VALIDATION_STORAGE_KEY, JSON.stringify(map));
}

export default function MemberGoalsPage() {
  const { data, loading } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const [validatedGoals, setValidatedGoals] = useState<Partial<Record<GoalKey, string>>>({});
  const months = useMemo(() => getLast12Months(), []);

  useEffect(() => {
    if (data?.monthKey) setSelectedMonth(data.monthKey);
  }, [data?.monthKey]);

  const { goals, updateGoals, resetGoals } = useMemberMonthlyGoals(selectedMonth);

  useEffect(() => {
    if (!selectedMonth) return;
    const map = readGoalValidationMap();
    setValidatedGoals(map[selectedMonth] || {});
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth || !data?.member?.twitchLogin) return;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: any) => String(raid.raiderTwitchLogin || "").toLowerCase() === data.member.twitchLogin.toLowerCase()
        );
        const total = mine.reduce((sum: number, raid: any) => sum + (raid.count || 1), 0);
        setRaidsForMonth(total);
      } catch {
        setRaidsForMonth(0);
      }
    })();
  }, [selectedMonth, data?.member?.twitchLogin]);

  if (loading || !data) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des objectifs...</p>;

  const selectedAttendance = data.attendance?.monthlyHistory.find((entry) => entry.monthKey === selectedMonth) || null;
  const eventsCurrent = selectedAttendance?.attendedEvents || 0;

  const selectedMonthEvents =
    data.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedMonth)?.events || [];
  const spotlightCurrent = selectedMonthEvents.filter((event) => isSpotlightCategory(event.category) && event.attended).length;

  const formationsFromAttendance = (data.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedMonth)?.events || []).filter(
    (event) => event.attended && String(event.category || "").toLowerCase().includes("formation")
  ).length;
  const formationsFallback =
    data.stats.formationsValidatedThisMonth ?? data.formationHistory.filter((item) => item.date.slice(0, 7) === data.monthKey).length;
  const formationsCurrent = formationsFromAttendance > 0 ? formationsFromAttendance : formationsFallback;
  const eventsProgress = progressPercent(eventsCurrent, goals.events);
  const spotlightProgress = progressPercent(spotlightCurrent, goals.spotlight);
  const raidsProgress = progressPercent(raidsForMonth, goals.raids);
  const formationsProgress = progressPercent(formationsCurrent, goals.formations);
  const globalScore = Math.round((eventsProgress + spotlightProgress + raidsProgress + formationsProgress) / 4);
  const globalMessage = globalObjectiveMessage(globalScore);
  const objectives = [
    { key: "events" as const, label: "Présence événements (général)", current: eventsCurrent, target: goals.events, progress: eventsProgress },
    { key: "spotlight" as const, label: "Présence spotlight", current: spotlightCurrent, target: goals.spotlight, progress: spotlightProgress },
    { key: "raids" as const, label: "Raids TENF", current: raidsForMonth, target: goals.raids, progress: raidsProgress },
    { key: "formations" as const, label: "Formations à valider", current: formationsCurrent, target: goals.formations, progress: formationsProgress },
  ];
  const validatedCount = objectives.filter((objective) => Boolean(validatedGoals[objective.key])).length;
  const validationProgress = Math.round((validatedCount / objectives.length) * 100);

  const handleValidateObjective = (goalKey: GoalKey) => {
    if (!selectedMonth) return;
    const map = readGoalValidationMap();
    const monthState = map[selectedMonth] || {};
    monthState[goalKey] = new Date().toISOString();
    map[selectedMonth] = monthState;
    writeGoalValidationMap(map);
    setValidatedGoals({ ...monthState });
  };

  const clearMonthValidations = () => {
    if (!selectedMonth) return;
    const map = readGoalValidationMap();
    map[selectedMonth] = {};
    writeGoalValidationMap(map);
    setValidatedGoals({});
  };

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Objectifs du mois"
        description="Définis tes objectifs mensuels depuis un seul espace : présences, spotlight, raids TENF et formations."
        badge="Objectifs personnalisés"
      />

      <section className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              <Flag size={14} style={{ color: "var(--color-primary)" }} />
              Repères d'engagement
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Consulte ton score d'engagement et son détail pour ajuster tes objectifs du mois.
            </p>
          </div>
          <Link
            href="/member/engagement/score"
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:opacity-85"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            Ouvrir mon score d'engagement
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </section>

      <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Mois à paramétrer
            </label>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm md:w-64"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              {months
                .slice()
                .reverse()
                .map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            onClick={resetGoals}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: "rgba(255,255,255,0.18)", color: "var(--color-text-secondary)" }}
          >
            Réinitialiser les objectifs de ce mois
          </button>
        </div>

        <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Progression globale : {globalScore}%
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {globalMessage}
          </p>
          <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${globalScore}%`,
                background:
                  "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(56,189,248,0.95))",
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <span>
              Validation des objectifs: {validatedCount}/{objectives.length}
            </span>
            <button
              type="button"
              onClick={clearMonthValidations}
              className="rounded-full border px-2.5 py-1 hover:opacity-85"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}
            >
              Réinitialiser validations
            </button>
          </div>
          <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${validationProgress}%`,
                background:
                  "linear-gradient(90deg, rgba(16,185,129,0.95), rgba(59,130,246,0.95))",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {objectives.map((objective) => {
            const isCompleted = objective.current >= objective.target;
            const validatedAt = validatedGoals[objective.key];
            const goalMaxByKey: Record<GoalKey, number> = {
              events: 30,
              spotlight: 20,
              raids: 40,
              formations: 20,
            };
            return (
              <div key={objective.key} className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {objective.label}
                  </span>
                  {validatedAt ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      style={{ borderColor: "rgba(16,185,129,0.35)", color: "#9ae6b4", backgroundColor: "rgba(16,185,129,0.12)" }}
                    >
                      <ShieldCheck size={12} />
                      Validé
                    </span>
                  ) : null}
                </div>
                <input
                  type="number"
                  min={objective.key === "spotlight" ? 0 : 1}
                  max={goalMaxByKey[objective.key]}
                  value={goals[objective.key]}
                  onChange={(event) => updateGoals({ [objective.key]: Number(event.target.value) })}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
                <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${objective.progress}%`,
                      background: isCompleted
                        ? "linear-gradient(90deg, rgba(16,185,129,0.95), rgba(6,182,212,0.95))"
                        : "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(59,130,246,0.95))",
                    }}
                  />
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {objective.current}/{objective.target} · {objectiveMessage(objective.current, objective.target)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                    {validatedAt ? `Validé le ${new Date(validatedAt).toLocaleDateString("fr-FR")}` : "Non validé"}
                  </span>
                  <button
                    type="button"
                    disabled={!isCompleted || Boolean(validatedAt)}
                    onClick={() => handleValidateObjective(objective.key)}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-45"
                    style={{
                      borderColor: isCompleted ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.2)",
                      color: isCompleted ? "#b7f5cd" : "var(--color-text-secondary)",
                      backgroundColor: isCompleted ? "rgba(16,185,129,0.12)" : "transparent",
                    }}
                  >
                    <CheckCircle2 size={12} />
                    Valider objectif
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </MemberSurface>
  );
}
