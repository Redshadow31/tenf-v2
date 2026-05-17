"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Sparkles } from "lucide-react";
import { MUI } from "@/components/admin/moderation/moderation-ui";
import QuestionnaireStatusBadge from "@/components/admin/moderation/questionnaire/QuestionnaireStatusBadge";
import {
  questionnaireCtaLabel,
  useMyQuestionnaireHub,
} from "@/components/admin/moderation/questionnaire/QuestionnaireHubContext";
import type { ModerationView } from "@/lib/moderation/moderationTree";

type Props = {
  view: ModerationView;
  variant?: "banner" | "card";
};

export default function QuestionnaireHubCard({ view, variant = "card" }: Props) {
  const { loading, moderatorView, progress } = useMyQuestionnaireHub(view === "staff");

  if (view === "admin") {
    return (
      <HubCardShell variant={variant} featured={false}>
        <CardBody
          title="Questionnaires posture staff"
          description="Suivi des réponses, analyses internes, synthèses modérateurs et objectifs de progression."
          href="/admin/moderation/staff/questionnaires"
          cta="Ouvrir le suivi"
          badge={<QuestionnaireStatusBadge label="Pilotage admin" tone="violet" />}
        />
      </HubCardShell>
    );
  }

  const cta = loading ? "À remplir" : questionnaireCtaLabel(moderatorView);
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <HubCardShell variant={variant} featured={variant === "banner"}>
      <CardBody
        title="Questionnaire posture staff"
        description="Comprendre ton fonctionnement, ta communication, ton autonomie et ta posture staff pour t'accompagner pendant la formation."
        href="/admin/moderation/staff/questionnaire"
        cta={cta}
        loading={loading}
        badge={
          loading ? (
            <span
              className="inline-block h-6 w-24 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--color-text)_8%,var(--color-card))]"
              aria-hidden
            />
          ) : (
            <QuestionnaireStatusBadge view={moderatorView ?? "A_REMPLIR"} />
          )
        }
        sub={
          progress
            ? `${progress.completed} / ${progress.total} questions complétées`
            : loading
              ? undefined
              : "85 questions · 12 parties"
        }
        progressPercent={progress ? progressPercent : undefined}
        horizontal={variant === "banner"}
      />
    </HubCardShell>
  );
}

function HubCardShell({
  variant,
  featured,
  children,
}: {
  variant: "banner" | "card";
  featured: boolean;
  children: ReactNode;
}) {
  const pad = "clamp(0.9rem, 0.75rem + 0.8vw, 1.35rem)";

  if (featured) {
    return (
      <article className={`${MUI.featuredRing} w-full`} aria-labelledby="q-hub-banner-title">
        <div
          className={`${MUI.featuredInner} relative overflow-hidden`}
          style={{ padding: pad }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-[inherit] bg-gradient-to-b from-emerald-400 via-violet-500 to-violet-700"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] blur-2xl" aria-hidden />
          <div className="relative">{children}</div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={
        (variant === "banner" ? "w-full " : "flex h-full flex-col ") + MUI.card
      }
    >
      <div style={{ padding: pad }} className={variant === "card" ? "flex flex-1 flex-col gap-3" : undefined}>
        {children}
      </div>
    </article>
  );
}

function CardBody({
  title,
  description,
  href,
  cta,
  badge,
  sub,
  loading,
  horizontal,
  progressPercent,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  badge: ReactNode;
  sub?: string;
  loading?: boolean;
  horizontal?: boolean;
  progressPercent?: number;
}) {
  const titleId = horizontal ? "q-hub-banner-title" : undefined;

  if (horizontal) {
    return (
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className={MUI.iconEmeraldLg} aria-hidden>
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" aria-hidden />
              <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${MUI.sectionLabel}`}>
                Priorité formation
              </span>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                id={titleId}
                className={`text-pretty font-bold ${MUI.text}`}
                style={{ fontSize: "clamp(1rem,1.15vw,1.2rem)" }}
              >
                {title}
              </h3>
              {badge}
            </div>
            <p
              className={`mt-1.5 max-w-[70ch] text-pretty leading-relaxed ${MUI.textSecondary}`}
              style={{ fontSize: "clamp(0.78rem,0.88vw,0.92rem)" }}
            >
              {description}
            </p>
            {sub ? <p className={`mt-2 text-sm font-semibold ${MUI.text}`}>{sub}</p> : null}
            {typeof progressPercent === "number" ? (
              <div
                className={`mt-3 max-w-md ${MUI.progressTrack}`}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className={MUI.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            ) : null}
          </div>
        </div>
        <Link
          href={href}
          className={`${MUI.btnPrimary} w-full shrink-0 lg:w-auto ${loading ? "pointer-events-none opacity-70" : ""}`}
          aria-busy={loading || undefined}
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className={MUI.iconEmeraldMd} aria-hidden>
            <ClipboardList className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className={`font-bold ${MUI.text}`} style={{ fontSize: "clamp(0.88rem,1vw,1rem)" }}>
              {title}
            </h3>
            <p className={`mt-1 text-pretty leading-snug ${MUI.textSecondary}`} style={{ fontSize: "clamp(0.72rem,0.8vw,0.82rem)" }}>
              {description}
            </p>
            {sub ? <p className={`mt-1 text-sm ${MUI.textMuted}`}>{sub}</p> : null}
          </div>
        </div>
        {badge}
      </div>
      <Link href={href} className={`${MUI.btnPrimary} w-fit ${loading ? "pointer-events-none opacity-70" : ""}`} aria-busy={loading || undefined}>
        {cta}
      </Link>
    </>
  );
}

