"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import { MODERATION_BASE } from "@/lib/moderation/moderationTree";
import type {
  AdminReviewPayload,
  FinalReviewPayload,
  ObjectivePayload,
  StaffQuestionnaireFinalDecision,
} from "@/lib/staff-questionnaire/types";

const TABS = [
  "Réponses",
  "Analyse interne",
  "Synthèse modérateur",
  "Objectifs",
  "Bilan final",
] as const;

type Tab = (typeof TABS)[number];

const ANALYSIS_FIELDS: { key: keyof AdminReviewPayload; label: string }[] = [
  { key: "behavioralProfile", label: "Profil comportemental" },
  { key: "functioningMode", label: "Mode de fonctionnement" },
  { key: "supportNeeds", label: "Besoins d'accompagnement" },
  { key: "vigilancePoints", label: "Points de vigilance" },
  { key: "communicationStyle", label: "Style de communication" },
  { key: "autonomyLevel", label: "Capacité d'autonomie" },
  { key: "conflictRelation", label: "Rapport au conflit" },
  { key: "authorityRelation", label: "Rapport à l'autorité" },
  { key: "emotionalManagement", label: "Gestion émotionnelle" },
  { key: "recommendedMissions", label: "Missions adaptées à court terme" },
];

export default function StaffQuestionnaireAdminDetailClient({
  submissionId,
}: {
  submissionId: string;
}) {
  const [tab, setTab] = useState<Tab>("Réponses");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [review, setReview] = useState<AdminReviewPayload>({});
  const [objectives, setObjectives] = useState<ObjectivePayload[]>([]);
  const [finalReview, setFinalReview] = useState<FinalReviewPayload>({
    finalReviewText: "",
    decision: "OBSERVATION",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation/staff-questionnaires/${submissionId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Chargement impossible");
      setData(json);
      const r = json.review;
      if (r) {
        setReview({
          internalAnalysisText: r.internal_analysis_text,
          memberSummaryText: r.member_summary_text,
          behavioralProfile: r.behavioral_profile,
          functioningMode: r.functioning_mode,
          supportNeeds: r.support_needs,
          vigilancePoints: r.vigilance_points,
          communicationStyle: r.communication_style,
          autonomyLevel: r.autonomy_level,
          conflictRelation: r.conflict_relation,
          authorityRelation: r.authority_relation,
          emotionalManagement: r.emotional_management,
          recommendedMissions: r.recommended_missions,
          adminNotes: r.admin_notes,
        });
      }
      setObjectives(
        (json.objectives ?? []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          title: o.title as string,
          description: (o.description as string) ?? "",
          monthIndex: (o.month_index as number) ?? null,
          status: (o.status as ObjectivePayload["status"]) ?? "TODO",
        })),
      );
      if (json.finalReview) {
        setFinalReview({
          finalReviewText: json.finalReview.final_review_text,
          decision: json.finalReview.decision as StaffQuestionnaireFinalDecision,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const member = data?.member as Record<string, unknown> | undefined;
  const submission = data?.submission as Record<string, unknown> | undefined;
  const answers = (data?.answers ?? []) as Array<Record<string, unknown>>;
  const progress = data?.progress as
    | { completed: number; total: number; percent: number }
    | undefined;
  const answeredCount = answers.filter((a) => a.answered).length;

  async function generateAnalysisDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/moderation/staff-questionnaires/${submissionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-analysis-draft" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Échec");
      setReview((prev) => ({ ...prev, ...json.draft }));
      setMessage("Base d'analyse générée — à relire avant enregistrement.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function saveAnalysis() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/moderation/staff-questionnaires/${submissionId}/analysis`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(review),
        },
      );
      if (!res.ok) throw new Error((await res.json())?.error || "Échec");
      setMessage("Analyse interne enregistrée.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function saveSummary(generateDraft?: boolean) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/moderation/staff-questionnaires/${submissionId}/member-summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            generateDraft
              ? { action: "generate-draft" }
              : { memberSummaryText: review.memberSummaryText },
          ),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Échec");
      if (json.memberSummaryText) {
        setReview((r) => ({ ...r, memberSummaryText: json.memberSummaryText }));
      }
      setMessage(generateDraft ? "Brouillon de synthèse généré." : "Synthèse enregistrée.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function publishSummary() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/moderation/staff-questionnaires/${submissionId}/publish-summary`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error((await res.json())?.error || "Échec");
      setMessage("Synthèse publiée au modérateur.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function saveObjectives() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/moderation/staff-questionnaires/${submissionId}/objectives`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objectives }),
        },
      );
      if (!res.ok) throw new Error((await res.json())?.error || "Échec");
      setMessage("Objectifs enregistrés.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function saveFinalReview() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/moderation/staff-questionnaires/${submissionId}/final-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalReview),
        },
      );
      if (!res.ok) throw new Error((await res.json())?.error || "Échec");
      setMessage("Bilan final enregistré.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModerationPageShell
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Modération", href: MODERATION_BASE },
        {
          label: "Questionnaires",
          href: "/admin/moderation/staff/questionnaires",
        },
        { label: String(member?.discord_username ?? member?.display_name ?? submissionId) },
      ]}
      title={`Questionnaire — ${String(member?.discord_username ?? member?.display_name ?? "")}`}
      description={`Statut : ${String(submission?.status ?? "")}`}
      audienceLabel="Vue admin"
    >
      {loading ? (
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : (
        <div className="space-y-4">
          {error ? <p className="text-rose-300 text-sm">{error}</p> : null}
          {message ? <p className="text-emerald-300 text-sm">{message}</p> : null}

          {progress ? (
            <div
              className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-white">Progression du questionnaire</span>
                <span className="text-zinc-400">
                  {progress.completed} / {progress.total} questions complétées ({progress.percent}
                  %)
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {submission?.updatedAt ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Dernière sauvegarde :{" "}
                  {new Date(String(submission.updatedAt)).toLocaleString("fr-FR")}
                </p>
              ) : null}
              {answeredCount < progress.total ? (
                <p className="mt-1 text-xs text-amber-200/80">
                  {progress.total - answeredCount} question(s) sans réponse enregistrée — le
                  modérateur peut encore compléter son parcours.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-semibold " +
                  (tab === t
                    ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40"
                    : "text-zinc-400 hover:text-white")
                }
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Réponses" && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {answers.map((a) => {
                const hasAnswer = Boolean(a.answered);
                return (
                  <div
                    key={String(a.questionKey)}
                    className={
                      "rounded-lg border p-3 " +
                      (hasAnswer
                        ? "border-white/10 bg-black/20"
                        : "border-dashed border-white/5 bg-black/10 opacity-60")
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-violet-300/80">{String(a.sectionTitle)}</p>
                      <span
                        className={
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium " +
                          (hasAnswer
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-700/50 text-zinc-500")
                        }
                      >
                        {hasAnswer ? "Répondu" : "En attente"}
                      </span>
                    </div>
                    <p className="font-semibold text-white text-sm mt-1">{String(a.label)}</p>
                    {a.answerText ? (
                      <p className="mt-2 text-sm text-zinc-300 whitespace-pre-line">
                        {String(a.answerText)}
                      </p>
                    ) : null}
                    {a.answerJson ? (
                      <pre className="mt-2 text-xs text-zinc-500 overflow-x-auto">
                        {JSON.stringify(a.answerJson, null, 2)}
                      </pre>
                    ) : null}
                    {!hasAnswer ? (
                      <p className="mt-2 text-xs text-zinc-600 italic">Pas encore de réponse</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Analyse interne" && (
            <div className="space-y-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => void generateAnalysisDraft()}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-sm font-semibold text-violet-100"
              >
                <Sparkles className="h-4 w-4" />
                Générer une base d&apos;analyse
              </button>
              <textarea
                rows={12}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Analyse interne complète (markdown)"
                value={review.internalAnalysisText ?? ""}
                onChange={(e) =>
                  setReview((r) => ({ ...r, internalAnalysisText: e.target.value }))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {ANALYSIS_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-zinc-500">{label}</label>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
                      value={(review[key] as string) ?? ""}
                      onChange={(e) =>
                        setReview((r) => ({ ...r, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Notes internes"
                value={review.adminNotes ?? ""}
                onChange={(e) => setReview((r) => ({ ...r, adminNotes: e.target.value }))}
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAnalysis()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Enregistrer analyse interne
              </button>
            </div>
          )}

          {tab === "Synthèse modérateur" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Formulation bienveillante — validée avant publication au modérateur.
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveSummary(true)}
                className="text-sm text-violet-300 hover:text-violet-200"
              >
                Générer un brouillon de synthèse
              </button>
              <textarea
                rows={14}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={review.memberSummaryText ?? ""}
                onChange={(e) =>
                  setReview((r) => ({ ...r, memberSummaryText: e.target.value }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSummary(false)}
                  className="rounded-lg border border-violet-400/40 px-4 py-2 text-sm font-semibold text-violet-100"
                >
                  Enregistrer synthèse
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void publishSummary()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Publier au modérateur
                </button>
              </div>
            </div>
          )}

          {tab === "Objectifs" && (
            <div className="space-y-4">
              {objectives.map((o, i) => (
                <div key={o.id ?? i} className="rounded-lg border border-white/10 p-3 space-y-2">
                  <input
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white text-sm"
                    placeholder="Titre"
                    value={o.title}
                    onChange={(e) => {
                      const next = [...objectives];
                      next[i] = { ...o, title: e.target.value };
                      setObjectives(next);
                    }}
                  />
                  <textarea
                    rows={2}
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white text-sm"
                    placeholder="Description"
                    value={o.description ?? ""}
                    onChange={(e) => {
                      const next = [...objectives];
                      next[i] = { ...o, description: e.target.value };
                      setObjectives(next);
                    }}
                  />
                  <input
                    type="number"
                    min={1}
                    max={3}
                    className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-white text-sm"
                    placeholder="Mois"
                    value={o.monthIndex ?? ""}
                    onChange={(e) => {
                      const next = [...objectives];
                      next[i] = {
                        ...o,
                        monthIndex: e.target.value ? Number(e.target.value) : null,
                      };
                      setObjectives(next);
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setObjectives((prev) => [...prev, { title: "", description: "", monthIndex: 1 }])
                }
                className="text-sm text-violet-300"
              >
                + Ajouter un objectif
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveObjectives()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Définir les objectifs (3 mois)
              </button>
            </div>
          )}

          {tab === "Bilan final" && (
            <div className="space-y-4">
              <select
                value={finalReview.decision}
                onChange={(e) =>
                  setFinalReview((f) => ({
                    ...f,
                    decision: e.target.value as StaffQuestionnaireFinalDecision,
                  }))
                }
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white text-sm"
              >
                {[
                  "VALIDATED",
                  "EXTENDED_TRAINING",
                  "BINOME",
                  "OBSERVATION",
                  "SUPPORT_TENF",
                  "PAUSE_RECOMMENDED",
                  "REFERENT_POTENTIAL",
                ].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <textarea
                rows={8}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={finalReview.finalReviewText}
                onChange={(e) =>
                  setFinalReview((f) => ({ ...f, finalReviewText: e.target.value }))
                }
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveFinalReview()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Clôturer bilan final
              </button>
            </div>
          )}
        </div>
      )}
    </ModerationPageShell>
  );
}
