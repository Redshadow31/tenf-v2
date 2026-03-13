import type { CSSProperties } from "react";

type StatusTone = "success" | "warning" | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneStyles: Record<StatusTone, CSSProperties> = {
  success: {
    color: "#4ade80",
    borderColor: "rgba(74, 222, 128, 0.35)",
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },
  warning: {
    color: "#fbbf24",
    borderColor: "rgba(251, 191, 36, 0.35)",
    backgroundColor: "rgba(251, 191, 36, 0.12)",
  },
  neutral: {
    color: "var(--color-text-secondary)",
    borderColor: "var(--color-border)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
};

export default function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold" style={toneStyles[tone]}>
      {label}
    </span>
  );
}
