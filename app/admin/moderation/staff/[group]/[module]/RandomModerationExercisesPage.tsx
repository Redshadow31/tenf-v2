"use client";

import { useEffect, useMemo, useState } from "react";

type Difficulty = "facile" | "moyen" | "difficile";

type ScenarioTemplate = {
  id: string;
  title: string;
  theme: string;
  difficulty: Difficulty;
  context: string;
  questions?: Array<{
    id: string;
    prompt: string;
    choices: Array<{ id: string; label: string }>;
    correctOptionIds: string[];
  }>;
  objectives?: string[];
  expected: string;
};

type StaffMember = {
  discordId: string;
  displayName: string;
  discordUsername: string;
  role: string;
};

type Campaign = {
  month: string;
  status: "draft" | "locked";
  exercises: ScenarioTemplate[];
  assignments: Array<{
    assigneeId: string;
    assigneeLabel: string;
    exerciseId: string;
    status: "pending";
  }>;
  settings: {
    count: number;
    difficulties: Difficulty[];
  };
  lockedAt?: string;
};

export default function RandomModerationExercisesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [count, setCount] = useState(5);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [history, setHistory] = useState<
    Array<{ month: string; status: "draft" | "locked"; exercises: number; assignments: number; updatedAt: string }>
  >([]);
  const [templateCount, setTemplateCount] = useState(24);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStaff() {
    try {
      const response = await fetch("/api/admin/staff", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger la liste staff.");
      }
      const nextStaff = Array.isArray(payload?.staff) ? payload.staff : [];
      setStaff(nextStaff);
      setSelectedStaffIds((prev) => (prev.length ? prev : nextStaff.map((item: StaffMember) => item.discordId)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur réseau staff.");
    }
  }

  async function loadCampaign(targetMonth: string) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/moderation/staff/monthly-exercises?month=${encodeURIComponent(targetMonth)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger la campagne.");
      }
      setCampaign(payload?.campaign || null);
      setHistory(Array.isArray(payload?.campaigns) ? payload.campaigns : []);
      if (typeof payload?.templateCount === "number" && payload.templateCount > 0) {
        setTemplateCount(payload.templateCount);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, []);

  useEffect(() => {
    void loadCampaign(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const selectedAssignees = useMemo(
    () =>
      staff
        .filter((member) => selectedStaffIds.includes(member.discordId))
        .map((member) => ({
          id: member.discordId,
          label: member.displayName || member.discordUsername || member.discordId,
        })),
    [staff, selectedStaffIds],
  );

  async function createOrRegenerateCampaign() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/moderation/staff/monthly-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          count,
          difficulties: ["facile", "moyen", "difficile"],
          assignees: selectedAssignees,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Génération impossible.");
      }
      setCampaign(payload?.campaign || null);
      setMessage("Campagne mensuelle générée et sauvegardée.");
      await loadCampaign(month);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function lockCampaign() {
    if (!campaign) return;
    if (!window.confirm(`Verrouiller la campagne ${campaign.month} ?`)) return;
    setLocking(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/moderation/staff/monthly-exercises", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, action: "lock" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Verrouillage impossible.");
      }
      setCampaign(payload?.campaign || null);
      setMessage("Campagne verrouillée. Les exercices de ce mois sont figés.");
      await loadCampaign(month);
    } catch (lockError) {
      setError(lockError instanceof Error ? lockError.message : "Erreur réseau.");
    } finally {
      setLocking(false);
    }
  }

  const totalByDifficulty = useMemo(
    () =>
      (campaign?.exercises || []).reduce(
        (acc, item) => ({ ...acc, [item.difficulty]: acc[item.difficulty] + 1 }),
        { facile: 0, moyen: 0, difficile: 0 } as Record<Difficulty, number>,
      ),
    [campaign],
  );

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[linear-gradient(145deg,rgba(67,56,202,0.16),rgba(12,15,24,0.94)_48%,rgba(16,185,129,0.12))] p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-indigo-200">
          Admin / Modération staff / Petits travaux
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Exercices mensuels aléatoires</h1>
        <p className="mt-2 text-sm text-slate-300">
          Génère une campagne mensuelle équilibrée (faits, neutralité, escalade) à partir d'un
          catalogue de scénarios.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-700 bg-[#101523]/85 p-4 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-slate-400">Mois</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-[#0f1422] px-3 py-2 text-slate-100"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-slate-400">Nombre d'exercices</span>
          <input
            type="number"
            min={5}
            max={templateCount}
            value={count}
            onChange={(event) =>
              setCount(Math.min(templateCount, Math.max(5, Number(event.target.value) || 5)))
            }
            className="w-full rounded-lg border border-slate-600 bg-[#0f1422] px-3 py-2 text-slate-100"
          />
        </label>

        <div className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-slate-400">Règle de génération</span>
          <div className="rounded-lg border border-slate-600 bg-[#0f1422] p-2 text-xs text-slate-200">
            Minimum 5 exercices avec au moins 1 facile, 1 moyen et 1 difficile. Le reste est aléatoire.
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void createOrRegenerateCampaign()}
            disabled={saving || campaign?.status === "locked"}
            className="w-full rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {campaign ? "Regénérer la campagne" : "Créer la campagne"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.1em] text-slate-400">Assignation modérateurs</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {staff.map((member) => (
            <label key={member.discordId} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0f1422] px-3 py-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={selectedStaffIds.includes(member.discordId)}
                disabled={campaign?.status === "locked"}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setSelectedStaffIds((prev) =>
                    checked ? [...new Set([...prev, member.discordId])] : prev.filter((id) => id !== member.discordId),
                  );
                }}
              />
              <span>
                {member.displayName}
                <span className="ml-1 text-xs text-slate-400">({member.role})</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {message ? (
        <section className="rounded-xl border border-emerald-300/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100">
          {message}
        </section>
      ) : null}
      {error ? (
        <section className="rounded-xl border border-rose-300/35 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Scénarios disponibles</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{templateCount}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Facile</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-200">{totalByDifficulty.facile}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Moyen</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">{totalByDifficulty.moyen}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Difficile</p>
          <p className="mt-2 text-2xl font-semibold text-rose-200">{totalByDifficulty.difficile}</p>
        </article>
      </section>

      {campaign ? (
        <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Statut campagne</p>
              <p className="mt-1 text-sm text-slate-100">
                {campaign.status === "locked" ? "Verrouillée" : "Brouillon"} • {campaign.month}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void lockCampaign()}
              disabled={campaign.status === "locked" || locking}
              className="rounded-lg border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {campaign.status === "locked" ? "Campagne verrouillée" : "Verrouiller ce mois"}
            </button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4 text-sm text-slate-300">
          Chargement de la campagne...
        </section>
      ) : null}

      {!campaign ? (
        <section className="rounded-2xl border border-rose-300/30 bg-rose-950/20 p-4 text-sm text-rose-100">
          Aucune campagne enregistrée pour ce mois. Configure puis clique sur "Créer la campagne".
        </section>
      ) : (
        <section className="space-y-3">
          {campaign.exercises.map((exercise, index) => {
            const assignment = campaign.assignments.find((item) => item.exerciseId === exercise.id);
            return (
              <article key={exercise.id} className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
                      Exercice #{index + 1} • {exercise.theme}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-100">{exercise.title}</h2>
                  </div>
                  <span className="rounded-full border border-slate-600 bg-[#0f1422] px-3 py-1 text-xs capitalize text-slate-200">
                    {exercise.difficulty}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-300">{exercise.context}</p>
                {exercise.questions?.length ? (
                  <div className="mt-4 space-y-3">
                    {exercise.questions.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-lg border border-slate-700 bg-[#0d1320] p-3">
                        <p className="text-sm font-medium text-slate-100">
                          Q{questionIndex + 1}. {question.prompt}
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-300">
                          {question.choices.map((choice) => (
                            <li key={choice.id} className="rounded border border-slate-800 bg-[#0b1019] px-2 py-1">
                              <span className="mr-2 inline-block w-5 text-slate-400">
                                {choice.id.toUpperCase()}.
                              </span>
                              {choice.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : exercise.objectives?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
                    {exercise.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-100">
                  Attendu: {exercise.expected}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Assigné à: <span className="text-slate-200">{assignment?.assigneeLabel || "Non assigné"}</span>
                </p>
              </article>
            );
          })}
        </section>
      )}

      <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.1em] text-slate-400">Historique récent</p>
        <div className="space-y-2">
          {history.length ? (
            history.map((item) => (
              <button
                key={item.month}
                type="button"
                onClick={() => setMonth(item.month)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-[#0f1422] px-3 py-2 text-left text-sm text-slate-200 transition hover:border-slate-500"
              >
                <span>
                  {item.month} • {item.status === "locked" ? "Verrouillée" : "Brouillon"}
                </span>
                <span className="text-xs text-slate-400">
                  {item.exercises} exercices / {item.assignments} assignations
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-400">Aucune campagne enregistrée.</p>
          )}
        </div>
      </section>
    </div>
  );
}
