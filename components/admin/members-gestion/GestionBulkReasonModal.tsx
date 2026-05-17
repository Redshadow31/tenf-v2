"use client";

import { type ChangeEvent } from "react";

type GestionBulkReasonModalProps = {
  open: boolean;
  draft: string;
  loading: boolean;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Modale de saisie du motif d'audit pour les actions de masse sensibles
 * (changement de rôle / statut en lot). Remplace l'ancien prompt() natif.
 *
 * Composant purement présentationnel : la logique métier (validation, appel API,
 * fermeture, notifications) reste dans GestionClient pour ne pas casser les
 * workflows existants.
 */
export default function GestionBulkReasonModal({
  open,
  draft,
  loading,
  onDraftChange,
  onCancel,
  onConfirm,
}: GestionBulkReasonModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-audit-reason-title"
        className="w-full max-w-lg rounded-2xl border border-[#2f3244] bg-[#141824] p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="bulk-audit-reason-title" className="text-lg font-semibold text-white">
          Motif d&apos;audit (actions de masse)
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Obligatoire pour appliquer un changement de rôle ou de statut à plusieurs membres. Ce texte est transmis à
          l&apos;API comme trace d&apos;audit.
        </p>
        <textarea
          className="mt-4 w-full resize-y rounded-lg border border-[#353a50] bg-[#0f1118] p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-300/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          rows={4}
          value={draft}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDraftChange(e.target.value)}
          placeholder="Ex. : alignement post-validation staff, correction suite import…"
          autoFocus
          aria-label="Motif d'audit pour l'action de masse"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg border border-indigo-400/40 bg-indigo-500/25 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/35 disabled:opacity-50"
          >
            {loading ? "Application…" : "Confirmer et appliquer"}
          </button>
        </div>
      </div>
    </div>
  );
}
