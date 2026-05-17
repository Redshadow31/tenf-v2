import { whyPartner } from "../_data";
import SectionHeader from "./SectionHeader";

export default function WhyPartner() {
  return (
    <section id="pourquoi" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader
        kicker="2. Pourquoi TENF fait des partenariats"
        title="Collaborer, pas faire de la pub"
        lead="Les partenariats TENF ne sont jamais de la publicité sauvage. Ils servent à créer des collaborations utiles, sincères et encadrées."
      />
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {whyPartner.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="about-reveal home-step-card rounded-2xl border p-5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
                aria-hidden
              >
                <Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} strokeWidth={2.25} aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-bold">{item.title}</h3>
              <p className="home-muted mt-2 text-sm leading-relaxed">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
