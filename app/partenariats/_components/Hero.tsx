import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { hero, PARTENARIATS_ACCENT } from "../_data";
import HeroPartnershipButton from "./HeroPartnershipButton";

const QUICK_ANCHORS = [
  { href: "#pourquoi", label: "Pourquoi" },
  { href: "#apporter", label: "Ce qu'on apporte" },
  { href: "#upa-events", label: "UPA × Ligue" },
  { href: "#partenaires", label: "Partenaires" },
  { href: "#proposer", label: "Proposer" },
] as const;

export default function Hero() {
  return (
    <section
      className="about-fade-up home-hero relative overflow-hidden rounded-3xl border scroll-mt-28"
      style={{
        padding: "clamp(1.25rem, 0.75rem + 2.2vw, 4rem)",
        borderColor: `${PARTENARIATS_ACCENT}33`,
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--color-card) 92%, transparent) 0%, color-mix(in srgb, var(--color-bg) 98%, transparent) 100%)",
      }}
    >
      <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${PARTENARIATS_ACCENT}28` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/45 to-transparent"
        aria-hidden
      />

      <div
        className="relative flex flex-col"
        style={{ rowGap: "clamp(1rem, 0.6rem + 1vw, 1.75rem)" }}
      >
        <div
          className="home-chip inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 font-bold uppercase tracking-[0.14em]"
          style={{
            fontSize: "clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)",
            borderColor: `${PARTENARIATS_ACCENT}44`,
            backgroundColor: `${PARTENARIATS_ACCENT}12`,
            color: PARTENARIATS_ACCENT,
          }}
        >
          <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
          {hero.chip}
        </div>

        <h1
          className="home-hero-title font-extrabold leading-[1.05] tracking-tight"
          style={{
            fontSize: "clamp(1.75rem, 1.1rem + 3.2vw, 5rem)",
            maxWidth: "min(56rem, 95%)",
          }}
        >
          {hero.title}
        </h1>

        <p
          className="home-hero-lead font-semibold leading-relaxed"
          style={{
            fontSize: "clamp(1rem, 0.85rem + 0.6vw, 1.5rem)",
            maxWidth: "min(48rem, 100%)",
          }}
        >
          {hero.lead}
        </p>

        <p
          className="home-hero-body leading-relaxed"
          style={{
            fontSize: "clamp(0.875rem, 0.78rem + 0.3vw, 1.125rem)",
            maxWidth: "min(52rem, 100%)",
          }}
        >
          {hero.body}
        </p>

        <nav
          className="flex flex-wrap gap-2 pt-1"
          aria-label="Sections de la page partenariats"
        >
          {QUICK_ANCHORS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5"
              style={{
                borderColor: `${PARTENARIATS_ACCENT}35`,
                backgroundColor: "color-mix(in srgb, var(--color-card) 75%, transparent)",
                color: "var(--color-text-secondary)",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <HeroPartnershipButton label={hero.primaryCta.label} />
          <Link
            href={hero.secondaryCta.href}
            className="home-btn-secondary inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold"
          >
            {hero.secondaryCta.label} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
