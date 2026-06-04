import type { CSSProperties } from "react";
import { CalendarDays, Dice5, HeartHandshake, Radio, Sparkles, Tv2 } from "lucide-react";
import theme from "@/components/lives/lives-theme.module.css";

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
    <section className={`${theme.panel} ${theme.panelHero} ${theme.panelPaddingLg}`}>
      <div className={theme.panelOrbViolet} aria-hidden />
      <div className={theme.panelOrbRed} aria-hidden />

      <div className={`${theme.panelInner} grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8 xl:gap-10`}>
        <div className="space-y-4 lg:space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={theme.badgeViolet}>
              <Radio className={`h-3.5 w-3.5 ${theme.iconRed}`} aria-hidden />
              En direct sur Twitch
            </span>
            <span className={theme.badgeNeutral}>
              <HeartHandshake className={`h-3.5 w-3.5 ${theme.iconEmerald}`} aria-hidden />
              Soutien communautaire TENF
            </span>
          </div>

          <h1 className="font-extrabold tracking-tight" style={titleStyle}>
            Les lives TENF{" "}
            <span className={theme.titleGradient}>en direct maintenant</span>
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
            <div className={`${theme.glassInset} ${theme.glassInsetAmber} p-4`}>
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
              className={`${theme.btnPrimary} min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300`}
            >
              <Dice5 className="h-4 w-4" aria-hidden />
              Découvrir un live au hasard
            </button>
            <a
              href={eventsHref}
              className={`${theme.btnSecondary} min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300`}
            >
              <CalendarDays className={`h-4 w-4 ${theme.iconViolet}`} aria-hidden />
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

const HERO_TONE_CARD: Record<HeroStatBoxProps["tone"], string> = {
  red: theme.glassCardRed,
  violet: theme.glassCardViolet,
  emerald: theme.glassCardEmerald,
};

const HERO_TONE_ICON: Record<HeroStatBoxProps["tone"], string> = {
  red: theme.iconRed,
  violet: theme.iconViolet,
  emerald: theme.iconEmerald,
};

function HeroStatBox({ icon: Icon, label, value, caption, tone, live }: HeroStatBoxProps) {
  return (
    <div className={`${theme.glassCard} ${HERO_TONE_CARD[tone]} p-4`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
        <Icon className={`h-4 w-4 ${HERO_TONE_ICON[tone]}`} aria-hidden />
        {label}
        {live ? (
          <span className="relative ml-auto flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs leading-snug text-zinc-400">{caption}</p>
    </div>
  );
}
