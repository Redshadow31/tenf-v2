import { ShieldOff, XCircle } from "lucide-react";
import { whatTenfRefuses } from "../_data";
import SectionHeader from "./SectionHeader";

export default function WhatTenfRefuses() {
  return (
    <section id="refuse" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader
        kicker="5. Ce que TENF refuse"
        title="Sans négociation"
        lead="Pour rester droits avec nos membres et avec nos partenaires, on est clairs sur ce qu'on refuse."
      />
      <article
        className="about-reveal rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: "color-mix(in srgb, #ef4444 30%, var(--color-border))",
          backgroundColor: "color-mix(in srgb, #ef4444 5%, var(--color-card))",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: "color-mix(in srgb, #ef4444 18%, transparent)" }}
            aria-hidden
          >
            <ShieldOff className="h-5 w-5" style={{ color: "#ef4444" }} aria-hidden />
          </span>
          <h3 className="text-base font-bold sm:text-lg">7 motifs de refus, clairement assumés</h3>
        </div>
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {whatTenfRefuses.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-3 rounded-xl border p-4"
              style={{
                borderColor: "color-mix(in srgb, #ef4444 22%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)",
              }}
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#ef4444" }} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-bold sm:text-base" style={{ color: "var(--color-text)" }}>
                  {item.title}
                </p>
                <p className="home-muted mt-1 text-sm leading-relaxed">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
