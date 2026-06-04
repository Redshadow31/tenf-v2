"use client";

import Link from "next/link";
import { PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";

export type RgpdConsentCheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Message d'erreur affiché sous la case (ex. tentative d'envoi sans cocher). */
  error?: string | null;
  className?: string;
};

/**
 * Case obligatoire RGPD — texte standard TENF + lien vers la politique de confidentialité.
 */
export default function RgpdConsentCheckbox({
  id,
  checked,
  onChange,
  disabled = false,
  error = null,
  className = "",
}: RgpdConsentCheckboxProps) {
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border"
          style={{ accentColor: "var(--color-primary)", borderColor: "var(--color-border)" }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
        <label
          htmlFor={id}
          className="text-xs leading-relaxed sm:text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          J&apos;accepte que les informations envoyées soient utilisées par l&apos;équipe TENF pour
          traiter ma demande, conformément à la{" "}
          <Link
            href={PRIVACY_POLICY_PATH}
            className="font-semibold underline underline-offset-2 transition hover:opacity-80"
            style={{ color: "var(--color-text)" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            politique de confidentialité
          </Link>
          .
        </label>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 text-xs font-medium"
          style={{ color: "#ef4444" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
