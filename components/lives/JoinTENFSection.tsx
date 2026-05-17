import { ArrowRight, CalendarDays, GraduationCap, HeartHandshake, Users } from "lucide-react";
import type { CSSProperties } from "react";

type JoinTENFSectionProps = {
  href: string;
};

const POINTS: Array<{ icon: typeof Users; label: string; caption: string }> = [
  {
    icon: HeartHandshake,
    label: "Entraide entre créateurs",
    caption: "On s'invite, on se follow, on s'écoute.",
  },
  {
    icon: Users,
    label: "Raids et soutien mutuel",
    caption: "Des coups de pouce réguliers, pas à pas.",
  },
  {
    icon: CalendarDays,
    label: "Événements communautaires",
    caption: "Soirées, Spotlight, lives caritatifs.",
  },
  {
    icon: GraduationCap,
    label: "Formations streaming",
    caption: "Ateliers, retours d'expérience, conseils.",
  },
];

export default function JoinTENFSection({ href }: JoinTENFSectionProps) {
  const sectionStyle: CSSProperties = {
    padding: "clamp(1.5rem, 2.5vw, 2.5rem)",
    borderColor: "rgba(145, 70, 255, 0.3)",
    background:
      "linear-gradient(120deg, rgba(145,70,255,0.11) 0%, rgba(20,20,28,0.94) 65%, rgba(239,68,68,0.06) 100%)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border" style={sectionStyle}>
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ borderColor: "rgba(196,161,255,0.45)", color: "#e9d5ff" }}
        >
          <HeartHandshake className="h-3.5 w-3.5 text-fuchsia-300" aria-hidden />
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
          {POINTS.map(({ icon: Icon, label, caption }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:-translate-y-0.5 hover:border-violet-400/35"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
                <Icon className="h-4 w-4" aria-hidden />
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
          className="group mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 14px 34px rgba(124,58,237,0.4)" }}
        >
          <HeartHandshake className="h-4 w-4" aria-hidden />
          Rejoindre TENF
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </a>
      </div>
    </section>
  );
}
