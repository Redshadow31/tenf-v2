import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { finalCtas } from "../_data";

/**
 * Bloc CTA final de la Charte — conclusion + 3 boutons d'action.
 */
export default function FinalCta() {
  return (
    <section id="conclusion" className="about-fade-up scroll-mt-28">
      <div className="home-cta-panel relative overflow-hidden rounded-2xl border p-6 text-center sm:rounded-3xl sm:p-12 lg:p-14">
        <div
          className="home-cta-panel-glow pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        />
        <div className="relative">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
              backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            <Heart className="h-3.5 w-3.5" aria-hidden />
            12. Conclusion
          </div>
          <h2 className="home-cta-title mt-1 text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Un lieu de confiance, d&apos;échange et d&apos;évolution
          </h2>
          <p className="home-muted mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            La New Family est un endroit pour construire, apprendre et avancer avec d&apos;autres créateurs. Si tu es là pour ça, tu es au bon endroit — et on est content·e que tu sois venu·e jusqu&apos;ici.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            {finalCtas.map((cta) => (
              <Link
                key={cta.label}
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                rel={cta.external ? "noopener noreferrer" : undefined}
                className={
                  cta.primary
                    ? "home-btn-primary group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
                    : "home-btn-secondary inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold"
                }
              >
                {cta.label}
                {cta.primary ? (
                  <ArrowRight
                    size={16}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                ) : null}
              </Link>
            ))}
          </div>
          <p className="home-muted mx-auto mt-8 max-w-xl text-xs leading-relaxed sm:text-sm">
            Cette charte vit : elle est révisée régulièrement par le staff. Toute évolution est annoncée dans le{" "}
            <Link
              href="/changelog"
              className="home-link-accent font-semibold underline-offset-2 hover:underline"
            >
              changelog du site
            </Link>{" "}
            et partagée avec la communauté avant publication.
          </p>
        </div>
      </div>
    </section>
  );
}
