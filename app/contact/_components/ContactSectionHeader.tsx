import type { LucideIcon } from "lucide-react";

type ContactSectionHeaderProps = {
  kicker?: string;
  title: string;
  lead?: string;
  icon?: LucideIcon;
  accent?: string;
};

export default function ContactSectionHeader({
  kicker,
  title,
  lead,
  icon: Icon,
  accent = "#38bdf8",
}: ContactSectionHeaderProps) {
  return (
    <header className="relative max-w-3xl space-y-2">
      {kicker ? (
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
          {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
          {kicker}
        </p>
      ) : null}
      <h2 className="home-section-title text-xl font-extrabold sm:text-2xl lg:text-3xl">{title}</h2>
      {lead ? <p className="home-muted text-sm sm:text-base">{lead}</p> : null}
    </header>
  );
}
