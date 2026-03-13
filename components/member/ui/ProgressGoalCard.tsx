type ProgressGoalCardProps = {
  label: string;
  current: number;
  target: number;
};

export default function ProgressGoalCard({ label, current, target }: ProgressGoalCardProps) {
  const safeTarget = target > 0 ? target : 1;
  const ratio = Math.max(0, Math.min(100, Math.round((current / safeTarget) * 100)));

  return (
    <article className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {current}/{target}
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${ratio}%`, backgroundColor: "var(--color-primary)" }} />
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {ratio}% atteint
      </p>
    </article>
  );
}
