"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Lock,
  PenLine,
  Save,
  Send,
  Shield,
  Target,
} from "lucide-react";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import QuestionField, {
  ConsentChoice,
  type AnswerState,
} from "@/components/admin/moderation/questionnaire/QuestionField";
import QuestionnaireStatusBadge from "@/components/admin/moderation/questionnaire/QuestionnaireStatusBadge";
import {
  qCardStyle,
  qSurfaceStyle,
  QUI,
} from "@/components/admin/moderation/questionnaire/questionnaire-ui";
import { computeQuestionnaireProgress, isQuestionAnswered } from "@/lib/staff-questionnaire/question-utils";
import {
  buildSectionsFromQuestions,
  getCurrentSectionIndex,
  getSectionStepStatuses,
} from "@/lib/staff-questionnaire/section-utils";
import type { ModeratorStatusView } from "@/lib/staff-questionnaire/status-labels";
import type { SubmissionConsents } from "@/lib/staff-questionnaire/types";
import { MODERATION_STAFF_BASE } from "@/lib/moderation/moderationTree";

type Question = {
  id: string;
  key: string;
  number: number;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  helpText: string | null;
  type: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
};

const INTRO_BLOCKS = [
  {
    icon: Target,
    title: "Objectif",
    body: "Comprendre ta posture staff, tes réflexes et tes besoins d'accompagnement.",
  },
  {
    icon: Shield,
    title: "Ce que ce n'est pas",
    body: "Ce questionnaire n'est pas un test médical, ni un jugement, ni une sanction.",
  },
  {
    icon: PenLine,
    title: "Comment répondre",
    body: "Réponds sincèrement, avec tes mots. Les réponses servent à mieux accompagner le staff.",
  },
  {
    icon: Lock,
    title: "Confidentialité / usage",
    body: "Les réponses sont utilisées dans un cadre interne TENF, pour l'accompagnement et la progression.",
  },
] as const;

const CONSENT_ITEMS = [
  {
    key: "understoodPurpose" as const,
    id: "consent-purpose",
    label:
      "J'ai compris que ce questionnaire sert à mieux m'accompagner et qu'il ne s'agit pas d'un test.",
  },
  {
    key: "sincereAnswers" as const,
    id: "consent-sincere",
    label: "Je m'engage à répondre sincèrement avec mes propres mots.",
  },
  {
    key: "authorizedAccess" as const,
    id: "consent-access",
    label:
      "Je comprends que mes réponses seront consultées uniquement par les référents autorisés.",
  },
];

type Phase = "intro" | "wizard" | "summary";

function scrollToQuestionStart(el: HTMLElement | null) {
  if (!el) return;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

function ShellHeaderProgress({
  moderatorView,
  phase,
  liveProgress,
  sectionIndex,
  sectionTotal,
  currentSectionTitle,
  currentIndex,
  sectionStatuses,
}: {
  moderatorView: ModeratorStatusView;
  phase: Phase;
  liveProgress: { completed: number; total: number; percent: number };
  sectionIndex: number;
  sectionTotal: number;
  currentSectionTitle?: string;
  currentIndex: number;
  sectionStatuses: Array<"future" | "active" | "done">;
}) {
  return (
    <aside
      aria-label="Progression du questionnaire"
      className="w-full rounded-xl border p-[clamp(0.75rem,1.2vw,1rem)]"
      style={{
        ...qSurfaceStyle,
        backgroundImage:
          "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 8%, var(--color-card)) 0%, var(--color-card) 100%)",
      }}
    >
      <QuestionnaireStatusBadge view={moderatorView} />
      {phase === "wizard" && sectionTotal > 0 ? (
        <p className={`mt-2 text-sm font-medium leading-snug ${QUI.text}`}>
          Partie {sectionIndex + 1} / {sectionTotal}
          {currentSectionTitle ? (
            <span className={`block sm:inline ${QUI.textSecondary}`}>
              <span className="hidden sm:inline"> · </span>
              {currentSectionTitle}
            </span>
          ) : null}
        </p>
      ) : phase === "intro" ? (
        <p className={`mt-2 text-sm ${QUI.textSecondary}`}>
          85 questions · 12 parties · prêt à commencer
        </p>
      ) : null}
      <p className={`mt-1 text-sm ${QUI.textSecondary}`}>
        Question{" "}
        {phase === "wizard" ? currentIndex + 1 : liveProgress.completed} sur{" "}
        {liveProgress.total} · {liveProgress.percent} % complété
      </p>
      <div className={`mt-3 ${QUI.progressTrack}`}>
        <div
          className={QUI.progressFill}
          style={{ width: `${liveProgress.percent}%` }}
          role="progressbar"
          aria-valuenow={liveProgress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {phase === "wizard" && sectionTotal > 0 ? (
        <SectionStepper statuses={sectionStatuses} />
      ) : null}
    </aside>
  );
}

function SectionStepper({
  statuses,
}: {
  statuses: Array<"future" | "active" | "done">;
}) {
  if (statuses.length === 0) return null;
  return (
    <div
      className="mt-3 flex flex-wrap gap-1"
      role="list"
      aria-label="Progression par partie"
    >
      {statuses.map((status, i) => (
        <span
          key={i}
          role="listitem"
          title={`Partie ${i + 1}`}
          aria-label={`Partie ${i + 1}${
            status === "active" ? ", en cours" : status === "done" ? ", complétée" : ""
          }`}
          className={
            "h-1.5 min-w-[0.35rem] flex-1 rounded-full transition-colors " +
            (status === "active"
              ? "bg-violet-500"
              : status === "done"
                ? "bg-emerald-500"
                : "bg-[color-mix(in_srgb,var(--color-text)_12%,var(--color-card))]")
          }
        />
      ))}
    </div>
  );
}

export default function StaffQuestionnaireModeratorClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [consents, setConsents] = useState<SubmissionConsents>({
    understoodPurpose: false,
    sincereAnswers: false,
    authorizedAccess: false,
  });
  const [editable, setEditable] = useState(true);
  const [moderatorView, setModeratorView] = useState<ModeratorStatusView>("A_REMPLIR");
  const [progress, setProgress] = useState({ completed: 0, total: 85, percent: 0 });
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publishedSummary, setPublishedSummary] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<
    Array<{ id: string; title: string; description: string | null; monthIndex: number | null }>
  >([]);

  const questionAnchorRef = useRef<HTMLDivElement>(null);
  const fieldErrorId = "questionnaire-field-error";

  const sections = useMemo(() => buildSectionsFromQuestions(questions), [questions]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, sRes] = await Promise.all([
        fetch("/api/moderation/my-questionnaire", { cache: "no-store" }),
        fetch("/api/moderation/my-questionnaire/summary", { cache: "no-store" }),
      ]);
      const qData = await qRes.json();
      const sData = await sRes.json();
      if (!qRes.ok) throw new Error(qData?.error || "Chargement impossible");

      const qs = (qData.questions ?? []) as Question[];
      setQuestions(qs);

      const next: Record<string, AnswerState> = {};
      for (const [key, val] of Object.entries(qData.answers ?? {})) {
        const v = val as AnswerState;
        next[key] = { answerText: v.answerText, answerJson: v.answerJson };
      }
      setAnswers(next);

      const prog = computeQuestionnaireProgress(qs, next);
      setProgress({ completed: prog.completed, total: prog.total, percent: prog.percent });

      setModeratorView(qData.submission?.moderatorView ?? "A_REMPLIR");
      setEditable(Boolean(qData.submission?.editable));
      setConsents({
        understoodPurpose: Boolean(qData.submission?.consents?.understoodPurpose),
        sincereAnswers: Boolean(qData.submission?.consents?.sincereAnswers),
        authorizedAccess: Boolean(qData.submission?.consents?.authorizedAccess),
      });

      if (sRes.ok && sData.summary) {
        setPublishedSummary(sData.summary);
        setObjectives(sData.objectives ?? []);
        setPhase("summary");
      } else if (!qData.submission?.editable) {
        setPhase("summary");
      } else {
        const cOk =
          qData.submission?.consents?.understoodPurpose &&
          qData.submission?.consents?.sincereAnswers &&
          qData.submission?.consents?.authorizedAccess;
        if (cOk) {
          setPhase("wizard");
          setCurrentIndex(prog.firstIncompleteIndex);
        } else {
          setPhase("intro");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentQuestion = questions[currentIndex];
  const isLast = questions.length > 0 && currentIndex >= questions.length - 1;
  const isFirst = currentIndex === 0;

  const liveProgress = useMemo(
    () => computeQuestionnaireProgress(questions, answers),
    [questions, answers],
  );

  const sectionIndex = getCurrentSectionIndex(sections, currentQuestion?.sectionKey);
  const sectionTotal = sections.length;
  const currentSectionTitle = sections[sectionIndex]?.title;

  const sectionStatuses = useMemo(
    () =>
      getSectionStepStatuses(
        sections,
        questions.map((q) => ({ ...q, key: q.key })),
        answers,
        currentQuestion?.sectionKey,
      ),
    [sections, questions, answers, currentQuestion?.sectionKey],
  );

  const consentsOk =
    consents.understoodPurpose && consents.sincereAnswers && consents.authorizedAccess;

  useEffect(() => {
    if (phase !== "wizard" || !currentQuestion) return;
    scrollToQuestionStart(questionAnchorRef.current);
    const t = window.setTimeout(() => {
      const focusable = questionAnchorRef.current?.querySelector<HTMLElement>(
        "textarea, input:not([type=hidden])",
      );
      focusable?.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(t);
  }, [currentIndex, phase, currentQuestion?.key]);

  function setAnswer(key: string, patch: AnswerState) {
    setAnswers((prev) => {
      const merged = { ...prev, [key]: { ...prev[key], ...patch } };
      const prog = computeQuestionnaireProgress(questions, merged);
      setProgress({ completed: prog.completed, total: prog.total, percent: prog.percent });
      return merged;
    });
  }

  function buildPayload() {
    return Object.entries(answers).map(([questionKey, a]) => ({
      questionKey,
      answerText: a.answerText ?? null,
      answerJson: a.answerJson ?? null,
    }));
  }

  async function saveDraft(showToast = true) {
    setSaving(true);
    setError(null);
    if (showToast) setMessage(null);
    try {
      const res = await fetch("/api/moderation/my-questionnaire/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: buildPayload(), consents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Échec de l'enregistrement");
      if (showToast) setMessage("Progression enregistrée — tu peux reprendre plus tard.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await fetch("/api/moderation/my-questionnaire/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: buildPayload(), consents }),
      });
      const res = await fetch("/api/moderation/my-questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.missing?.length) {
          throw new Error(
            `Il reste ${data.missing.length} élément(s) à compléter avant l'envoi.`,
          );
        }
        throw new Error(data?.error || "Échec de l'envoi");
      }
      setMessage("Questionnaire envoyé — merci pour ta sincérité.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (!currentQuestion) return;
    if (
      currentQuestion.isRequired &&
      !isQuestionAnswered(currentQuestion, answers[currentQuestion.key])
    ) {
      setError("Cette question est obligatoire avant de continuer.");
      return;
    }
    setError(null);
    if (isLast) return;
    setCurrentIndex((i) => i + 1);
  }

  function goPrev() {
    setError(null);
    if (!isFirst) setCurrentIndex((i) => i - 1);
  }

  const showProgressCard = phase !== "summary" || editable;
  const wizardErrorForField = phase === "wizard" && error ? fieldErrorId : undefined;

  const headerProgress =
    !loading && showProgressCard ? (
      <ShellHeaderProgress
        moderatorView={moderatorView}
        phase={phase}
        liveProgress={liveProgress}
        sectionIndex={sectionIndex}
        sectionTotal={sectionTotal}
        currentSectionTitle={currentSectionTitle}
        currentIndex={currentIndex}
        sectionStatuses={sectionStatuses}
      />
    ) : null;

  return (
    <ModerationPageShell
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Modération", href: MODERATION_STAFF_BASE },
        { label: "Questionnaire posture staff" },
      ]}
      title="Questionnaire posture staff"
      description="Un parcours guidé, à ton rythme — sauvegarde et envoi à la fin"
      icon={ClipboardList}
      audienceLabel="Vue modérateur"
      rightSlot={
        headerProgress ? (
          <div className="hidden w-full lg:block">{headerProgress}</div>
        ) : undefined
      }
    >
      {loading ? (
        <div
          className={`flex items-center justify-center gap-2 py-12 ${QUI.textSecondary}`}
        >
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          Chargement du questionnaire…
        </div>
      ) : (
        <div className="mx-auto min-w-0 w-full max-w-5xl space-y-[clamp(1rem,2vw,1.5rem)]">
          {headerProgress ? <div className="lg:hidden">{headerProgress}</div> : null}
          {error ? (
            <p
              id={phase === "wizard" ? fieldErrorId : undefined}
              role="alert"
              className={QUI.alertError}
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className={QUI.alertSuccess}>
              {message}
            </p>
          ) : null}

          {phase === "summary" && publishedSummary ? (
            <section
              className="rounded-2xl border p-[clamp(1rem,2vw,1.5rem)]"
              style={qCardStyle}
            >
              <h2
                className={QUI.heading}
                style={{ fontSize: "clamp(1rem, 1.2vw, 1.125rem)" }}
              >
                Ta synthèse personnalisée
              </h2>
              <div
                className={`mt-4 text-sm whitespace-pre-line leading-relaxed ${QUI.textSecondary}`}
              >
                {publishedSummary}
              </div>
              {objectives.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {objectives.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-xl border px-4 py-3"
                      style={qSurfaceStyle}
                    >
                      <p className={`font-semibold ${QUI.text}`}>{o.title}</p>
                      {o.description ? (
                        <p className={`text-sm ${QUI.textSecondary}`}>{o.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {phase === "summary" && !publishedSummary && !editable ? (
            <section
              className={`rounded-2xl border p-[clamp(1rem,2vw,1.5rem)] ${QUI.textSecondary}`}
              style={qCardStyle}
            >
              <CheckCircle2
                className="mb-2 h-8 w-8 text-emerald-500"
                aria-hidden
              />
              <p>
                Questionnaire envoyé. L&apos;équipe prépare ta synthèse — tu seras notifié ici
                quand elle sera disponible.
              </p>
            </section>
          ) : null}

          {phase === "intro" && editable ? (
            <section
              className="rounded-2xl border p-[clamp(1rem,2vw,1.5rem)] space-y-5"
              style={qCardStyle}
            >
              <div>
                <h2
                  className={QUI.heading}
                  style={{ fontSize: "clamp(1.05rem, 1.35vw, 1.25rem)" }}
                >
                  Avant de commencer
                </h2>
                <p
                  className={`mt-2 flex flex-wrap items-center gap-2 text-sm ${QUI.textSecondary}`}
                >
                  <Clock className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                  Environ 30–45 min · 85 questions · 12 parties · sauvegarde possible à tout
                  moment
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {INTRO_BLOCKS.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-xl border p-4"
                    style={qSurfaceStyle}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-card))] text-violet-600 dark:text-violet-300"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className={`text-sm font-bold ${QUI.text}`}>{title}</h3>
                        <p className={`mt-1 text-sm leading-relaxed ${QUI.textSecondary}`}>
                          {body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className={`text-sm font-semibold ${QUI.text}`}>
                  Avant de continuer, confirme que tu as bien compris :
                </p>
                {CONSENT_ITEMS.map((item) => (
                  <ConsentChoice
                    key={item.key}
                    id={item.id}
                    checked={consents[item.key]}
                    onChange={(checked) =>
                      setConsents((c) => ({ ...c, [item.key]: checked }))
                    }
                  >
                    {item.label}
                  </ConsentChoice>
                ))}
              </div>

              <button
                type="button"
                disabled={!consentsOk}
                onClick={() => {
                  setPhase("wizard");
                  setCurrentIndex(liveProgress.firstIncompleteIndex);
                }}
                className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-violet-400 hover:to-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40 sm:w-auto"
              >
                Commencer le questionnaire
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </section>
          ) : null}

          {phase === "wizard" && editable && currentQuestion ? (
            <section
              className="rounded-2xl border shadow-[0_8px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
              style={qCardStyle}
            >
              <div
                ref={questionAnchorRef}
                className={`border-b px-5 py-4 sm:px-6 ${QUI.divider} ${QUI.questionEnter}`}
              >
                <p className={QUI.sectionLabel}>{currentQuestion.sectionTitle}</p>
                <p className={`mt-2 text-sm ${QUI.textMuted}`}>
                  Question {currentIndex + 1} sur {questions.length}
                </p>
                <h2
                  className={`mt-3 text-pretty leading-snug ${QUI.heading}`}
                  style={{ fontSize: "clamp(1.05rem, 1.25vw, 1.25rem)" }}
                >
                  {currentQuestion.label}
                  {currentQuestion.isRequired ? (
                    <span className="text-rose-500" aria-hidden>
                      {" "}
                      *
                    </span>
                  ) : null}
                  {currentQuestion.isRequired ? (
                    <span className="sr-only"> (obligatoire)</span>
                  ) : null}
                </h2>
              </div>

              <div className={`px-5 py-6 sm:px-6 ${QUI.questionEnter}`}>
                <QuestionField
                  question={currentQuestion}
                  value={answers[currentQuestion.key]}
                  onChange={(patch) => setAnswer(currentQuestion.key, patch)}
                  large
                  describedBy={wizardErrorForField}
                />
              </div>

              <footer
                className={`flex flex-col gap-3 border-t px-5 py-4 sm:px-6 ${QUI.divider}`}
              >
                <button
                  type="button"
                  disabled={isFirst || saving}
                  onClick={goPrev}
                  className={`${QUI.btnSecondary} w-full sm:w-auto`}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Précédent
                </button>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  {!isLast ? (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveDraft()}
                        className={`${QUI.btnSave} w-full sm:w-auto`}
                      >
                        <Save className="h-4 w-4" aria-hidden />
                        Enregistrer ma progression
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={goNext}
                        className={`${QUI.btnPrimary} w-full sm:w-auto`}
                      >
                        Suivant
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveDraft()}
                        className={`${QUI.btnGhost} w-full sm:mr-auto sm:w-auto`}
                      >
                        <Save className="h-4 w-4" aria-hidden />
                        Enregistrer ma progression
                      </button>
                      <button
                        type="button"
                        disabled={saving || liveProgress.completed < liveProgress.total}
                        onClick={() => void submitFinal()}
                        className={QUI.btnSubmit}
                      >
                        <Send className="h-4 w-4" aria-hidden />
                        Envoyer mon questionnaire
                      </button>
                    </>
                  )}
                </div>
              </footer>
            </section>
          ) : null}

          <p className={`text-center text-xs ${QUI.textMuted}`}>
            <Link
              href={MODERATION_STAFF_BASE}
              className="font-medium text-violet-600 underline-offset-2 hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
            >
              ← Retour au centre de modération
            </Link>
          </p>
        </div>
      )}
    </ModerationPageShell>
  );
}
