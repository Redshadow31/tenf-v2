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

type Assignment = {
  assigneeId: string;
  assigneeLabel: string;
  exerciseId: string;
  status: "pending" | "submitted";
  submittedAt?: string;
  answers?: Record<string, string[]>;
  notes?: string;
};

type Campaign = {
  month: string;
  status: "draft" | "locked";
  exercises: ScenarioTemplate[];
  assignments: Assignment[];
};

export default function StaffMonthlyExercisesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [viewerDiscordId, setViewerDiscordId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, Record<string, string[]>>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  async function loadCampaign(targetMonth: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/moderation/staff/monthly-exercises?month=${encodeURIComponent(targetMonth)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les exercices.");
      }
      const nextCampaign = (payload?.campaign || null) as Campaign | null;
      const me = typeof payload?.viewerDiscordId === "string" ? payload.viewerDiscordId : "";
      setViewerDiscordId(me);
      setCampaign(nextCampaign);

      if (nextCampaign && me) {
        const nextAnswers: Record<string, Record<string, string[]>> = {};
        const nextNotes: Record<string, string> = {};
        for (const assignment of nextCampaign.assignments) {
          if (assignment.assigneeId !== me) continue;
          if (assignment.answers) {
            nextAnswers[assignment.exerciseId] = assignment.answers;
          }
          if (assignment.notes) {
            nextNotes[assignment.exerciseId] = assignment.notes;
          }
        }
        setLocalAnswers(nextAnswers);
        setLocalNotes(nextNotes);
      } else {
        setLocalAnswers({});
        setLocalNotes({});
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCampaign(month);
  }, [month]);

  const myAssignments = useMemo(() => {
    if (!campaign || !viewerDiscordId) return [];
    return campaign.assignments.filter((assignment) => assignment.assigneeId === viewerDiscordId);
  }, [campaign, viewerDiscordId]);

  const myExercises = useMemo(() => {
    if (!campaign) return [];
    return campaign.exercises
      .map((exercise) => {
        const assignment = myAssignments.find((item) => item.exerciseId === exercise.id);
        if (!assignment) return null;
        return { exercise, assignment };
      })
      .filter((item): item is { exercise: ScenarioTemplate; assignment: Assignment } => item !== null);
  }, [campaign, myAssignments]);

  function updateAnswer(exerciseId: string, questionId: string, optionId: string, multi: boolean) {
    setLocalAnswers((prev) => {
      const exerciseAnswers = prev[exerciseId] || {};
      const previousSelected = exerciseAnswers[questionId] || [];
      let nextSelected: string[];
      if (multi) {
        nextSelected = previousSelected.includes(optionId)
          ? previousSelected.filter((id) => id !== optionId)
          : [...previousSelected, optionId];
      } else {
        nextSelected = [optionId];
      }
      return {
        ...prev,
        [exerciseId]: {
          ...exerciseAnswers,
          [questionId]: nextSelected,
        },
      };
    });
  }

  async function submitExercise(exerciseId: string) {
    setSavingId(exerciseId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/moderation/staff/monthly-exercises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          exerciseId,
          answers: localAnswers[exerciseId] || {},
          notes: localNotes[exerciseId] || "",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer la soumission.");
      }
      setCampaign(payload?.campaign || null);
      setMessage("Soumission enregistrée.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur réseau.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[linear-gradient(145deg,rgba(14,116,144,0.16),rgba(12,15,24,0.94)_48%,rgba(99,102,241,0.12))] p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Admin / Modération staff / Petits travaux</p>
        <h1 className="mt-2 text-2xl font-semibold">Mes exercices mensuels</h1>
        <p className="mt-2 text-sm text-slate-300">
          Cette page est personnelle: tu vois uniquement les exercices qui te sont assignés.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-slate-400">Mois</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full max-w-xs rounded-lg border border-slate-600 bg-[#0f1422] px-3 py-2 text-slate-100"
          />
        </label>
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

      {loading ? (
        <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4 text-sm text-slate-300">
          Chargement des exercices...
        </section>
      ) : null}

      {!loading && !campaign ? (
        <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4 text-sm text-slate-300">
          Aucune campagne trouvée pour ce mois.
        </section>
      ) : null}

      {!loading && campaign && myExercises.length === 0 ? (
        <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-4 text-sm text-slate-300">
          Aucun exercice ne t&apos;est assigné sur ce mois.
        </section>
      ) : null}

      <section className="space-y-4">
        {myExercises.map(({ exercise, assignment }, index) => {
          const exerciseAnswers = localAnswers[exercise.id] || {};
          const isSubmitted = assignment.status === "submitted";
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
                <div className="mt-4 space-y-4">
                  {exercise.questions.map((question, questionIndex) => {
                    const selected = exerciseAnswers[question.id] || [];
                    const multi = question.correctOptionIds.length > 1;
                    return (
                      <div key={question.id} className="rounded-lg border border-slate-700 bg-[#0d1320] p-3">
                        <p className="text-sm font-medium text-slate-100">
                          Q{questionIndex + 1}. {question.prompt}
                        </p>
                        <div className="mt-2 space-y-2">
                          {question.choices.map((choice) => {
                            const checked = selected.includes(choice.id);
                            return (
                              <label
                                key={choice.id}
                                className="flex items-center gap-2 rounded border border-slate-800 bg-[#0b1019] px-2 py-2 text-sm text-slate-200"
                              >
                                <input
                                  type={multi ? "checkbox" : "radio"}
                                  name={`${exercise.id}-${question.id}`}
                                  checked={checked}
                                  onChange={() => updateAnswer(exercise.id, question.id, choice.id, multi)}
                                />
                                <span>
                                  <span className="mr-1 text-slate-400">{choice.id.toUpperCase()}.</span>
                                  {choice.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-4">
                <label className="text-sm text-slate-200">
                  <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-slate-400">Notes (optionnel)</span>
                  <textarea
                    value={localNotes[exercise.id] || ""}
                    onChange={(event) =>
                      setLocalNotes((prev) => ({
                        ...prev,
                        [exercise.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-600 bg-[#0f1422] px-3 py-2 text-slate-100"
                    placeholder="Justification rapide, contexte, points d'attention..."
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Statut:{" "}
                  <span className={isSubmitted ? "text-emerald-200" : "text-amber-200"}>
                    {isSubmitted ? "Soumis" : "En attente"}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => void submitExercise(exercise.id)}
                  disabled={savingId === exercise.id}
                  className="rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingId === exercise.id ? "Envoi..." : isSubmitted ? "Mettre à jour ma soumission" : "Envoyer ma soumission"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

