"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageCircle,
  Rocket,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

/**
 * Identifiant d'icône sérialisable côté serveur.
 *
 * On ne peut PAS passer une fonction composant (ex. `UserPlus` de lucide-react)
 * d'un Server Component vers ce Client Component. On utilise donc une string
 * et un mapping interne pour récupérer le composant Icône au rendu.
 */
export type StepIconKey = "join" | "participate" | "progress";

const STEP_ICONS: Record<StepIconKey, LucideIcon> = {
  join: UserPlus,
  participate: MessageCircle,
  progress: Rocket,
};

export type StepDefinition = {
  num: 1 | 2 | 3;
  /** Label court affiché dans le segmented control (mobile + desktop). */
  pill: string;
  /** Titre principal de l'étape. */
  title: string;
  /** Phrase d'accroche chaleureuse. */
  tagline: string;
  /** Estimation de temps réaliste. */
  duration: string;
  /** Description complète avec ton humain. */
  description: string;
  /** 3 bullets concrets pour rassurer. */
  highlights: { label: string; text: string }[];
  /** Détails à dérouler (anciens composants riches). */
  details: ReactNode;
  /** CTA principal de l'étape. */
  cta: { href: string; label: string; external?: boolean };
  /** Clé d'icône (résolue côté client via STEP_ICONS). */
  iconKey: StepIconKey;
  /** Couleurs d'accent (purple / fuchsia / amber). */
  accent: "violet" | "fuchsia" | "amber";
};

const ACCENTS: Record<
  StepDefinition["accent"],
  {
    ring: string;
    chipBg: string;
    chipText: string;
    glow: string;
    border: string;
    iconBg: string;
    iconText: string;
  }
> = {
  violet: {
    ring: "ring-violet-400/40",
    chipBg: "bg-violet-500/15",
    chipText: "text-violet-200",
    glow: "shadow-[0_18px_50px_rgba(124,58,237,0.18)]",
    border: "border-violet-400/40",
    iconBg: "bg-violet-500/15 ring-1 ring-violet-400/35",
    iconText: "text-violet-200",
  },
  fuchsia: {
    ring: "ring-fuchsia-400/40",
    chipBg: "bg-fuchsia-500/15",
    chipText: "text-fuchsia-200",
    glow: "shadow-[0_18px_50px_rgba(217,70,239,0.18)]",
    border: "border-fuchsia-400/40",
    iconBg: "bg-fuchsia-500/15 ring-1 ring-fuchsia-400/35",
    iconText: "text-fuchsia-200",
  },
  amber: {
    ring: "ring-amber-400/40",
    chipBg: "bg-amber-500/15",
    chipText: "text-amber-200",
    glow: "shadow-[0_18px_50px_rgba(245,158,11,0.18)]",
    border: "border-amber-400/40",
    iconBg: "bg-amber-500/15 ring-1 ring-amber-400/35",
    iconText: "text-amber-200",
  },
};

const PILL_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";

export type CommentCaMarcheStepsProps = {
  steps: readonly StepDefinition[];
};

export function CommentCaMarcheSteps({ steps }: CommentCaMarcheStepsProps) {
  const [active, setActive] = useState<1 | 2 | 3>(1);
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});

  const toggleDetails = (num: number) => {
    setOpenDetails((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div className="space-y-6">
      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="Choisir une étape du parcours TENF"
        className="grid grid-cols-3 gap-2 rounded-2xl border p-2"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-card) 80%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        {steps.map((step) => {
          const isActive = active === step.num;
          const accent = ACCENTS[step.accent];
          return (
            <button
              key={step.num}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`step-panel-${step.num}`}
              id={`step-tab-${step.num}`}
              onClick={() => setActive(step.num)}
              className={`${PILL_BASE} ${
                isActive
                  ? `${accent.chipBg} ${accent.chipText} ring-1 ${accent.ring}`
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                  isActive ? "bg-white/15" : "bg-white/[0.04]"
                }`}
              >
                {step.num}
              </span>
              <span className="hidden sm:inline">{step.pill}</span>
              <span className="sm:hidden">Étape {step.num}</span>
            </button>
          );
        })}
      </div>

      {/* Panneaux */}
      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step) => {
          const isActive = active === step.num;
          const detailsOpen = !!openDetails[step.num];
          const accent = ACCENTS[step.accent];
          const Icon = STEP_ICONS[step.iconKey];
          return (
            <article
              key={step.num}
              id={`step-panel-${step.num}`}
              role="tabpanel"
              aria-labelledby={`step-tab-${step.num}`}
              tabIndex={isActive ? 0 : -1}
              data-active={isActive}
              className={`group flex flex-col rounded-3xl border bg-[var(--color-card)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                isActive
                  ? `${accent.border} ${accent.glow}`
                  : "border-[var(--color-border)] opacity-95 hover:-translate-y-0.5 hover:border-white/20"
              }`}
              style={
                {
                  padding: "clamp(1.25rem, 1.75vw, 1.75rem)",
                } as CSSProperties
              }
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent.iconBg}`}
                  aria-hidden
                >
                  <Icon className={`h-5 w-5 ${accent.iconText}`} strokeWidth={2.25} />
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-bg)",
                  }}
                >
                  <Clock className="h-3 w-3" aria-hidden />
                  {step.duration}
                </span>
              </div>

              <p
                className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: "color-mix(in srgb, var(--fn-purple) 80%, #fff)" }}
              >
                Étape {step.num} / 3
              </p>
              <h3
                className="mt-1 font-bold tracking-tight text-[var(--color-text)]"
                style={{ fontSize: "clamp(1.15rem, 0.95rem + 0.7vw, 1.45rem)" }}
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                {step.tagline}
              </p>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {step.description}
              </p>

              {/* Highlights */}
              <ul className="mt-4 space-y-2">
                {step.highlights.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${accent.iconText}`}
                      aria-hidden
                    />
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text)" }}>{item.label}</strong>{" "}
                      <span>· {item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={step.cta.href}
                  {...(step.cta.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 90%, #fff 10%), color-mix(in srgb, var(--color-primary) 65%, #d946ef 35%))",
                    boxShadow: "0 14px 36px rgba(124,58,237,0.28)",
                  }}
                >
                  {step.cta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>

                <button
                  type="button"
                  onClick={() => toggleDetails(step.num)}
                  aria-expanded={detailsOpen}
                  aria-controls={`step-details-${step.num}`}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                  {detailsOpen ? "Replier le détail" : "En savoir plus"}
                </button>
              </div>

              {/* Détails dépliables */}
              <div
                id={`step-details-${step.num}`}
                hidden={!detailsOpen}
                className={`${styles.fnDetailsInner} mt-4`}
                style={{
                  borderTop: detailsOpen ? "1px solid var(--color-border)" : "none",
                  paddingTop: detailsOpen ? "1rem" : 0,
                }}
              >
                {step.details}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
