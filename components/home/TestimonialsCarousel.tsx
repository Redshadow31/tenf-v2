"use client";

import { useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  pseudo: string;
  message: string;
  hearts: number | null;
  created_at: string;
};

function Hearts({ value }: { value: number | null }) {
  if (value == null) return null;
  const safe = Math.max(0, Math.min(5, value));
  return (
    <span className="text-rose-500" aria-label={`${safe} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < safe ? "#e11d48" : "var(--color-border)" }}>
          ♥
        </span>
      ))}
    </span>
  );
}

export default function TestimonialsCarousel({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const items = useMemo(() => reviews.slice(0, 12), [reviews]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border p-6 text-center"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <p style={{ color: "var(--color-text-secondary)" }}>
          Les premiers témoignages arrivent bientôt.
        </p>
      </div>
    );
  }

  const current = items[index];

  return (
    <div
      className="rounded-2xl border p-6 sm:p-8"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text)" }}>
            &quot;{current.message}&quot;
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
              {current.pseudo}
            </span>
            <Hearts value={current.hearts} />
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {items.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`Afficher le témoignage ${itemIndex + 1}`}
                className="h-2.5 w-2.5 rounded-full transition-all"
                style={{
                  backgroundColor:
                    itemIndex === index
                      ? "var(--color-primary)"
                      : "color-mix(in srgb, var(--color-border) 80%, transparent)",
                  transform: itemIndex === index ? "scale(1.1)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="rounded-lg border px-3 py-1 text-sm font-medium transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % items.length)}
              className="rounded-lg border px-3 py-1 text-sm font-medium transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
