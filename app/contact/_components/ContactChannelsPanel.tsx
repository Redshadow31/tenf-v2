"use client";

import { ArrowUpRight, Radio, Ticket } from "lucide-react";
import { contactChannels } from "../_data";
import ContactSectionHeader from "./ContactSectionHeader";

export default function ContactChannelsPanel() {
  return (
    <section id="contact-canaux" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <ContactSectionHeader
        title={contactChannels.title}
        lead={contactChannels.lead}
        icon={Radio}
        accent="#38bdf8"
      />

      <div className="contact-channel-list grid gap-3">
        {contactChannels.rows.map((row) => {
          const isPriority = "priority" in row && row.priority;
          const inner = (
            <>
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${row.accent}, transparent)`,
                  opacity: isPriority ? 1 : 0.65,
                }}
                aria-hidden
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] shadow-inner"
                    style={{
                      background: `linear-gradient(145deg, ${row.accent}28, rgba(2,6,23,0.5))`,
                      color: row.accent,
                      boxShadow: isPriority ? `0 0 24px ${row.accent}25` : undefined,
                    }}
                  >
                    {isPriority ? <Ticket className="h-5 w-5" aria-hidden /> : <Radio className="h-5 w-5" aria-hidden />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold sm:text-lg" style={{ color: row.accent }}>
                        {row.channel}
                      </span>
                      {isPriority ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: `${row.accent}22`, color: row.accent }}
                        >
                          Priorité
                        </span>
                      ) : null}
                    </div>
                    <p className="home-muted mt-2 text-sm leading-relaxed">{row.bestFor}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span
                    className="rounded-xl border px-3 py-1.5 text-sm font-bold tabular-nums"
                    style={{
                      borderColor: `${row.accent}44`,
                      backgroundColor: `${row.accent}12`,
                      color: row.accent,
                    }}
                  >
                    {row.delay}
                  </span>
                  {"href" in row && row.href ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: row.accent }}>
                      Ouvrir <ArrowUpRight size={14} aria-hidden />
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          );

          const className = `contact-channel-card group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:p-5 ${
            isPriority ? "contact-channel-card--priority" : ""
          }`;

          const style = {
            borderColor: isPriority ? `${row.accent}55` : "rgba(148,163,184,0.22)",
            background: isPriority
              ? `linear-gradient(135deg, ${row.accent}16 0%, color-mix(in srgb, var(--color-card) 94%, transparent) 55%, rgba(2,6,23,0.85) 100%)`
              : "color-mix(in srgb, var(--color-card) 90%, transparent)",
            boxShadow: isPriority ? `0 16px 40px ${row.accent}14` : undefined,
          };

          if ("href" in row && row.href) {
            return (
              <a
                key={row.channel}
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${className} hover:-translate-y-0.5 hover:shadow-xl`}
                style={style}
              >
                {inner}
              </a>
            );
          }

          return (
            <article key={row.channel} className={className} style={style}>
              {inner}
            </article>
          );
        })}
      </div>
    </section>
  );
}
