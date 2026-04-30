"use client";

import type { TabId } from "@/lib/fonctionnement/guidance";
import { tabGuidance, tabUiMeta } from "@/lib/fonctionnement/guidance";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

export function GuidancePanel({ tabId }: { tabId: TabId }) {
  const guide = tabGuidance[tabId];
  const meta = tabUiMeta[tabId];

  return (
    <section className={`${styles.fnGuidanceSection} about-glow`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            {meta.icon} Synthèse
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {meta.subtitle}
          </p>
        </div>
      </div>
      <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        À retenir
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {guide.tldr.map((item) => (
          <p key={item} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {item.startsWith("Évite") || item.startsWith("Pas") ? "❌ " : "✔ "}
            {item}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {guide.accordions.map((accordion) => {
          const borderColor = accordion.key === "details" ? "rgba(239,68,68,0.3)" : "var(--color-border)";
          const bgColor =
            accordion.key === "bonnes-pratiques"
              ? "rgba(145, 70, 255, 0.1)"
              : accordion.key === "details"
                ? "rgba(239,68,68,0.08)"
                : "var(--color-card)";
          return (
            <article
              key={accordion.key}
              className={`${styles.fnGuidanceAccordion} rounded-xl border p-4 about-glow`}
              style={{ borderColor, backgroundColor: bgColor }}
            >
              <p className="mb-2 font-semibold" style={{ color: "var(--color-text)" }}>
                {accordion.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {accordion.text}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
