import { ChevronDown } from "lucide-react";
import { faq } from "../_data";
import SectionHeader from "./SectionHeader";

export default function Faq() {
  return (
    <section id="faq" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader
        kicker="9. FAQ courte"
        title="Les questions qui reviennent"
        lead="Pour aller plus loin, regarde aussi la charte communautaire et la page « À propos »."
      />

      <ul className="space-y-3">
        {faq.map((item, idx) => (
          <li key={item.q}>
            <details
              className="group rounded-2xl border p-4 sm:p-5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <summary
                className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-bold leading-snug sm:text-base"
                style={{ color: "var(--color-text)" }}
              >
                <span className="min-w-0">
                  <span
                    className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                      color: "var(--color-primary)",
                    }}
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  {item.q}
                </span>
                <ChevronDown
                  className="mt-0.5 h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="home-muted mt-3 text-sm leading-relaxed sm:text-base">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
