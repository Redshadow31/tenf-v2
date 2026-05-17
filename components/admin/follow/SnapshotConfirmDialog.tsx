"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

/**
 * Mini-dialog local de confirmation avant lancement d'un snapshot follow.
 * Pas de logique métier : se contente d'appeler `onConfirm` / `onCancel`.
 * - Escape ferme tant que `loading=false`.
 * - Le clic sur le backdrop ferme tant que `loading=false`.
 * - Pendant `loading`, les contrôles sont désactivés pour empêcher les doubles
 *   clics ; le bouton primaire affiche un spinner.
 */
export default function SnapshotConfirmDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Focus initial sur "Annuler" — moins risqué qu'un focus sur "Lancer".
    const t = window.setTimeout(() => cancelRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={() => {
          if (!loading) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-confirm-title"
        aria-describedby="snapshot-confirm-desc"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-indigo-400/30 bg-[#0c0d14] text-white shadow-[0_24px_60px_rgba(2,6,23,0.65)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-br from-indigo-950/40 to-[#0c0d14] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-500/15">
              <AlertTriangle className="h-4 w-4 text-indigo-100" aria-hidden />
            </div>
            <div>
              <h3 id="snapshot-confirm-title" className="text-base font-semibold">
                Lancer un nouveau snapshot&nbsp;?
              </h3>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-indigo-200/80">
                Action sensible · à confirmer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!loading) onCancel();
            }}
            disabled={loading}
            className="shrink-0 rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fermer la fenêtre de confirmation"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p id="snapshot-confirm-desc" className="px-5 py-4 text-sm leading-relaxed text-slate-300">
          Cette action recalcule les données de suivi Twitch pour toute la base concernée. Elle peut prendre quelques
          minutes. Évite de relancer un snapshot tant qu&apos;un calcul est en cours.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-indigo-50 transition hover:bg-indigo-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Lancement…
              </>
            ) : (
              <>Lancer le snapshot</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
