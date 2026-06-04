import { ArrowRight, CalendarDays, GraduationCap, HeartHandshake, Users } from "lucide-react";
import theme from "@/components/lives/lives-theme.module.css";

type JoinTENFSectionProps = {
  href: string;
};

const POINTS: Array<{
  icon: typeof Users;
  label: string;
  caption: string;
  tone: string;
}> = [
  {
    icon: HeartHandshake,
    label: "Entraide entre créateurs",
    caption: "On s'invite, on se follow, on s'écoute.",
    tone: theme.glassCardViolet,
  },
  {
    icon: Users,
    label: "Raids et soutien mutuel",
    caption: "Des coups de pouce réguliers, pas à pas.",
    tone: theme.glassCardRed,
  },
  {
    icon: CalendarDays,
    label: "Événements communautaires",
    caption: "Soirées, Spotlight, lives caritatifs.",
    tone: theme.glassCardAmber,
  },
  {
    icon: GraduationCap,
    label: "Formations streaming",
    caption: "Ateliers, retours d'expérience, conseils.",
    tone: theme.glassCardEmerald,
  },
];

export default function JoinTENFSection({ href }: JoinTENFSectionProps) {
  return (
    <section className={`${theme.panel} ${theme.panelPadding}`}>
      <div className={theme.panelOrbViolet} aria-hidden />
      <div className={theme.panelOrbRed} aria-hidden />
      <div className={`${theme.panelInner} relative`}>
        <span className={theme.badgeViolet}>
          <HeartHandshake className={`h-3.5 w-3.5 ${theme.iconViolet}`} aria-hidden />
          La New Family
        </span>
        <h2
          className="mt-3 font-bold tracking-tight"
          style={{ color: "var(--color-text)", fontSize: "clamp(1.35rem, 1.1rem + 0.9vw, 1.85rem)" }}
        >
          Envie de rejoindre la communauté ?
        </h2>
        <p
          className="mt-3 max-w-3xl leading-relaxed"
          style={{ color: "var(--color-text-secondary)", fontSize: "clamp(0.9rem, 0.85rem + 0.15vw, 1rem)" }}
        >
          TENF, c'est avant tout des humains. On accueille les créatrices et créateurs Twitch francophones qui veulent
          un peu de chaleur, de retours sincères et de découvertes — peu importe la taille de la chaîne.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ icon: Icon, label, caption, tone }) => (
            <div
              key={label}
              className={`${theme.glassCard} ${tone} ${theme.glassInsetHover} flex items-start gap-3 p-3`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.glassInset} ${theme.glassInsetViolet}`}
              >
                <Icon className={`h-4 w-4 ${theme.iconViolet}`} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-zinc-400">{caption}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          href={href}
          className={`${theme.btnPrimary} group mt-6 min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300`}
        >
          <HeartHandshake className="h-4 w-4" aria-hidden />
          Rejoindre TENF
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </a>
      </div>
    </section>
  );
}
