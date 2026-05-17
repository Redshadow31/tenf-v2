import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { upaSpotlight } from "../_data";

/**
 * Bloc « phare » du partenariat UPA × Ligue contre le cancer.
 * Visuellement plus fort que les autres sections : large carte avec orbes,
 * 5 mini-cartes stats, deux CTA (bilan interne + site officiel UPA).
 */
export default function UpaSpotlight() {
  return (
    <section
      id="upa-events"
      className="about-fade-up home-section scroll-mt-28 space-y-5"
      aria-labelledby="upa-events-title"
    >
      <div
        className="relative overflow-hidden rounded-3xl border"
        style={{
          borderColor: "color-mix(in srgb, var(--color-primary) 38%, var(--color-border))",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, var(--color-card)) 0%, var(--color-card) 60%)",
          padding: "clamp(1.25rem, 0.75rem + 1.8vw, 3rem)",
        }}
      >
        {/* Orbes décoratifs */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, #ef4444 18%, transparent)" }}
          aria-hidden
        />

        <div className="relative space-y-6">
          {/* Header du bloc */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 24%, transparent)" }}
              aria-hidden
            >
              <Sparkles className="h-5 w-5" style={{ color: "var(--color-primary)" }} aria-hidden />
            </span>
            <div className="min-w-0">
              <p
                className="home-kicker font-bold uppercase tracking-[0.18em]"
                style={{ fontSize: "clamp(0.6875rem, 0.62rem + 0.2vw, 0.875rem)" }}
              >
                {upaSpotlight.kicker}
              </p>
              <h2
                id="upa-events-title"
                className="home-section-title font-extrabold leading-tight tracking-tight"
                style={{ fontSize: "clamp(1.5rem, 1.1rem + 1.8vw, 3rem)" }}
              >
                {upaSpotlight.title}
              </h2>
            </div>
          </div>

          <p
            className="font-semibold leading-relaxed"
            style={{
              color: "var(--color-text)",
              fontSize: "clamp(1rem, 0.85rem + 0.5vw, 1.375rem)",
              maxWidth: "min(56rem, 100%)",
            }}
          >
            {upaSpotlight.lead}
          </p>

          <div
            className="space-y-3 leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "clamp(0.9375rem, 0.85rem + 0.3vw, 1.125rem)",
              maxWidth: "min(60rem, 100%)",
            }}
          >
            {upaSpotlight.body.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Mini-cartes stats */}
          <ul
            className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-5"
            aria-label="Chiffres clés de l'édition TENF × UPA"
          >
            {upaSpotlight.stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <li
                  key={stat.label}
                  className="rounded-2xl border p-4 sm:p-5"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-primary) 24%, var(--color-border))",
                    backgroundColor: "color-mix(in srgb, var(--color-card) 80%, transparent)",
                  }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} strokeWidth={2.25} aria-hidden />
                  </span>
                  <p
                    className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-extrabold leading-tight sm:text-xl" style={{ color: "var(--color-text)" }}>
                    {stat.value}
                  </p>
                  <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">{stat.detail}</p>
                </li>
              );
            })}
          </ul>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={upaSpotlight.ctas.detail.href}
              className="home-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            >
              {upaSpotlight.ctas.detail.label} <ArrowRight size={16} aria-hidden />
            </Link>
            <a
              href={upaSpotlight.ctas.upa.href}
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn-secondary inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold"
            >
              {upaSpotlight.ctas.upa.label} <ExternalLink size={14} aria-hidden />
            </a>
          </div>

          <p className="home-muted text-xs leading-relaxed sm:text-sm">
            Sources : page bilan publique <Link href="/partenaire-tenf" className="home-link-accent font-semibold">/partenaire-tenf</Link>{" "}
            · données officielles de la première édition TENF × UPA (avril 2026).
          </p>
        </div>
      </div>
    </section>
  );
}
