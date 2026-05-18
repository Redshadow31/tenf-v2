"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";
import { Q_LAYOUT, QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";
import {
  CHARTE_AUDIENCE_COLORS,
  CHARTE_AUDIENCE_LABELS,
  CHARTE_TAG_COLORS,
  getCharteSectionAnchor,
  type CharteSection,
} from "./charteModerationContent";

type CharteArticleCardProps = {
  section: CharteSection;
  checked: boolean;
  referenceMode: boolean;
  isValidationCooldownActive: boolean;
  remainingCooldownSeconds: number;
  onToggle: (id: number) => void;
  /** Surligne l'article si pertinent pour le profil connecté */
  profileRelevant?: boolean;
};

export function CharteArticleCard({
  section,
  checked,
  referenceMode,
  isValidationCooldownActive,
  remainingCooldownSeconds,
  onToggle,
  profileRelevant = false,
}: CharteArticleCardProps) {
  const anchorId = getCharteSectionAnchor(section.id);

  return (
    <article
      id={anchorId}
      className={`scroll-mt-28 relative overflow-hidden rounded-2xl border bg-zinc-950/55 p-5 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/[0.04] ${
        checked
          ? "border-emerald-500/25"
          : profileRelevant
            ? "border-violet-400/35 ring-violet-500/15"
            : "border-white/[0.08]"
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-y-4 left-0 w-[3px] rounded-full ${
          checked ? "bg-emerald-400/80" : "bg-violet-500/50"
        }`}
        aria-hidden
      />

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className={QUI.sectionLabel}>Article {section.id}</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            <span className="mr-1.5" aria-hidden>
              {section.emoji}
            </span>
            {section.title}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {section.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CHARTE_TAG_COLORS[tag]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {!referenceMode ? (
          <button
            type="button"
            onClick={() => onToggle(section.id)}
            disabled={!checked && isValidationCooldownActive}
            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${Q_LAYOUT.focusRing} ${
              checked
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/15 bg-zinc-900 text-zinc-200 hover:border-violet-400/30"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {checked
              ? "Article lu"
              : isValidationCooldownActive
                ? `Attends ${remainingCooldownSeconds}s`
                : "J'ai lu cet article"}
          </button>
        ) : checked ? (
          <span className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200">
            Lu
          </span>
        ) : null}
      </header>

      <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-950/25 px-3 py-2.5 pl-2">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200/90">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden />
          En bref
        </p>
        <p className="mt-1 text-sm leading-relaxed text-cyan-50/95">{section.summary}</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5 pl-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Pour</span>
        {section.audiences.map((audience) => (
          <span
            key={audience}
            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${CHARTE_AUDIENCE_COLORS[audience]}`}
          >
            {CHARTE_AUDIENCE_LABELS[audience]}
          </span>
        ))}
      </div>

      {section.callout ? (
        <div className="mb-4 rounded-xl border border-rose-400/25 bg-rose-950/30 p-4 pl-2">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-200/95">{section.callout.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-rose-50/95">{section.callout.body}</p>
        </div>
      ) : null}

      {section.intro ? (
        <p className="pl-2 text-sm leading-relaxed text-zinc-300">{section.intro}</p>
      ) : null}

      {section.steps?.length ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-7 text-sm text-zinc-300">
          {section.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      {section.bullets?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-7 text-sm text-zinc-300">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {section.warnings?.length ? (
        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-950/35 p-4 pl-2">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-200/90">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Attention
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100/95">
            {section.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.comparison?.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 pl-2">
          <table className="min-w-[280px] w-full text-left text-sm">
            <thead className="bg-zinc-800/90 text-zinc-100">
              <tr>
                <th className="px-3 py-2.5 font-medium">À éviter</th>
                <th className="px-3 py-2.5 font-medium">Préfère</th>
              </tr>
            </thead>
            <tbody>
              {section.comparison.map((row) => (
                <tr key={row.bad} className="border-t border-white/[0.06] bg-zinc-900/70">
                  <td className="px-3 py-2.5 text-rose-200/95">{row.bad}</td>
                  <td className="px-3 py-2.5 text-emerald-200/95">{row.good}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {section.examples?.length ? (
        <div className="mt-4 space-y-2 pl-2">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-200/90">Exemples</p>
          {section.examples.map((ex) => (
            <div
              key={ex.situation}
              className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 text-sm"
            >
              <p className="font-medium text-zinc-200">{ex.situation}</p>
              <p className="mt-1.5 text-rose-200/90">
                <span className="text-[10px] font-bold uppercase text-rose-300/80">Éviter · </span>
                {ex.bad}
              </p>
              <p className="mt-1 text-emerald-200/90">
                <span className="text-[10px] font-bold uppercase text-emerald-300/80">Mieux · </span>
                {ex.good}
              </p>
              {ex.remonter ? (
                <p className="mt-1 text-amber-200/90">
                  <span className="text-[10px] font-bold uppercase text-amber-300/80">Remonter · </span>
                  {ex.remonter}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.retainBox ? (
        <p className="mt-4 rounded-xl border border-violet-400/25 bg-violet-950/30 px-3 py-2.5 pl-2 text-sm text-violet-100/95">
          <span className="font-semibold text-violet-200">À retenir — </span>
          {section.retainBox}
        </p>
      ) : null}

      {section.note ? (
        <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-950/30 px-3 py-2.5 pl-2 text-sm text-amber-100/95">
          {section.note}
        </p>
      ) : null}
    </article>
  );
}
