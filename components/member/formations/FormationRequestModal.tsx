"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, Loader2, MessageSquarePlus, Sparkles, X } from "lucide-react";

export type CatalogSuggestion = {
  title: string;
  sourceEventId: string | null;
};

type FormationRequestModalProps = {
  open: boolean;
  onClose: () => void;
  /** Formations passées (titre + dernier event id pour liaison admin) */
  catalogSuggestions: CatalogSuggestion[];
  onSuccess?: () => void;
};

const MAX_TITLE = 200;
const MAX_MESSAGE = 2000;

export default function FormationRequestModal({ open, onClose, catalogSuggestions, onSuccess }: FormationRequestModalProps) {
  const dialogHeadingId = useId();
  const titleFieldId = useId();
  const messageFieldId = useId();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkedTitle, setLinkedTitle] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setMessage("");
      setLinkedTitle("");
      setSubmitting(false);
      setError("");
      return;
    }
    setError("");
  }, [open]);

  if (!open) return null;

  const selectedSuggestion = catalogSuggestions.find((s) => s.title === linkedTitle) || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formationTitle = (linkedTitle || title).replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
    if (!formationTitle) {
      setError("Indique un titre de formation ou choisis une entrée du catalogue.");
      return;
    }
    const memberMessage = message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE);

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/members/me/formation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationTitle,
          sourceEventId: selectedSuggestion?.sourceEventId || null,
          message: memberMessage || undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body?.error === "string" ? body.error : "Envoi impossible pour le moment.");
        return;
      }
      if (body?.created === false) {
        setError("Tu as déjà une demande en attente pour ce titre. Modifie le titre ou attends le traitement par l’équipe.");
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setError("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogHeadingId}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div
          className="relative overflow-hidden border-b px-5 py-4"
          style={{ borderColor: "var(--color-border)", background: "linear-gradient(135deg, rgba(139,92,246,0.2), transparent 55%)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200/90">Academy TENF</p>
              <h2 id={dialogHeadingId} className="mt-1 text-lg font-bold leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
                Demander ou proposer une formation
              </h2>
              <p className="mt-2 text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                Ton message est visible côté équipe sur la page admin « Demandes de formation », avec les sessions déjà
                passées quand le titre correspond. Les{" "}
                <span className="font-medium text-violet-200/95">propositions d&apos;événements</span> restent le canal
                pour suggérer un <em>nouvel</em> créneau calendrier.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border p-2 transition hover:bg-white/5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {catalogSuggestions.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Raccrocher à une formation du catalogue (optionnel)
              </label>
              <select
                value={linkedTitle}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setLinkedTitle(v);
                  if (v) setTitle(v);
                }}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
              >
                <option value="">— Sujet entièrement nouveau (titre libre ci-dessous) —</option>
                {catalogSuggestions.map((s) => (
                  <option key={s.title} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor={titleFieldId} className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              <BookOpen className="h-3.5 w-3.5 text-amber-200/90" aria-hidden />
              Titre de la formation
            </label>
            <input
              id={titleFieldId}
              type="text"
              value={title}
              onChange={(ev) => setTitle(ev.target.value.slice(0, MAX_TITLE))}
              disabled={Boolean(linkedTitle)}
              placeholder="Ex. : Montage OBS avancé, monétisation, voix off…"
              className="w-full rounded-xl border px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            />
            {linkedTitle ? (
              <p className="mt-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                Titre figé sur le catalogue — change la sélection au-dessus pour modifier.
              </p>
            ) : (
              <p className="mt-1 text-[11px] tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                {title.trim().length}/{MAX_TITLE}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={messageFieldId} className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              <MessageSquarePlus className="h-3.5 w-3.5 text-violet-200/90" aria-hidden />
              Descriptif / contexte pour l&apos;équipe
            </label>
            <textarea
              id={messageFieldId}
              value={message}
              onChange={(ev) => setMessage(ev.target.value.slice(0, MAX_MESSAGE))}
              rows={6}
              placeholder="Public visé, niveau, créneaux possibles, pourquoi ça t’intéresse…"
              className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm leading-relaxed"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            />
            <p className="mt-1 text-[11px] tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
              {message.trim().length}/{MAX_MESSAGE} — optionnel mais très utile pour prioriser.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed break-words text-pretty text-amber-100/90">
            <Sparkles className="mb-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
            Pour un <strong>nouvel événement</strong> calendrier (créneau, salle Discord, format live), l’équipe peut
            aussi traiter les <span className="font-medium">propositions d&apos;événements</span> côté admin — ce
            formulaire sert surtout à exprimer un <strong>besoin de contenu / thème</strong> de formation.
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-violet-400/45 bg-violet-600/25 px-4 py-2.5 text-sm font-bold text-violet-50 transition hover:bg-violet-600/35 disabled:opacity-60 min-w-[10rem] sm:flex-initial"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
              Envoyer la demande
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
