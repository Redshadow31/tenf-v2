import { whatTenfOffers } from "../_data";
import SectionHeader from "./SectionHeader";

export default function WhatTenfOffers() {
  return (
    <section id="apporter" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader
        kicker="3. Ce que TENF peut apporter"
        title="Ce qu'on met sur la table"
        lead="Pas des promesses creuses : des moyens concrets que la communauté a déjà mobilisés sur de vrais projets."
      />
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {whatTenfOffers.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="about-reveal home-member-card rounded-2xl border p-5"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
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
