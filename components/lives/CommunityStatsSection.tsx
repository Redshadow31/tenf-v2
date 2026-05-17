import { HeartHandshake, Radio, Sparkles, Users } from "lucide-react";
import type { CSSProperties } from "react";

type CommunityStatsSectionProps = {
  liveCount: number;
  totalMembers: number | null;
  activeMembers: number | null;
};

type StatTone = "red" | "violet" | "amber" | "emerald";
type StatItem = {
  label: string;
  value: string;
  caption: string;
  icon: typeof Radio;
  tone: StatTone;
  live?: boolean;
};

const TONE_STYLES: Record<StatTone, { iconColor: string; hoverBorder: string }> = {
  red: { iconColor: "text-red-400", hoverBorder: "hover:border-red-400/25" },
  violet: { iconColor: "text-violet-400", hoverBorder: "hover:border-violet-400/25" },
  amber: { iconColor: "text-amber-300", hoverBorder: "hover:border-amber-300/25" },
  emerald: { iconColor: "text-emerald-300", hoverBorder: "hover:border-emerald-300/25" },
};

export default function CommunityStatsSection({
  liveCount,
  totalMembers,
  activeMembers,
}: CommunityStatsSectionProps) {
  const stats: StatItem[] = [
    {
      label: "Streamers en direct",
      value: String(liveCount),
      caption: "Détecté·es à l'instant sur Twitch",
      icon: Radio,
      tone: "red",
      live: liveCount > 0,
    },
    {
      label: "Créateurs côté Discord",
      value: totalMembers !== null ? String(totalMembers) : "…",
      caption: "Les humains derrière TENF",
      icon: Users,
      tone: "violet",
    },
    {
      label: "Membres actifs ce mois",
      value: activeMembers !== null ? String(activeMembers) : "…",
      caption: "Présents sur une fenêtre récente",
      icon: Sparkles,
      tone: "amber",
    },
    {
      label: "Esprit TENF",
      value: "Entraide",
      caption: "Au quotidien, sans hiérarchie de viewers",
      icon: HeartHandshake,
      tone: "emerald",
    },
  ];

  const sectionStyle: CSSProperties = {
    padding: "clamp(1rem, 2vw, 1.75rem)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-card)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };

  return (
    <section className="space-y-4 rounded-2xl border" style={sectionStyle} aria-labelledby="community-stats-title">
      <div>
        <h2
          id="community-stats-title"
          className="flex items-center gap-2 font-bold tracking-tight"
          style={{ color: "var(--color-text)", fontSize: "clamp(1.1rem, 1rem + 0.5vw, 1.4rem)" }}
        >
          <HeartHandshake className="h-5 w-5 text-fuchsia-300" aria-hidden />
          La communauté TENF en ce moment
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Un aperçu rapide de l'activité du jour — ces chiffres bougent en continu.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const t = TONE_STYLES[item.tone];
          return (
            <div
              key={item.label}
              className={`rounded-xl border p-4 transition ${t.hoverBorder}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">
                <item.icon className={`h-4 w-4 ${t.iconColor}`} aria-hidden />
                {item.label}
                {item.live ? (
                  <span className="relative ml-auto flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-snug text-zinc-400">{item.caption}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
