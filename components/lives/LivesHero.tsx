import type { CSSProperties } from "react";
import { CalendarDays, Dice5, HeartHandshake, Radio, Sparkles, Tv2 } from "lucide-react";

type LivesHeroProps = {
  displayedLivesCount: number;
  onPickRandomLive: () => void;
  randomDisabled: boolean;
  eventsHref: string;
  spotlightDisplayName?: string | null;
  spotlightText?: string | null;
};

export default function LivesHero({
  displayedLivesCount,
  onPickRandomLive,
  randomDisabled,
  eventsHref,
  spotlightDisplayName,
  spotlightText,
}: LivesHeroProps) {
  const titleStyle: CSSProperties = {
    color: "var(--color-text)",
    fontSize: "clamp(1.9rem, 1.3rem + 2.2vw, 3.4rem)",
    lineHeight: 1.05,
  };
  const subtitleStyle: CSSProperties = {
    color: "var(--color-text-secondary)",
    fontSize: "clamp(0.95rem, 0.9rem + 0.2vw, 1.1rem)",
  };

  return (
    <section
      className="relative overflow-hidden rounded-3xl border"
      style={{
        padding: "clamp(1.25rem, 2.5vw, 2.75rem)",
        borderColor: "rgba(145, 70, 255, 0.3)",
        background:
          "linear-gradient(120deg, rgba(21, 21, 26, 0.97) 0%, rgba(36, 21, 54, 0.9) 60%, rgba(30, 18, 35, 0.92) 100%)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full opacity-60 blur-3xl"
        style={{ background: "rgba(167,139,250,0.35)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-[-10%] h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "rgba(236,72,153,0.18)" }}
        aria-hidden
      />

      <div className="relative grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8 xl:gap-10">
        <div className="space-y-4 lg:space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ borderColor: "rgba(196,161,255,0.45)", color: "#e9d5ff" }}
            >
              <Radio className="h-3.5 w-3.5 text-red-300" aria-hidden />
              En direct sur Twitch
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
              Soutien communautaire TENF
            </span>
          </div>

          <h1 className="font-extrabold tracking-tight" style={titleStyle}>
            Les lives TENF{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
              en direct maintenant
            </span>
          </h1>
          <p className="max-w-2xl leading-relaxed" style={subtitleStyle}>
            Soutiens les créatrices et créateurs de la communauté actuellement en stream. Ici, peu importe la taille
            du live : <strong className="font-semibold text-white">chaque présence compte</strong> et chaque message
            réchauffe une soirée.
          </p>
          <p className="text-xs leading-relaxed text-violet-200/75 sm:text-sm">
            Astuce : utilise le tirage au sort pour découvrir une chaîne que tu n'aurais jamais ouverte, ou file en
            bas pour filtrer par jeu ou rôle.
          </p>

          {spotlightDisplayName && spotlightText ? (
            <div
              className="max-w-2xl rounded-xl border px-4 py-3"
              style={{
                borderColor: "rgba(251, 191, 36, 0.45)",
                background: "linear-gradient(120deg, rgba(251,191,36,0.14), rgba(245,158,11,0.06))",
              }}
            >
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Mise en avant Spotlight
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-100">{spotlightDisplayName}</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-50/90">{spotlightText}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPickRandomLive}
              disabled={randomDisabled}
              aria-label="Découvrir un live au hasard parmi les filtres actuels"
              className="group inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: "0 14px 34px rgba(124,58,237,0.42)",
              }}
            >
              <Dice5 className="h-4 w-4 transition group-hover:rotate-12" aria-hidden />
              Découvrir un live au hasard
            </button>
            <a
              href={eventsHref}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:border-violet-400/35 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              <CalendarDays className="h-4 w-4 text-violet-300" aria-hidden />
              Voir les événements
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <HeroStatBox
            icon={Radio}
            label="Streamers en live"
            value={String(displayedLivesCount)}
            caption="Détecté·es en direct à l'instant"
            tone="red"
            live
          />
          <HeroStatBox
            icon={Tv2}
            label="Catégories variées"
            value="Multi-univers"
            caption="Jeux, IRL, créatif, just chatting…"
            tone="violet"
          />
          <HeroStatBox
            icon={HeartHandshake}
            label="Communauté"
            value="Présence quotidienne"
            caption="On se retrouve sur Discord et Twitch"
            tone="emerald"
          />
        </div>
      </div>
    </section>
  );
}

type HeroStatBoxProps = {
  icon: typeof Radio;
  label: string;
  value: string;
  caption: string;
  tone: "red" | "violet" | "emerald";
  live?: boolean;
};

function HeroStatBox({ icon: Icon, label, value, caption, tone, live }: HeroStatBoxProps) {
  const TONE_MAP: Record<HeroStatBoxProps["tone"], { iconColor: string; hoverBorder: string }> = {
    red: { iconColor: "text-red-400", hoverBorder: "hover:border-red-400/25" },
    violet: { iconColor: "text-violet-400", hoverBorder: "hover:border-violet-400/25" },
    emerald: { iconColor: "text-emerald-300", hoverBorder: "hover:border-emerald-300/25" },
  };
  const t = TONE_MAP[tone];
  return (
    <div
      className={`rounded-xl border p-4 transition ${t.hoverBorder}`}
      style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
        <Icon className={`h-4 w-4 ${t.iconColor}`} aria-hidden />
        {label}
        {live ? (
          <span className="relative ml-auto flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-snug text-zinc-400">{caption}</p>
    </div>
  );
}
