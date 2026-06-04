/**
 * Validation partagée du consentement RGPD pour les formulaires publics TENF.
 * Champ canonique côté client : `privacyConsent` (booléen).
 * Alias acceptés côté serveur pour rétrocompatibilité.
 */

export const PRIVACY_POLICY_PATH = "/confidentialite";
export const LEGAL_NOTICE_PATH = "/mentions-legales";

/** Message API / serveur (refus de requête). */
export const PRIVACY_CONSENT_ERROR_API =
  "Le consentement à la politique de confidentialité est obligatoire.";

/** Message affiché côté formulaire (UX). */
export const PRIVACY_CONSENT_ERROR_FORM =
  "Merci d'accepter la politique de confidentialité pour envoyer votre demande.";

/** @deprecated Préférer PRIVACY_CONSENT_ERROR_API ou PRIVACY_CONSENT_ERROR_FORM */
export const PRIVACY_CONSENT_ERROR = PRIVACY_CONSENT_ERROR_API;

export function isPrivacyConsentGranted(body: Record<string, unknown> | null | undefined): boolean {
  if (!body || typeof body !== "object") return false;
  const value =
    body.privacyConsent ??
    body.consentRgpd ??
    body.rgpdConsent ??
    body.consent ??
    body.dataUsageAccepted;
  return value === true || value === "true" || value === 1 || value === "1";
}

export function requirePrivacyConsent(
  body: Record<string, unknown> | null | undefined
): { ok: true } | { ok: false; error: string } {
  if (isPrivacyConsentGranted(body)) return { ok: true };
  return { ok: false, error: PRIVACY_CONSENT_ERROR_API };
}
