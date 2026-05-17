"use client";

import { Megaphone } from "lucide-react";
import type { ReactNode } from "react";
import { openPartnershipModal } from "./partnershipModalEvents";

/**
 * Bouton client du Hero `/partenariats` qui déclenche directement la
 * modale de demande de partenariat (3 étapes) hébergée dans ContactCta,
 * via l'événement custom `tenf:open-partnership-modal`.
 *
 * Le composant scroll également vers la section `#proposer` pour
 * conserver le repère visuel d'ancre tout en ouvrant la modale.
 */
export default function HeroPartnershipButton({ label }: { label: ReactNode }) {
  function handleClick() {
    openPartnershipModal();
    // Petite courtoisie : aligner le scroll sur la section CTA (lien d'ancre
    // historique). On utilise un scroll smooth pour ne pas désorienter.
    if (typeof window !== "undefined") {
      const target = document.getElementById("proposer");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="home-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
      aria-haspopup="dialog"
    >
      <Megaphone size={16} aria-hidden /> {label}
    </button>
  );
}
