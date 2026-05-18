"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { CONTACT_ACCENT, contactFaq } from "../_data";
import ContactSectionHeader from "./ContactSectionHeader";

export default function ContactFaqPanel() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="contact-faq" className="about-fade-up home-section scroll-mt-28">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/[0.07] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] sm:p-7"
        style={{
          background:
            "linear-gradient(155deg, rgba(56,189,248,0.12) 0%, rgba(15,23,42,0.5) 40%, color-mix(in srgb, var(--color-card) 96%, transparent) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)" }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
          aria-hidden
        />

        <div className="relative space-y-5">
          <ContactSectionHeader
            kicker="Questions fréquentes"
            title="Avant de nous écrire"
            lead="Les réponses rapides aux doutes les plus courants."
            icon={HelpCircle}
            accent={CONTACT_ACCENT}
          />

          <ul className="contact-faq-list grid gap-3 lg:grid-cols-2">
            {contactFaq.map((item, i) => {
              const open = openFaq === i;
              const ItemIcon = item.icon;
              return (
                <li key={item.q}>
                  <div
                    className={`contact-faq-item relative overflow-hidden rounded-2xl border transition-all duration-300 ${open ? "contact-faq-item--open shadow-lg" : ""}`}
                    style={{
                      borderColor: open ? `${item.accent}55` : "rgba(148,163,184,0.2)",
                      background: open
                        ? `linear-gradient(135deg, ${item.accent}14 0%, color-mix(in srgb, var(--color-card) 95%, transparent) 100%)`
                        : "color-mix(in srgb, var(--color-card) 88%, transparent)",
                      boxShadow: open ? `0 12px 32px ${item.accent}18` : undefined,
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80"
                      style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-start gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/45 sm:p-5"
                      aria-expanded={open}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
                        style={{ backgroundColor: `${item.accent}22`, color: item.accent }}
                      >
                        <ItemIcon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ borderColor: `${item.accent}44`, color: item.accent, backgroundColor: `${item.accent}10` }}
                        >
                          {item.tag}
                        </span>
                        <span className="mt-2 block text-sm font-bold leading-snug sm:text-base" style={{ color: "var(--color-text)" }}>
                          {item.q}
                        </span>
                      </span>
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]"
                        style={{
                          backgroundColor: open ? `${item.accent}22` : "rgba(0,0,0,0.15)",
                          color: open ? item.accent : "var(--color-text-secondary)",
                        }}
                      >
                        <ChevronDown
                          size={16}
                          className="transition-transform duration-300"
                          style={{ transform: open ? "rotate(180deg)" : undefined }}
                          aria-hidden
                        />
                      </span>
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                      aria-hidden={!open}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p
                          className="border-t px-4 pb-4 pt-3 text-sm leading-relaxed sm:px-5 sm:text-[15px]"
                          style={{ borderColor: `${item.accent}28`, color: "var(--color-text-secondary)" }}
                        >
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
