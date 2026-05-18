export const CONTACT_MODAL_EVENT = "tenf:open-contact-modal";

export type ContactModalEventDetail = {
  topic?: string;
};

export function openContactModal(topic?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ContactModalEventDetail>(CONTACT_MODAL_EVENT, {
      detail: topic ? { topic } : undefined,
    })
  );
}
