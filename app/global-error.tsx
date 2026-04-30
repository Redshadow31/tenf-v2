"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="fr">
      <body style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
          <section
            className="w-full rounded-2xl border p-6 text-center md:p-8"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Erreur critique
            </p>
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">Une erreur inattendue est survenue</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
              Recharge la page ou réessaie. Si le problème persiste, partage cette erreur à l&apos;équipe.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Recharger
            </button>
            {error?.digest ? (
              <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Référence: {error.digest}
              </p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
