import type { FonctionnementFaqItem } from "@/lib/fonctionnement/faq-data";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

type Props = {
  items: FonctionnementFaqItem[];
  variant: "cards" | "accordion";
  title?: string;
};

export function FonctionnementFaq({ items, variant, title = "Questions Fréquentes" }: Props) {
  if (variant === "accordion") {
    return (
      <section className="mb-4" aria-labelledby="faq-fonctionnement-heading">
        <h2 id="faq-fonctionnement-heading" className={`${styles.fnSectionTitle} mb-8 text-center`}>
          {title}
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <details key={item.question} className={`group ${styles.fnFaqItem}`}>
              <summary className={styles.fnFaqSummary}>
                <span>{item.question}</span>
                <span className={styles.fnFaqChevron} aria-hidden>
                  ▼
                </span>
              </summary>
              <div className={styles.fnFaqAnswer}>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <h2 className={`${styles.fnSectionTitle} mb-8 text-center`}>{title}</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.question}
            className={`${styles.fnCard} ${styles.fnCardPad} ${styles.fnCardInteractive} integration-card`}
          >
            <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {item.question}
            </h3>
            <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
