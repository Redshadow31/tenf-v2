import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

type EmptyFeatureCardProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export default function EmptyFeatureCard({ title, description, icon: Icon = Construction }: EmptyFeatureCardProps) {
  return (
    <section className="rounded-xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "rgba(255,255,255,0.02)" }}>
        <Icon size={14} />
        <span>Fonctionnalité à venir</span>
      </div>
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {description}
      </p>
      <button
        type="button"
        disabled
        className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium opacity-70"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
      >
        Bientot disponible
      </button>
    </section>
  );
}
