import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
};

export default function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-xl border p-4 transition-all hover:-translate-y-[1px]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
          {title}
        </p>
        {Icon ? <Icon size={16} style={{ color: "#c4a1ff" }} /> : null}
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
    </article>
  );
}
