"use client";

import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { AlertTriangle, ShieldAlert, Sparkles, X, type LucideIcon } from "lucide-react";

export type AdminConfirmModalTone = "danger" | "warning" | "neutral";

export type AdminConfirmModalInput = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  required?: boolean;
  helperText?: ReactNode;
  maxLength?: number;
  /** Erreur de validation (ex. champ vide alors que required). */
  error?: string | null;
};

export type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  tone?: AdminConfirmModalTone;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  input?: AdminConfirmModalInput;
  /** Désactive le bouton Confirmer (en plus de loading). */
  disableConfirm?: boolean;
};

const TONE_STYLES: Record<
  AdminConfirmModalTone,
  {
    accent: string;
    ring: string;
    border: string;
    iconBg: string;
    iconColor: string;
    confirmBtn: string;
    Icon: LucideIcon;
  }
> = {
  danger: {
    accent: "from-rose-500/15 via-zinc-950 to-zinc-950",
    ring: "ring-rose-500/20",
    border: "border-rose-500/35",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-300",
    confirmBtn:
      "border-rose-500/45 bg-rose-500/25 text-rose-50 hover:bg-rose-500/35 focus-visible:ring-rose-400/50",
    Icon: ShieldAlert,
  },
  warning: {
    accent: "from-amber-500/15 via-zinc-950 to-zinc-950",
    ring: "ring-amber-500/20",
    border: "border-amber-500/35",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-300",
    confirmBtn:
      "border-amber-500/45 bg-amber-500/25 text-amber-50 hover:bg-amber-500/35 focus-visible:ring-amber-400/50",
    Icon: AlertTriangle,
  },
  neutral: {
    accent: "from-violet-500/15 via-zinc-950 to-zinc-950",
    ring: "ring-violet-500/20",
    border: "border-violet-500/35",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-300",
    confirmBtn:
      "border-violet-500/45 bg-violet-500/25 text-violet-50 hover:bg-violet-500/35 focus-visible:ring-violet-400/50",
    Icon: Sparkles,
  },
};

const FOCUS_RING_BASE =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

/**
 * Modale de confirmation admin réutilisable.
 *
 * - Sombre, premium, ton danger/warning/neutral.
 * - role=dialog, aria-modal, aria-labelledby (titre obligatoire) et
 *   aria-describedby si une description est fournie.
 * - Escape ferme tant que `loading` est faux.
 * - Click backdrop ferme tant que `loading` est faux.
 * - Focus auto sur l'input texte si présent, sinon sur le bouton Confirmer.
 * - Verrouille le scroll du `<body>` pendant l'ouverture.
 */
export default function AdminConfirmModal({
  open,
  title,
  description,
  tone = "neutral",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  onCancel,
  onConfirm,
  input,
  disableConfirm = false,
}: AdminConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const inputId = useId();
  const errorId = useId();

  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const styles = TONE_STYLES[tone];
  const ToneIcon = styles.Icon;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      if (input && inputRef.current) {
        inputRef.current.focus();
        if ("select" in inputRef.current) inputRef.current.select();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 10);
    return () => window.clearTimeout(id);
  }, [open, input]);

  if (!open) return null;

  const hasDescription = description != null;
  const hasError = Boolean(input?.error);

  function handleBackdropMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (loading) return;
    if (e.target === e.currentTarget) onCancel();
  }

  function handleConfirmKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    // Ferme le focus dans la modale (focus trap léger pour Tab).
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      onKeyDown={handleConfirmKey}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasDescription ? descId : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.accent} shadow-2xl ring-1 ${styles.ring}`}
      >
        <div className="flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}
            aria-hidden
          >
            <ToneIcon className={`h-5 w-5 ${styles.iconColor}`} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-white sm:text-lg">
              {title}
            </h2>
            {hasDescription ? (
              <div id={descId} className="mt-1 text-sm leading-relaxed text-zinc-300">
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => !loading && onCancel()}
            disabled={loading}
            className={`shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40 ${FOCUS_RING_BASE} focus-visible:ring-violet-400/50`}
            aria-label="Fermer la fenêtre de confirmation"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {input ? (
          <div className="mt-4 px-5 sm:px-6">
            <label
              htmlFor={inputId}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400"
            >
              {input.label}
              {input.required ? <span className="ml-1 text-rose-300">*</span> : null}
            </label>
            {input.multiline ? (
              <textarea
                id={inputId}
                ref={(el) => {
                  inputRef.current = el;
                }}
                value={input.value}
                onChange={(e) => input.onChange(e.target.value)}
                placeholder={input.placeholder}
                rows={3}
                maxLength={input.maxLength}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? errorId : undefined}
                disabled={loading}
                className={`w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-zinc-500 transition focus:border-violet-400/60 ${FOCUS_RING_BASE} focus-visible:ring-violet-400/40 disabled:opacity-60`}
              />
            ) : (
              <input
                id={inputId}
                ref={(el) => {
                  inputRef.current = el;
                }}
                value={input.value}
                onChange={(e) => input.onChange(e.target.value)}
                placeholder={input.placeholder}
                maxLength={input.maxLength}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? errorId : undefined}
                disabled={loading}
                className={`w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-violet-400/60 ${FOCUS_RING_BASE} focus-visible:ring-violet-400/40 disabled:opacity-60`}
              />
            )}
            {hasError ? (
              <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-300" role="alert">
                {input.error}
              </p>
            ) : input.helperText ? (
              <p className="mt-1.5 text-xs text-zinc-500">{input.helperText}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] bg-black/30 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => !loading && onCancel()}
            disabled={loading}
            className={`rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.1] disabled:opacity-50 ${FOCUS_RING_BASE} focus-visible:ring-violet-400/50`}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading || disableConfirm}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles.confirmBtn} ${FOCUS_RING_BASE}`}
          >
            {loading ? (
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
                aria-hidden
              />
            ) : null}
            {loading ? "Application…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
