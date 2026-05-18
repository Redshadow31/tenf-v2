"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import ContactForm from "../ContactForm";
import { CONTACT_ACCENT, contactHero } from "../_data";

export type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  initialTopic?: string | null;
};

export default function ContactModal({ open, onClose, initialTopic }: ContactModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    setFormKey((k) => k + 1);
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open, initialTopic]);

  if (!open || !mounted) return null;

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="pmodal-overlay fixed inset-0 z-[100] flex items-stretch justify-center"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-bg) 55%, rgba(8,8,16,0.75))",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        ref={panelRef}
        className="pmodal-panel relative flex h-full w-full flex-col overflow-y-auto"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
      >
        <div className="pmodal-aurora" aria-hidden />

        <header
          className="sticky top-0 z-10 border-b px-4 pb-3 pt-3 sm:px-6"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
            backdropFilter: "blur(12px)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${CONTACT_ACCENT}22`, color: CONTACT_ACCENT }}
              >
                <MessageCircle size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p id="contact-modal-title" className="truncate text-sm font-semibold sm:text-base">
                  {contactHero.title}
                </p>
                <p className="truncate text-xs" style={{ color: "var(--color-muted)" }}>
                  Formulaire sécurisé · réponse sous 48 à 96 h
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer le formulaire de contact"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition hover:scale-105"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </header>

        <div className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="pmodal-step">
            <p className="home-muted mb-5 text-sm leading-relaxed sm:text-base">
              {contactHero.lead} Ne partage jamais de mot de passe ni de donnée sensible.
            </p>
            <ContactForm key={formKey} embedded initialTopic={initialTopic ?? undefined} />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}