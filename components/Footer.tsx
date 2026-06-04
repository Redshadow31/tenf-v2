"use client";

import Link from "next/link";
import { ExternalLink, Mail, Ticket } from "lucide-react";
import { DISCORD_TICKETS_CHANNEL_URL } from "@/lib/socialLinks";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative w-full mt-auto"
      style={{ backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
      aria-label="Pied de page TENF"
    >
      {/* Séparateur visuel : fine ligne en dégradé discret au-dessus du footer */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-primary) 35%, #dc2626 65%, transparent)",
          opacity: 0.45,
        }}
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Bloc marque + mentions légales */}
          <div className="min-w-0">
            <span
              className="text-lg font-bold tracking-wide"
              style={{ color: "var(--color-text)" }}
            >
              TENF
            </span>
            <p className="mt-2 text-sm leading-relaxed">
              © {year} Twitch Entraide New Family – TENF. Tous droits réservés.
            </p>
            <p className="text-sm leading-relaxed">
              Textes, visuels, structure et contenus protégés.
            </p>
          </div>

          {/* Bloc liens */}
          <nav
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5"
            aria-label="Liens du pied de page"
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-text)" }}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact
            </Link>

            <a
              href={DISCORD_TICKETS_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Ticket className="h-4 w-4" aria-hidden="true" />
              Ouvrir un ticket Discord
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
