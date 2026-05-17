import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { steps } from "../_data";

/**
 * 3 étapes pour rejoindre TENF.
 * Cartes avec numéro, icône, description, CTA contextuel.
 */
export default function Steps() {
  return (
    <section
      id="rejoindre-etapes"
      className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7"
    >
      <SectionHeader
        kicker="Comment ça se passe"
        title="3 étapes — c'est tout"
        lead="Un parcours volontairement simple, pour que tu saches exactement quoi faire."
      />
      <ol className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number}>
            <article className="about-reveal home-step-card h-full rounded-2xl border p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                  aria-hidden
                >
                  {step.number}
                </span>
                <step.icon
                  className="h-5 w-5"
                  strokeWidth={2}
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden
                />
              </div>
              <h3 className="mt-4 text-lg font-bold sm:text-xl">{step.title}</h3>
              <p className="home-muted mt-2 text-sm leading-relaxed">{step.description}</p>
              <Link
                href={step.cta.href}
                {...(step.cta.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="home-link-accent mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
              >
                {step.cta.label}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
