"use client";

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  MonitorPlay,
  X,
} from "lucide-react";
import { Q_LAYOUT, QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";
import type {
  AdminReviewPayload,
  FinalReviewPayload,
  ObjectivePayload,
  StaffQuestionnaireFinalDecision,
} from "@/lib/staff-questionnaire/types";

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

const FINAL_DECISION_LABELS: Record<StaffQuestionnaireFinalDecision, string> = {
  VALIDATED: "Validé",
  EXTENDED_TRAINING: "Formation prolongée",
  BINOME: "Binôme",
  OBSERVATION: "Observation",
  SUPPORT_TENF: "Soutien TENF",
  PAUSE_RECOMMENDED: "Pause recommandée",
  REFERENT_POTENTIAL: "Potentiel référent",
};

const OBJECTIVE_STATUS_LABELS: Record<NonNullable<ObjectivePayload["status"]>, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  PAUSED: "En pause",
};

type PresentationSlide = {
  id: string;
  title: string;
  subtitle?: string;
  emptyMessage: string;
  hasContent: boolean;
  content: ReactNode;
};

export type StaffQuestionnairePresentationModalProps = {
  open: boolean;
  onClose: () => void;
  memberName: string;
  roleStaff?: string;
  review: AdminReviewPayload;
  objectives: ObjectivePayload[];
  finalReview: FinalReviewPayload;
};

function PresentationBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/25 p-4 sm:p-5">
      <h3 className={QUI.sectionLabel}>{label}</h3>
      <div className="mt-3 text-sm leading-relaxed text-zinc-200 sm:text-base">{children}</div>
    </section>
  );
}

function hasText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

export default function StaffQuestionnairePresentationModal({
  open,
  onClose,
  memberName,
  roleStaff,
  review,
  objectives,
  finalReview,
}: StaffQuestionnairePresentationModalProps) {
  const titleId = useId();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo((): PresentationSlide[] => {
    const analysisFieldsFilled = ANALYSIS_FIELDS.filter((f) =>
      hasText(review[f.key] as string | undefined),
    );
    const hasInternalAnalysis =
      hasText(review.internalAnalysisText) ||
      analysisFieldsFilled.length > 0 ||
      hasText(review.adminNotes);

    const internalSlide: PresentationSlide = {
      id: "internal",
      title: "Analyse interne",
      subtitle: "Document confidentiel — staff coordination",
      emptyMessage: "Aucune analyse interne enregistrée pour le moment.",
      hasContent: hasInternalAnalysis,
      content: hasInternalAnalysis ? (
        <div className="space-y-4">
          {hasText(review.internalAnalysisText) ? (
            <PresentationBlock label="Synthèse d'analyse">
              <p className="whitespace-pre-line">{review.internalAnalysisText}</p>
            </PresentationBlock>
          ) : null}
          {analysisFieldsFilled.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {analysisFieldsFilled.map(({ key, label }) => (
                <PresentationBlock key={key} label={label}>
                  <p className="whitespace-pre-line">{(review[key] as string) ?? ""}</p>
                </PresentationBlock>
              ))}
            </div>
          ) : null}
          {hasText(review.adminNotes) ? (
            <PresentationBlock label="Notes internes">
              <p className="whitespace-pre-line">{review.adminNotes}</p>
            </PresentationBlock>
          ) : null}
        </div>
      ) : null,
    };

    const summarySlide: PresentationSlide = {
      id: "summary",
      title: "Synthèse modérateur",
      subtitle: "Formulation bienveillante enregistrée",
      emptyMessage: "Aucune synthèse modérateur enregistrée.",
      hasContent: hasText(review.memberSummaryText),
      content: hasText(review.memberSummaryText) ? (
        <PresentationBlock label="Synthèse">
          <p className="whitespace-pre-line text-[length:clamp(0.9375rem,0.85rem+0.35vw,1.0625rem)] leading-relaxed">
            {review.memberSummaryText}
          </p>
        </PresentationBlock>
      ) : null,
    };

    const objectivesSlide: PresentationSlide = {
      id: "objectives",
      title: "Objectifs (3 mois)",
      subtitle: "Plan d'accompagnement",
      emptyMessage: "Aucun objectif enregistré.",
      hasContent: objectives.some((o) => hasText(o.title) || hasText(o.description)),
      content: (
        <ul className="space-y-3">
          {objectives.map((o, i) => (
            <li
              key={o.id ?? i}
              className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{o.title || "Objectif sans titre"}</span>
                {o.monthIndex ? (
                  <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs text-zinc-400">
                    Mois {o.monthIndex}
                  </span>
                ) : null}
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                  {OBJECTIVE_STATUS_LABELS[o.status ?? "TODO"]}
                </span>
              </div>
              {hasText(o.description) ? (
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-300">{o.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ),
    };

    const finalSlide: PresentationSlide = {
      id: "final",
      title: "Bilan final",
      subtitle: "Décision de clôture",
      emptyMessage: "Aucun bilan final enregistré.",
      hasContent: hasText(finalReview.finalReviewText) || Boolean(finalReview.decision),
      content: (
        <div className="space-y-4">
          <PresentationBlock label="Décision">
            <p className="text-lg font-semibold text-amber-100">
              {FINAL_DECISION_LABELS[finalReview.decision] ?? finalReview.decision}
            </p>
          </PresentationBlock>
          {hasText(finalReview.finalReviewText) ? (
            <PresentationBlock label="Compte rendu">
              <p className="whitespace-pre-line">{finalReview.finalReviewText}</p>
            </PresentationBlock>
          ) : null}
        </div>
      ),
    };

    return [internalSlide, summarySlide, objectivesSlide, finalSlide];
  }, [review, objectives, finalReview]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i <= 0 ? slides.length - 1 : i - 1));
  }, [slides.length]);

  const goNext = useCallback(() => {
    setSlideIndex((i) => (i >= slides.length - 1 ? 0 : i + 1));
  }, [slides.length]);

  useEffect(() => {
    if (!open) return;
    setSlideIndex(0);
  }, [open, memberName]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const slide = slides[slideIndex]!;
  const filledCount = slides.filter((s) => s.hasContent).length;

  return (
    <div
      className="fixed inset-0 z-[220] flex flex-col bg-[#07080d]/95 backdrop-blur-md"
      role="presentation"
    >
      <header className="shrink-0 border-b border-white/10 bg-zinc-950/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={Q_LAYOUT.eyebrow}>Mode présentation</p>
            <h2 id={titleId} className="truncate text-lg font-semibold text-white sm:text-xl">
              {memberName}
            </h2>
            {roleStaff ? <p className="text-xs text-zinc-500">{roleStaff}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
              Fondateur / Admin coordinateur
            </span>
            <button
              type="button"
              onClick={onClose}
              className={`${Q_LAYOUT.subtleBtn} ${Q_LAYOUT.focusRing}`}
              aria-label="Fermer le mode présentation"
            >
              <X className="h-4 w-4" aria-hidden />
              Fermer
            </button>
          </div>
        </div>
      </header>

      <nav
        className="shrink-0 border-b border-white/5 bg-black/30 px-4 py-2 sm:px-6"
        aria-label="Sections de présentation"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlideIndex(i)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm " +
                (slideIndex === i
                  ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/40"
                  : s.hasContent
                    ? "text-zinc-300 hover:bg-white/5 hover:text-white"
                    : "text-zinc-600 hover:text-zinc-400")
              }
            >
              {s.title}
              {!s.hasContent ? " · vide" : null}
            </button>
          ))}
        </div>
      </nav>

      <main
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
              <MonitorPlay className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {slide.title}
              </h3>
              {slide.subtitle ? (
                <p className="mt-1 text-sm text-zinc-400">{slide.subtitle}</p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">
                {filledCount} section(s) avec contenu enregistré · lecture seule
              </p>
            </div>
          </div>

          {slide.hasContent ? (
            slide.content
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
              {slide.emptyMessage}
            </p>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-zinc-950/90 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            className={`${Q_LAYOUT.subtleBtn} ${Q_LAYOUT.focusRing}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Précédent
          </button>
          <span className="text-xs text-zinc-500">
            {slideIndex + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            className={`${QUI.btnPrimary} ${Q_LAYOUT.focusRing}`}
          >
            Suivant
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  );
}
