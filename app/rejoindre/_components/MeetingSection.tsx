import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { meetingPoints } from "../_data";

/**
 * Bloc "réunion d'intégration" — explique le format, l'ambiance,
 * et redirige vers le module d'inscription existant (/integration).
 */
export default function MeetingSection() {
  return (
    <section
      id="rejoindre-reunion"
      className="about-fade-up home-testimonials-shell scroll-mt-28 relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-8"
    >
      <div
        className="home-testimonials-glow pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative space-y-5 sm:space-y-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
              L&apos;étape clé
            </p>
            <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-4xl">
              La réunion d&apos;intégration
            </h2>
            <p className="home-muted text-sm leading-relaxed sm:text-base">
              Une vraie discussion avec un staff TENF : pas un test, pas un entretien. C&apos;est simplement un moment pour comprendre TENF, poser tes questions et voir si la communauté te correspond.
            </p>
          </div>
          <Link
            href="/integration"
            className="home-btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
          >
            Réserver un créneau
            <ArrowRight size={16} className="shrink-0" aria-hidden />
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {meetingPoints.map((item) => (
            <li key={item.label}>
              <article
                className="about-reveal h-full rounded-2xl border p-4 sm:p-5"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-card) 60%, transparent)",
                  borderColor: "color-mix(in srgb, var(--color-border) 70%, transparent)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
                  >
                    <item.icon
                      className="h-4 w-4"
                      strokeWidth={2.25}
                      style={{ color: "var(--color-primary)" }}
                      aria-hidden
                    />
                  </span>
                  <div>
                    <p className="home-kicker text-[11px] font-bold uppercase tracking-[0.14em]">
                      {item.label}
                    </p>
                    <p
                      className="mt-1 text-sm leading-relaxed sm:text-base"
                      style={{ color: "var(--color-text)" }}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
          <Link href="/rejoindre/guide-integration" className="home-link-accent text-sm font-semibold">
            Voir le guide d&apos;intégration détaillé →
          </Link>
          <Link href="/rejoindre/faq" className="home-link-muted text-sm font-semibold">
            Lire la FAQ complète →
          </Link>
        </div>
      </div>
    </section>
  );
}
