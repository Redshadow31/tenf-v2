import Link from "next/link";
import SectionHeader from "./SectionHeader";
import { faq } from "../_data";

/**
 * FAQ courte avec <details>/<summary> natifs (compatibles SEO/JS off).
 * Le JSON-LD de la FAQ est généré côté page.tsx pour le rendu serveur.
 */
export default function Faq() {
  return (
    <section
      id="rejoindre-faq"
      className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7"
    >
      <SectionHeader
        kicker="On lève les derniers doutes"
        title="Questions fréquentes"
        lead={
          <>
            Les vraies questions, les vraies réponses. Si la tienne n&apos;est pas là, va voir la{" "}
            <Link href="/rejoindre/faq" className="home-link-accent font-semibold underline-offset-2 hover:underline">
              FAQ complète
            </Link>
            .
          </>
        }
      />

      <div className="space-y-3">
        {faq.map((item, index) => (
          <details
            key={item.q}
            className="about-reveal group rounded-2xl border p-4 transition-all sm:p-5"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            {...(index === 0 ? { open: true } : {})}
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 text-sm font-bold leading-snug sm:text-base">
              <span style={{ color: "var(--color-text)" }}>{item.q}</span>
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform group-open:rotate-45"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                  color: "var(--color-primary)",
                }}
                aria-hidden
              >
                +
              </span>
            </summary>
            <p
              className="mt-3 text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
