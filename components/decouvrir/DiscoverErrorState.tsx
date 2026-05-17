"use client";

import { AlertCircle } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

type DiscoverErrorStateProps = {
  message: string;
  refreshToken: string;
  onRetry: () => void;
};

export default function DiscoverErrorState({ message, refreshToken, onRetry }: DiscoverErrorStateProps) {
  const c = DISCOVER_COPY.error;

  return (
    <div
      className="rounded-2xl border border-red-500/40 bg-red-950/45 px-4 py-4 text-red-50 sm:px-5"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden />
          <div className="min-w-0">
            <p className="font-bold text-white">{c.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-red-100/90">{c.body}</p>
            <p className="mt-2 break-words text-sm text-red-200/95">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
        >
          {c.retry}
        </button>
      </div>
      <details className="mt-4 text-left text-xs text-red-200/70">
        <summary className="cursor-pointer font-semibold text-red-200/90 hover:text-red-100">{c.detailsLabel}</summary>
        <p className="mt-2 font-mono break-all">
          {c.selectionRef}: {refreshToken}
        </p>
      </details>
    </div>
  );
}
