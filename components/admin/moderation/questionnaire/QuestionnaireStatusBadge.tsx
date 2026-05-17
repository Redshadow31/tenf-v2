import type { ModeratorStatusView } from "@/lib/staff-questionnaire/status-labels";
import { MODERATOR_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";

const TONE_CLASSES: Record<string, string> = {
  slate:
    "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-card))] text-[var(--color-text-secondary)]",
  amber:
    "border-amber-400/35 bg-[color-mix(in_srgb,#f59e0b_12%,var(--color-card))] text-amber-800 dark:text-amber-100",
  sky: "border-sky-400/35 bg-[color-mix(in_srgb,#0ea5e9_12%,var(--color-card))] text-sky-800 dark:text-sky-100",
  violet:
    "border-violet-400/35 bg-[color-mix(in_srgb,#8b5cf6_12%,var(--color-card))] text-violet-800 dark:text-violet-100",
  emerald:
    "border-emerald-400/35 bg-[color-mix(in_srgb,#10b981_12%,var(--color-card))] text-emerald-800 dark:text-emerald-100",
  indigo:
    "border-indigo-400/35 bg-[color-mix(in_srgb,#6366f1_12%,var(--color-card))] text-indigo-800 dark:text-indigo-100",
};

export default function QuestionnaireStatusBadge({
  view,
  label,
  tone,
}: {
  view?: ModeratorStatusView;
  label?: string;
  tone?: string;
}) {
  const meta = view ? MODERATOR_STATUS_LABELS[view] : null;
  const displayLabel = label ?? meta?.label ?? "—";
  const displayTone = tone ?? meta?.tone ?? "slate";
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " +
        (TONE_CLASSES[displayTone] ?? TONE_CLASSES.slate)
      }
    >
      {displayLabel}
    </span>
  );
}
