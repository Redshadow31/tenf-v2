/**
 * Nom de l'événement custom dispatché sur `window` pour ouvrir la modale
 * de demande de partenariat. ContactCta s'abonne à cet événement ; tous
 * les autres CTA de la page peuvent l'émettre via `openPartnershipModal()`.
 */
export const PARTNERSHIP_MODAL_EVENT = "tenf:open-partnership-modal";

export function openPartnershipModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PARTNERSHIP_MODAL_EVENT));
}
