import { whatTenfLooksFor } from "../_data";
import SectionHeader from "./SectionHeader";

export default function WhatTenfLooksFor() {
  return (
    <section id="recherche" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader
        kicker="4. Ce que TENF recherche"
        title="Les types de partenariats qu'on étudie"
        lead="Voilà les directions qu'on regarde en priorité quand une proposition arrive."
      />
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
        {whatTenfLooksFor.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="about-reveal rounded-2xl border p-5"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 24%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-primary) 4%, var(--color-card))",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-tight">{item.title}</h3>
                  <p className="home-muted mt-2 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
