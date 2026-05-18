"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, MessageCircle, Send } from "lucide-react";
import { contactSection, PARTENARIATS_ACCENT } from "../_data";
import { PARTNERSHIP_MODAL_EVENT } from "./partnershipModalEvents";
import SectionHeader from "./SectionHeader";
import PartnershipModal from "./PartnershipModal";

/**
 * Bloc "Proposer un partenariat" en bas de la page /partenariats.
 *
 * Le bouton principal n'envoie plus vers /contact : il ouvre la modale
 * plein écran à 3 étapes (règlement → formulaire → confirmation).
 * Le bouton secondaire reste l'invite Discord, utile pour les discussions
 * informelles avant dépôt d'une demande officielle.
 *
 * Le composant écoute aussi l'événement custom
 * `tenf:open-partnership-modal` pour permettre à d'autres CTA de la
 * page (Hero, FAQ, etc.) de déclencher la même modale sans avoir à
 * remonter l'état dans un wrapper commun.
 */
export default function ContactCta() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener(PARTNERSHIP_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(PARTNERSHIP_MODAL_EVENT, handleOpen);
  }, []);

  return (
    <section id="proposer" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader kicker={contactSection.kicker} title={contactSection.title} icon={Send} accent={PARTENARIATS_ACCENT} panel />
      <article
        className="about-reveal relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-8"
        style={{
          borderColor: `${PARTENARIATS_ACCENT}40`,
          background: `linear-gradient(135deg, ${PARTENARIATS_ACCENT}10 0%, color-mix(in srgb, var(--color-card) 96%, transparent) 100%)`,
          boxShadow: `0 20px 48px ${PARTENARIATS_ACCENT}12`,
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${PARTENARIATS_ACCENT}88, transparent)` }}
          aria-hidden
        />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
                aria-hidden
              >
                <MessageCircle className="h-5 w-5" style={{ color: "var(--color-primary)" }} aria-hidden />
              </span>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Demande de partenariat — formulaire dédié
              </p>
            </div>
            <p className="text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text)" }}>
              Présente-nous ton projet via le formulaire officiel : règlement, informations
              générales, cadre et engagements. On lit tout, on répond honnêtement — oui, non,
              ou « pas maintenant ».
            </p>
            <p className="home-muted text-sm leading-relaxed">{contactSection.helper}</p>
            <p
              className="text-xs"
              style={{ color: "var(--color-muted)" }}
            >
              Les informations envoyées seront utilisées uniquement pour étudier votre
              demande de partenariat avec TENF.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              Proposer un partenariat <ArrowRight size={16} aria-hidden />
            </button>
            <a
              href={contactSection.secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold"
            >
              {contactSection.secondary.label} <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        </div>
      </article>

      <PartnershipModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
