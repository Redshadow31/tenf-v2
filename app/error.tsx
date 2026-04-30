"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Garder la trace côté console en mode dev/prod
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-10">
      <section
        className="w-full rounded-2xl border p-6 text-center md:p-8"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
          Oups
        </p>
        <h1 className="mt-3 text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
          Une erreur est survenue
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
          La page n&apos;a pas pu s&apos;afficher correctement. Tu peux réessayer immédiatement.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Réessayer
        </button>
      </section>
    </main>
  );
}
