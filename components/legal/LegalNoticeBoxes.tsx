import type { ReactNode } from "react";
import styles from "./legal.module.css";
import {
  TENF_EDITOR_ADDRESS_LEGAL_NOTE,
  TENF_EDITOR_ADDRESS_NOTICE,
  TENF_FOUNDERS,
  TENF_LEGAL_VALIDATION_NOTICE,
  TENF_OFFICIAL_EMAIL,
  TENF_PRIVACY_VALIDATION_NOTICE,
} from "@/lib/legal/constants";

function Box({
  title,
  children,
  variant = "info",
}: {
  title: string;
  children: ReactNode;
  variant?: "info" | "validation" | "address";
}) {
  const className = variant === "address" ? styles.highlightBox : styles.infoCard;

  return (
    <div className={className}>
      <p className={styles.infoCardLabel}>{title}</p>
      <div className="mt-2 space-y-2" style={{ color: "var(--color-text-secondary)" }}>
        {children}
      </div>
    </div>
  );
}

export function LegalValidationBox({ type }: { type: "mentions" | "privacy" }) {
  return (
    <Box title="Validation avant publication officielle" variant="validation">
      <p style={{ color: "var(--color-text)" }}>
        {type === "mentions" ? TENF_LEGAL_VALIDATION_NOTICE : TENF_PRIVACY_VALIDATION_NOTICE}
      </p>
    </Box>
  );
}

export function LegalEditorAddressNotice() {
  return (
    <Box title="Adresse de l'éditeur" variant="address">
      <p>{TENF_EDITOR_ADDRESS_NOTICE}</p>
      <p>{TENF_EDITOR_ADDRESS_LEGAL_NOTE}</p>
      <p className="text-xs">
        Contact officiel et canal RGPD : {TENF_OFFICIAL_EMAIL} — à valider par {TENF_FOUNDERS} selon
        l&apos;évolution du statut juridique de TENF.
      </p>
    </Box>
  );
}

/** @deprecated Utiliser LegalEditorAddressNotice */
export const LegalEditorTodoBox = LegalEditorAddressNotice;

export function OfficialEmailLink({ subject }: { subject?: string }) {
  const href = subject
    ? `mailto:Twitchentraidenewfamily@gmail.com?subject=${encodeURIComponent(subject)}`
    : "mailto:Twitchentraidenewfamily@gmail.com";

  return (
    <a
      href={href}
      className="break-all font-semibold underline underline-offset-2 transition hover:opacity-80"
      style={{ color: "#c4b5fd" }}
    >
      Twitchentraidenewfamily@gmail.com
    </a>
  );
}
