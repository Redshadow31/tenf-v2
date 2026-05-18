"use client";

import Link from "next/link";
import { Lightbulb, ListChecks, MessageCircle, Send, Ticket } from "lucide-react";
import { CONTACT_ACCENT, CONTACT_NAV, CONTACT_TICKET_ACCENT } from "@/app/contact/_data";
import { DISCORD_INVITE_URL, DISCORD_TICKETS_CHANNEL_URL } from "@/lib/socialLinks";

const GUIDE_STEPS = [
  { title: "Tickets Discord", text: "Membre ? 🎟️・tickets en priorité — réponse visée en 0 à 4 h.", accent: CONTACT_TICKET_ACCENT, highlight: true },
  { title: "Choisis ton motif", text: "Un sujet clair = la bonne personne staff pour te répondre.", accent: CONTACT_ACCENT },
  { title: "Sois précis", text: "Contexte, dates, pseudo Discord, captures si besoin.", accent: CONTACT_ACCENT },
  { title: "Patience réaliste", text: "48 à 96 h en général — on est bénévoles.", accent: CONTACT_ACCENT },
] as const;

type ContactRightRailProps = {
  onOpenForm: () => void;
};

const panelStyle = {
  borderColor: "color-mix(in srgb, var(--color-border) 90%, transparent)",
  background: "linear-gradient(180deg, rgba(2,6,23,0.62) 0%, rgba(2,6,23,0.35) 100%)",
  boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
};

export function ContactLeftRail() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <nav className="rounded-2xl border p-4 backdrop-blur-sm" style={panelStyle} aria-label="Sections de la page contact">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: CONTACT_ACCENT }}>
          Sur cette page
        </p>
        <ul className="mt-3 space-y-0.5">
          {CONTACT_NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="contact-nav-link block rounded-lg border border-transparent px-2.5 py-2 text-sm font-medium transition hover:border-sky-500/20 hover:bg-white/5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="rounded-2xl border p-4 backdrop-blur-sm" style={panelStyle}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: CONTACT_ACCENT }}>
          <Lightbulb size={14} aria-hidden />
          Mode d&apos;emploi
        </p>
        <ol className="mt-3 space-y-3">
          {GUIDE_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: `${step.accent}22`,
                  color: step.accent,
                  boxShadow: "highlight" in step && step.highlight ? `0 0 16px ${step.accent}33` : undefined,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "highlight" in step && step.highlight ? step.accent : "var(--color-text)" }}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Link
        href="/rejoindre/faq"
        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white/5"
        style={{ ...panelStyle, borderColor: "var(--color-border)" }}
      >
        <ListChecks size={16} aria-hidden />
        FAQ rejoindre
      </Link>
    </div>
  );
}

export function ContactRightRail({ onOpenForm }: ContactRightRailProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <a
        href={DISCORD_TICKETS_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
        style={{
          borderColor: `${CONTACT_TICKET_ACCENT}55`,
          background: `linear-gradient(135deg, ${CONTACT_TICKET_ACCENT}24, rgba(2,6,23,0.7))`,
          color: "#fcd34d",
          boxShadow: `0 14px 36px ${CONTACT_TICKET_ACCENT}20`,
        }}
      >
        <Ticket size={18} aria-hidden />
        🎟️・tickets · 0–4 h
      </a>

      <div
        className="rounded-2xl border p-5 backdrop-blur-sm"
        style={{
          ...panelStyle,
          borderColor: `${CONTACT_ACCENT}40`,
          background: `linear-gradient(165deg, ${CONTACT_ACCENT}16 0%, rgba(2,6,23,0.55) 100%)`,
        }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          Prêt à écrire ?
        </p>
        <p className="home-muted mt-2 text-xs leading-relaxed">
          Le formulaire s&apos;ouvre en plein écran. Tu peux changer le motif à tout moment.
        </p>
        <button
          type="button"
          onClick={onOpenForm}
          className="home-btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(56,189,248,0.25)]"
          aria-haspopup="dialog"
        >
          <Send size={16} aria-hidden />
          Ouvrir le formulaire
        </button>
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
          Formulaire : 48 à 96 h · Tickets : 0–4 h
        </p>
      </div>

      <a
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
        style={{ ...panelStyle, color: "var(--color-text-secondary)" }}
      >
        <MessageCircle size={16} aria-hidden />
        Discord TENF
      </a>
    </div>
  );
}
