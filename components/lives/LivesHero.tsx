type LivesHeroProps = {
  displayedLivesCount: number;
  onPickRandomLive: () => void;
  randomDisabled: boolean;
  eventsHref: string;
};

export default function LivesHero({
  displayedLivesCount,
  onPickRandomLive,
  randomDisabled,
  eventsHref,
}: LivesHeroProps) {
  return (
    <section
      className="rounded-2xl border p-6 md:p-8 lg:p-10"
      style={{
        borderColor: "rgba(145, 70, 255, 0.3)",
        background: "linear-gradient(120deg, rgba(21, 21, 26, 0.97) 0%, rgba(36, 21, 54, 0.9) 60%, rgba(30, 18, 35, 0.92) 100%)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 lg:space-y-5">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: "var(--color-text)" }}>
            Lives en direct
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed md:text-[1.05rem]" style={{ color: "var(--color-text-secondary)" }}>
            Soutiens les createurs de la communaute actuellement en live.
            <br />
            Peu importe la taille du stream : sur TENF, chaque presence compte.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPickRandomLive}
              disabled={randomDisabled}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 8px 22px rgba(145,70,255,0.28)" }}
            >
              🎲 Decouvrir un live au hasard
            </button>
            <a
              href={eventsHref}
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              📅 Voir les evenements
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Streamers en live
            </p>
            <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              {displayedLivesCount}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Jeux varies
            </p>
            <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Multi categories
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Communaute active
            </p>
            <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Presence quotidienne
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
