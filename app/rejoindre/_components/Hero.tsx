import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hero } from "../_data";

/**
 * Hero principal — pleine largeur, fond avec orbes et grille,
 * deux CTA (Discord + réunions d'intégration).
 */
export default function Hero() {
  return (
    <section
      id="rejoindre-hero"
      className="about-fade-up home-hero relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-10 lg:p-14 scroll-mt-28"
    >
      <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="home-hero-orb home-hero-orb--tr pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl" />
      <div className="home-hero-orb home-hero-orb--bl pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl" />
      <div className="home-hero-shine pointer-events-none absolute -left-1/4 top-0 h-[120%] w-1/2 skew-x-[-18deg] opacity-40" aria-hidden />

      <div className="relative space-y-5 sm:space-y-8">
        <div className="home-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
          {hero.chip}
        </div>

        <h1 className="home-hero-title max-w-5xl text-2xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          {hero.title}
        </h1>
        <p className="home-hero-lead max-w-4xl text-base font-semibold leading-relaxed sm:text-xl">
          {hero.lead}
        </p>
        <p className="home-hero-body max-w-3xl text-sm leading-relaxed sm:text-base">
          {hero.body}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={hero.primary.href}
            target={hero.primary.external ? "_blank" : undefined}
            rel={hero.primary.external ? "noopener noreferrer" : undefined}
            className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
          >
            {hero.primary.label}
            <ArrowRight size={16} className="shrink-0" aria-hidden />
          </Link>
          <Link
            href={hero.secondary.href}
            className="home-btn-secondary inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold"
          >
            {hero.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
