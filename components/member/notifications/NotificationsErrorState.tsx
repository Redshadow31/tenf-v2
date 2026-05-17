"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

type NotificationsErrorStateProps = {
  onRetry: () => void;
  detail?: string;
};

export default function NotificationsErrorState({ onRetry, detail }: NotificationsErrorStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-5 text-sm sm:px-6 sm:py-6"
      style={{ color: "var(--color-text)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-300/40 bg-rose-500/20 text-rose-100"
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold">Impossible de charger tes notifications</p>
            <p className="mt-1 text-pretty text-sm text-rose-100/85">
              La connexion au service a échoué. Tu peux réessayer dans un instant.
            </p>
            {detail ? (
              <details className="mt-2 text-xs text-rose-100/65">
                <summary className="cursor-pointer">Détail technique</summary>
                <pre className="mt-1 whitespace-pre-wrap break-words">{detail}</pre>
              </details>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-xl border border-rose-300/40 bg-rose-500/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500/30"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Réessayer
        </button>
      </div>
    </section>
  );
}
