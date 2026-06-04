"use client";

import Link from "next/link";
import { ExternalLink, Mail, Ticket } from "lucide-react";
import { TENF_OFFICIAL_EMAIL } from "@/lib/legal/constants";
import { LEGAL_NOTICE_PATH, PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";
import { DISCORD_TICKETS_CHANNEL_URL } from "@/lib/socialLinks";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-40 w-full"
      style={{ backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
      aria-label="Pied de page TENF"
    >
      {/* Séparateur visuel : fine ligne en dégradé discret au-dessus du footer */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-primary) 35%, #dc2626 65%, transparent)",
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6 lg:px-8">
        {/* Mentions légales — compactes, sur une ligne quand la place le permet */}
        <p className="min-w-0 text-[11px] leading-tight sm:text-xs">
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
            © {year} TENF
          </span>
          <span className="mx-1.5 opacity-50">•</span>
          <span>Twitch Entraide New Family. Tous droits réservés.</span>
          <span className="hidden sm:inline">
            <span className="mx-1.5 opacity-50">•</span>
            Textes, visuels, structure et contenus protégés.
          </span>
        </p>

        {/* Liens */}
        <nav
          className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:gap-x-4"
          aria-label="Liens du pied de page"
        >
          <Link
            href={LEGAL_NOTICE_PATH}
            className="text-[11px] font-medium transition-colors hover:opacity-80 sm:text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Mentions légales
          </Link>
          <Link
            href={PRIVACY_POLICY_PATH}
            className="text-[11px] font-medium transition-colors hover:opacity-80 sm:text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Confidentialité
          </Link>
          <a
            href={`mailto:${TENF_OFFICIAL_EMAIL}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-80 sm:text-xs"
            style={{ color: "var(--color-text)" }}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Contact
          </a>

          <a
            href={DISCORD_TICKETS_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 sm:text-xs"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ouvrir un ticket Discord</span>
            <span className="sm:hidden">Ticket Discord</span>
            <ExternalLink className="h-3 w-3 opacity-80" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
