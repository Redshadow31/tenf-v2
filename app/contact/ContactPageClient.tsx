"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  Send,
  Ticket,
} from "lucide-react";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import { ContactLeftRail, ContactRightRail } from "@/components/contact/ContactPublicRails";
import { DISCORD_TICKETS_CHANNEL_URL } from "@/lib/socialLinks";
import ContactChannelsPanel from "./_components/ContactChannelsPanel";
import ContactFaqPanel from "./_components/ContactFaqPanel";
import ContactModal from "./_components/ContactModal";
import {
  CONTACT_ACCENT,
  CONTACT_TICKET_ACCENT,
  beforeYouWrite,
  contactDelays,
  contactHero,
  contactHeroStats,
  contactMoreLinks,
  topicVisual,
} from "./_data";
import { CONTACT_MODAL_EVENT, type ContactModalEventDetail } from "./contactModalEvents";
import { CONTACT_TOPICS, resolveContactTopic } from "./topics";

export default function ContactPageClient() {
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTopic, setModalTopic] = useState<string | null>(null);
  const openModal = useCallback((topic?: string) => {
    setModalTopic(topic ?? null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const incoming = resolveContactTopic(searchParams?.get("topic"));
    if (incoming) openModal(incoming);
  }, [searchParams, openModal]);

  useEffect(() => {
    function handleEvent(event: Event) {
      const detail = (event as CustomEvent<ContactModalEventDetail>).detail;
      openModal(detail?.topic);
    }
    window.addEventListener(CONTACT_MODAL_EVENT, handleEvent);
    return () => window.removeEventListener(CONTACT_MODAL_EVENT, handleEvent);
  }, [openModal]);

  return (
    <>
      <main
        className="contact-page home-page relative min-h-screen w-full overflow-x-hidden pb-24 lg:pb-0"
        style={{
          paddingTop: "clamp(1rem, 0.6rem + 1.4vw, 3rem)",
          paddingBottom: "clamp(2rem, 1rem + 2.4vw, 5rem)",
        }}
      >
        <div className="contact-mesh" aria-hidden />
        <div className="contact-glow contact-glow-left" aria-hidden />
        <div className="contact-glow contact-glow-right" aria-hidden />

        <div className="home-page-inner relative z-10 mx-auto w-full max-w-[min(100%,1920px)] px-[clamp(0.65rem,1.35vw,1.85rem)]">
          <div className="contact-workspace grid grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,16rem)_minmax(0,1fr)_minmax(250px,20rem)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(240px,18rem)_minmax(0,1fr)_minmax(280px,22rem)] xl:gap-6 2xl:grid-cols-[minmax(260px,20rem)_minmax(0,1fr)_minmax(300px,24rem)] 2xl:gap-8">
            <aside className="hidden min-w-0 lg:block lg:pr-1">
              <ContactLeftRail />
            </aside>

            {/* Contenu central */}
            <div className="flex min-w-0 flex-col" style={{ rowGap: "clamp(1.75rem, 1rem + 1.6vw, 3.5rem)" }}>
              {/* Hero */}
              <section
                id="contact-hero"
                className="contact-hero about-fade-up home-hero relative overflow-hidden rounded-3xl border scroll-mt-28"
                style={{
                  padding: "clamp(1.25rem, 0.75rem + 2.2vw, 3.5rem)",
                  borderColor: `${CONTACT_ACCENT}33`,
                  background:
                    "radial-gradient(120% 130% at 8% 0%, rgba(56,189,248,0.2), rgba(15,23,42,0.2) 38%, rgba(2,6,23,0.88) 100%)",
                }}
              >
                <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
                <div
                  className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl"
                  style={{ backgroundColor: `${CONTACT_ACCENT}28` }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full blur-3xl"
                  style={{ backgroundColor: `${CONTACT_TICKET_ACCENT}18` }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/45 to-transparent"
                  aria-hidden
                />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,22rem)] lg:items-center">
                  <div className="space-y-5">
                  <div
                    className="home-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
                    style={{ borderColor: `${CONTACT_ACCENT}44`, backgroundColor: `${CONTACT_ACCENT}12`, color: CONTACT_ACCENT }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    {contactHero.chip}
                  </div>
                  <h1
                    className="home-hero-title font-extrabold leading-[1.05] tracking-tight"
                    style={{ fontSize: "clamp(1.75rem, 1.1rem + 3.2vw, 3.75rem)" }}
                  >
                    {contactHero.title}
                  </h1>
                  <p
                    className="home-hero-lead font-semibold leading-relaxed lg:max-w-none"
                    style={{ fontSize: "clamp(1rem, 0.85rem + 0.6vw, 1.5rem)" }}
                  >
                    {contactHero.lead}
                  </p>
                  <p
                    className="home-hero-body leading-relaxed lg:max-w-none"
                    style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1.125rem)" }}
                  >
                    {contactHero.body}
                  </p>

                    <div className="contact-hero-stats grid grid-cols-3 gap-2 sm:gap-3">
                      {contactHeroStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl border px-2 py-2.5 text-center sm:px-3 sm:py-3"
                          style={{
                            borderColor: `${stat.accent}35`,
                            background: `linear-gradient(160deg, ${stat.accent}12, rgba(2,6,23,0.5))`,
                          }}
                        >
                          <p className="text-lg font-extrabold tabular-nums sm:text-xl" style={{ color: stat.accent }}>
                            {stat.value}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                  <button
                    type="button"
                    onClick={() => openModal()}
                    className="home-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white lg:hidden"
                    aria-haspopup="dialog"
                  >
                    <Send size={16} aria-hidden /> {contactHero.cta}
                  </button>
                  </div>

                  <div className="hidden flex-col gap-3 lg:flex">
                    <a
                      href={DISCORD_TICKETS_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-cta-ticket flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
                      style={{
                        borderColor: `${CONTACT_TICKET_ACCENT}55`,
                        background: `linear-gradient(135deg, ${CONTACT_TICKET_ACCENT}22, rgba(2,6,23,0.6))`,
                        color: "#fcd34d",
                        boxShadow: `0 12px 32px ${CONTACT_TICKET_ACCENT}22`,
                      }}
                    >
                      <Ticket size={18} aria-hidden />
                      🎟️・tickets · 0–4 h
                    </a>
                    <button
                      type="button"
                      onClick={() => openModal()}
                      className="home-btn-primary flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white"
                      aria-haspopup="dialog"
                    >
                      <Send size={16} aria-hidden />
                      {contactHero.cta}
                    </button>
                  </div>
                </div>
              </section>

              {/* Délais */}
              <section id="contact-delais" className="about-fade-up home-section scroll-mt-28 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                  {contactDelays.map((item) => {
                    const Icon = item.icon;
                    const isPriority = "priority" in item && item.priority;
                    return (
                      <article
                        key={item.title}
                        className={`about-reveal rounded-2xl border p-4 sm:p-5 transition duration-200 hover:-translate-y-0.5 ${isPriority ? "md:col-span-3 lg:col-span-1" : ""}`}
                        style={{
                          borderColor: isPriority ? `${item.accent}50` : `color-mix(in srgb, ${item.accent} 30%, var(--color-border))`,
                          background: isPriority
                            ? `linear-gradient(145deg, ${item.accent}18 0%, color-mix(in srgb, var(--color-card) 88%, transparent) 100%)`
                            : "color-mix(in srgb, var(--color-card) 70%, transparent)",
                          boxShadow: isPriority ? `0 14px 36px ${item.accent}16` : undefined,
                        }}
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <h2 className="mt-3 text-base font-bold">{item.title}</h2>
                        <p className="home-muted mt-1.5 text-sm leading-relaxed">{item.description}</p>
                        {"href" in item && item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="home-link-accent mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                          >
                            {item.linkLabel} <ExternalLink size={12} aria-hidden />
                          </a>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Motifs */}
              <section id="contact-motifs" className="about-fade-up home-section scroll-mt-28 space-y-5">
                <header
                  className="relative overflow-hidden rounded-2xl border border-white/[0.06] px-4 py-4 sm:px-5"
                  style={{
                    background: `linear-gradient(135deg, ${CONTACT_ACCENT}10 0%, color-mix(in srgb, var(--color-card) 92%, transparent) 100%)`,
                    borderColor: `${CONTACT_ACCENT}28`,
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: CONTACT_ACCENT }}>
                    Choisir un motif
                  </p>
                  <h2 className="home-section-title mt-1 text-xl font-extrabold sm:text-3xl">Pour quoi nous écris-tu ?</h2>
                  <p className="home-muted mt-2 text-sm sm:text-base">
                    Clique sur un motif pour ouvrir le formulaire avec le bon sujet présélectionné.
                  </p>
                </header>
                <div className="contact-topic-grid grid gap-3">
                  {CONTACT_TOPICS.map((topic) => {
                    const visual = topicVisual[topic.id];
                    const Icon = visual?.icon ?? HelpCircle;
                    const accent = visual?.accent ?? CONTACT_ACCENT;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => openModal(topic.id)}
                        className="contact-topic-card about-reveal group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-5"
                        style={{
                          borderColor: `${accent}33`,
                          background: `linear-gradient(155deg, ${accent}10 0%, color-mix(in srgb, var(--color-card) 92%, transparent) 100%)`,
                        }}
                      >
                        <span
                          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                          aria-hidden
                        />
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
                            style={{ backgroundColor: `${accent}18`, color: accent }}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="flex items-center justify-between gap-2 text-sm font-bold sm:text-base">
                              {topic.label}
                              <ArrowRight
                                className="h-4 w-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-60"
                                style={{ color: accent }}
                                aria-hidden
                              />
                            </h3>
                            <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">{topic.hint}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Avant d'écrire */}
              <section id="contact-avant" className="about-fade-up home-section scroll-mt-28 space-y-5">
                <header className="max-w-3xl space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: CONTACT_ACCENT }}>
                    {beforeYouWrite.title}
                  </p>
                  <p className="home-muted text-sm sm:text-base">{beforeYouWrite.lead}</p>
                </header>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {beforeYouWrite.items.map((item) => {
                    const Icon = item.icon;
                    const inner = (
                      <>
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <h3 className="mt-3 text-base font-bold">{item.title}</h3>
                        <p className="home-muted mt-2 text-sm leading-relaxed">{item.description}</p>
                      </>
                    );
                    return "href" in item && item.href ? (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="about-reveal rounded-2xl border p-5 transition hover:-translate-y-0.5"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <article key={item.title} className="about-reveal rounded-2xl border p-5" style={{ borderColor: "var(--color-border)" }}>
                        {inner}
                      </article>
                    );
                  })}
                </div>
              </section>

              <ContactChannelsPanel />

              <ContactFaqPanel />

              {/* Liens */}
              <section className="about-fade-up home-section scroll-mt-28">
                <div
                  className="rounded-3xl border p-5 sm:p-6"
                  style={{ borderColor: `${CONTACT_ACCENT}22`, backgroundColor: "color-mix(in srgb, var(--color-card) 85%, transparent)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: CONTACT_ACCENT }}>
                    Pour aller plus loin
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {contactMoreLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                          style={{
                            borderColor: `${link.accent}30`,
                            background: `linear-gradient(145deg, ${link.accent}0c, color-mix(in srgb, var(--color-card) 94%, transparent))`,
                          }}
                        >
                          <span
                            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-0 transition group-hover:opacity-100"
                            style={{ background: `linear-gradient(90deg, transparent, ${link.accent}, transparent)` }}
                            aria-hidden
                          />
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06]"
                            style={{ backgroundColor: `${link.accent}18`, color: link.accent }}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <h3 className="flex items-center justify-between gap-2 text-sm font-bold sm:text-base">
                            {link.title}
                            <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70" style={{ color: link.accent }} aria-hidden />
                          </h3>
                          <p className="home-muted text-xs sm:text-sm">{link.description}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            <aside className="hidden min-w-0 lg:block lg:pl-1">
              <ContactRightRail onOpenForm={() => openModal()} />
            </aside>
          </div>

          <details
            className="contact-mobile-rail mt-6 rounded-2xl border p-4 lg:hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
          >
            <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Navigation &amp; aide
            </summary>
            <div className="mt-4">
              <ContactLeftRail />
            </div>
          </details>
        </div>

        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur-xl lg:hidden"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={() => openModal()}
            className="home-btn-primary mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
          >
            <Send size={16} aria-hidden />
            Ouvrir le formulaire
          </button>
        </div>
      </main>

      <style jsx>{`
        .contact-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.38;
          background-image:
            radial-gradient(circle at 14% 12%, rgba(56, 189, 248, 0.14), transparent 38%),
            radial-gradient(circle at 86% 8%, rgba(245, 158, 11, 0.1), transparent 32%),
            radial-gradient(circle at 70% 82%, rgba(99, 102, 241, 0.1), transparent 38%);
        }

        .contact-glow {
          position: absolute;
          width: 320px;
          height: 320px;
          filter: blur(88px);
          pointer-events: none;
          opacity: 0.22;
          animation: contactFloat 9s ease-in-out infinite;
        }

        .contact-glow-left {
          left: max(-80px, calc(50% - 52rem));
          top: 100px;
          background: rgba(56, 189, 248, 0.42);
        }

        .contact-glow-right {
          right: max(-80px, calc(50% - 52rem));
          bottom: 60px;
          background: rgba(245, 158, 11, 0.38);
          animation-delay: 1.2s;
        }

        .contact-workspace {
          width: 100%;
        }

        @media (min-width: 1024px) {
          .contact-workspace > aside {
            position: sticky;
            top: 5.5rem;
            align-self: start;
            max-height: calc(100dvh - 6rem);
            overflow-y: auto;
            border-radius: 1rem;
            border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
            background: linear-gradient(180deg, rgba(2, 6, 23, 0.55) 0%, rgba(2, 6, 23, 0.28) 100%);
            padding: 0.65rem;
          }
        }

        .contact-topic-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 15.5rem), 1fr));
        }

        @media (min-width: 1536px) {
          .contact-topic-grid {
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
          }
        }

        .contact-faq-item:hover:not(.contact-faq-item--open) {
          border-color: rgba(148, 163, 184, 0.35);
          transform: translateY(-1px);
        }

        .contact-channel-card--priority:hover {
          box-shadow: 0 20px 48px rgba(245, 158, 11, 0.18);
        }

        @keyframes contactFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }
      `}</style>

      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} initialTopic={modalTopic} />
      <AboutPageEnhancer />
    </>
  );
}
