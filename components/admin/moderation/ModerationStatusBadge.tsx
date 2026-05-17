import type { ModerationStatus, ModerationTone } from "@/lib/moderation/moderationTree";
import { describeStatus } from "@/lib/moderation/moderationTree";

type Props = {
  status: ModerationStatus;
  size?: "sm" | "md";
  className?: string;
  /** Style plus discret pour modules WIP / placeholder. */
  subdued?: boolean;
};

const TONE_CLASSES: Record<ModerationTone, string> = {
  violet:
    "border-violet-400/35 bg-[color-mix(in_srgb,#8b5cf6_12%,var(--color-card))] text-violet-800 dark:text-violet-200",
  indigo:
    "border-indigo-400/35 bg-[color-mix(in_srgb,#6366f1_12%,var(--color-card))] text-indigo-800 dark:text-indigo-200",
  sky: "border-sky-400/35 bg-[color-mix(in_srgb,#0ea5e9_12%,var(--color-card))] text-sky-800 dark:text-sky-200",
  emerald:
    "border-emerald-400/35 bg-[color-mix(in_srgb,#10b981_12%,var(--color-card))] text-emerald-800 dark:text-emerald-200",
  amber:
    "border-amber-400/35 bg-[color-mix(in_srgb,#f59e0b_12%,var(--color-card))] text-amber-800 dark:text-amber-200",
  rose: "border-rose-400/35 bg-[color-mix(in_srgb,#f43f5e_12%,var(--color-card))] text-rose-800 dark:text-rose-200",
  slate:
    "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-card))] text-[var(--color-text-secondary)]",
};

export default function ModerationStatusBadge({
  status,
  size = "md",
  className,
  subdued = false,
}: Props) {
  const { label, tone } = describeStatus(status);
  const sizeClass =
    size === "sm" ? "px-1.5 py-[1px] text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-bold uppercase tracking-[0.08em]",
        sizeClass,
        TONE_CLASSES[tone],
        subdued ? "opacity-75 saturate-50" : "",
        className ?? "",
      ].join(" ")}
      aria-label={`Statut: ${label}`}
    >
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export const moderationToneClasses = TONE_CLASSES;
