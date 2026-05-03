"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  LogIn,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { chapters, checklistItems, faqItems } from "./guideTenfNouveauMembreData";
import { SpotlightChapterTabs } from "./SpotlightChapterTabs";

const GUIDE_SECTION_ATTR = "data-guide-section";
const STORAGE_CHECKLIST = "tenf:guide-tenf-nouveau-membre:checklist:v1";

const navItems = [{ id: "intro", label: "Intro" }, ...chapters.map((c) => ({ id: c.id, label: c.navLabel })), { id: "checklist", label: "Checklist" }, { id: "faq", label: "FAQ" }, { id: "suite", label: "Suite" }] as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export default function GuideTenfNouveauMembreExperience() {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(chapters[0]?.id ?? null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeNav, setActiveNav] = useState<string>(navItems[0].id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHECKLIST);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHECKLIST, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked]);

  useEffect(() => {
    const ids = new Set<string>(navItems.map((n) => n.id));
    const elements = Array.from(document.querySelectorAll<HTMLElement>(`[${GUIDE_SECTION_ATTR}]`));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.target instanceof HTMLElement)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        const id = visible?.target?.getAttribute(GUIDE_SECTION_ATTR);
        if (id && ids.has(id)) setActiveNav(id);
      },
      { rootMargin: "-12% 0px -50% 0px", threshold: [0.08, 0.2, 0.35, 0.5] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const checklistProgress = useMemo(() => {
    const total = checklistItems.length;
    const done = checklistItems.filter((i) => checked[i.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [checked]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <section id="top" className="relative overflow-hidden border-b" style={{ borderColor: "var(--color-border)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-90 motion-safe:animate-mesh"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 15% 12%, rgba(244, 63, 94, 0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 88% 18%, rgba(167, 139, 250, 0.32), transparent 50%), radial-gradient(ellipse 55% 42% at 48% 100%, rgba(45, 212, 191, 0.14), transparent 48%)",
          }}
        />
        <div className="pointer-events-none absolute -right-24 top-6 h-80 w-80 rounded-full bg-rose-500/12 blur-3xl motion-safe:animate-mesh" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/18 blur-3xl motion-safe:animate-mesh" />

        <div data-guide-section="intro" id="intro" className="relative mx-auto max-w-6xl scroll-mt-28 px-4 pb-14 pt-10 sm:pb-16 sm:pt-14">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] backdrop-blur"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Guides &amp; parcours
            </span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Culture TENF · nouveau membre
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-rose-200/90">Guide du nouveau membre</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: "var(--color-text)" }}>
            Bienvenue dans{" "}
            <span className="bg-gradient-to-r from-rose-200 via-violet-200 to-teal-200 bg-clip-text text-transparent">TENF</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Synthèse vivante de l’ADN communautaire : entraide réelle, Spotlights, points, événements, formations et ton rôle.
            Pour le détail officiel, les pages <strong style={{ color: "var(--color-text)" }}>Fonctionnement TENF</strong> restent la
            référence — ici on te donne la carte et les raccourcis.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToId(chapters[0]?.id ?? "bienvenue")}
              className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #e11d48, #a855f7)" }}
            >
              <MousePointerClick className="h-4 w-4 transition group-hover:rotate-[-8deg]" aria-hidden />
              Parcourir les chapitres
            </button>
            <Link
              href="/fonctionnement-tenf/decouvrir"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--color-text)" }}
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              Fonctionnement — Découvrir
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--color-text)" }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Espace membre
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Chapitres", v: String(chapters.length), d: "De la bienvenue à la conclusion" },
              { k: "Aligné sur", v: "Fonctionnement", d: "Même esprit, liens vers les pages détaillées" },
              { k: "Checklist", v: "6 étapes", d: "Sauvegardée dans ton navigateur" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-2xl border p-4 backdrop-blur transition hover:-translate-y-0.5"
                style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 82%, transparent)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  {s.k}
                </p>
                <p className="mt-1 text-lg font-bold" style={{ color: "var(--color-text)" }}>
                  {s.v}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-bg) 88%, transparent)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-2 gap-y-2 px-4 py-3">
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  active ? "shadow-md" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 22%, transparent)" : "var(--color-card)",
                  color: active ? "var(--color-text)" : "var(--color-text-secondary)",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:space-y-14 sm:py-16">
        {chapters.map((ch) => {
          const Icon = ch.icon;
          const open = expandedChapter === ch.id;
          return (
            <section
              key={ch.id}
              data-guide-section={ch.id}
              id={ch.id}
              className="scroll-mt-28 overflow-hidden rounded-3xl border border-t-[3px] transition"
              style={{ borderColor: "var(--color-border)", borderTopColor: ch.accent, backgroundColor: "var(--color-card)" }}
            >
              <button
                type="button"
                className="flex w-full flex-col gap-4 border-b p-5 text-left sm:flex-row sm:items-center sm:justify-between sm:p-6"
                style={{ borderColor: "var(--color-border)" }}
                onClick={() => setExpandedChapter((p) => (p === ch.id ? null : ch.id))}
                aria-expanded={open}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden>
                    {ch.emoji}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: ch.accent }}>
                      Chapitre
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
                      {ch.titre}
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {ch.soustitre}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                  <span
                    className="hidden h-12 w-12 items-center justify-center rounded-2xl border sm:flex"
                    style={{ borderColor: `${ch.accent}55`, background: `linear-gradient(135deg, ${ch.accent}33, var(--color-surface))` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: ch.accent }} aria-hidden />
                  </span>
                  <ChevronDown className={`h-6 w-6 transition ${open ? "rotate-180" : ""}`} style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                </div>
              </button>

              <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-5 p-5 pt-2 sm:p-6 sm:pt-0">
                    {ch.spotlightTabs ? (
                      <>
                        <SpotlightChapterTabs panels={ch.spotlightTabs} />
                        {ch.blocks
                          .filter((b) => b.kind === "lead")
                          .map((b, i) =>
                            b.kind === "lead" ? (
                              <p key={i} className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                                {b.text}
                              </p>
                            ) : null,
                          )}
                        {ch.blocks
                          .filter((b) => b.kind === "callout")
                          .map((b, i) =>
                            b.kind === "callout" ? (
                              <div
                                key={`co-${i}`}
                                className="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
                                style={{
                                  borderColor: b.variant === "important" ? "rgba(251, 113, 133, 0.45)" : "rgba(45, 212, 191, 0.35)",
                                  backgroundColor:
                                    b.variant === "important" ? "rgba(251, 113, 133, 0.08)" : "rgba(45, 212, 191, 0.08)",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                                  {b.variant === "important" ? "Important · " : "Astuce · "}
                                </span>
                                {b.text}
                              </div>
                            ) : null,
                          )}
                      </>
                    ) : (
                      ch.blocks.map((b, i) => {
                        if (b.kind === "lead") {
                          return (
                            <p key={i} className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text)" }}>
                              {b.text}
                            </p>
                          );
                        }
                        if (b.kind === "bullets") {
                          return (
                            <div key={i}>
                              {b.title ? (
                                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                                  {b.title}
                                </p>
                              ) : null}
                              <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                {b.items.map((item) => (
                                  <li key={item} className="flex gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ch.accent }} aria-hidden />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        if (b.kind === "callout") {
                          return (
                            <div
                              key={i}
                              className="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
                              style={{
                                borderColor: b.variant === "important" ? "rgba(251, 113, 133, 0.45)" : "rgba(45, 212, 191, 0.35)",
                                backgroundColor:
                                  b.variant === "important" ? "rgba(251, 113, 133, 0.08)" : "rgba(45, 212, 191, 0.08)",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                                {b.variant === "important" ? "Important · " : "Astuce · "}
                              </span>
                              {b.text}
                            </div>
                          );
                        }
                        return null;
                      })
                    )}

                    {ch.liens?.length ? (
                      <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                        {ch.liens.map((l) =>
                          isExternal(l.href) ? (
                            <a
                              key={l.href}
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/5"
                              style={{ borderColor: "var(--color-border)", color: ch.accent }}
                            >
                              {l.label}
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </a>
                          ) : (
                            <Link
                              key={l.href}
                              href={l.href}
                              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/5"
                              style={{ borderColor: "var(--color-border)", color: ch.accent }}
                            >
                              {l.label}
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <section data-guide-section="checklist" id="checklist" className="scroll-mt-28">
          <div
            className="overflow-hidden rounded-3xl border sm:flex"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="border-b p-6 sm:w-72 sm:border-b-0 sm:border-r" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                Feuille de route express
              </h2>
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Coches enregistrées localement — complète-les dans l’ordre qui t’arrange.
              </p>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  <span>Progression</span>
                  <span>
                    {checklistProgress.done}/{checklistProgress.total}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${checklistProgress.pct}%`, background: "linear-gradient(90deg, #fb7185, #a78bfa)" }}
                  />
                </div>
                <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: "var(--color-text)" }}>
                  {checklistProgress.pct}%
                </p>
              </div>
            </div>
            <ul className="flex-1 divide-y" style={{ borderColor: "var(--color-border)" }}>
              {checklistItems.map((item) => {
                const isOn = !!checked[item.id];
                return (
                  <li key={item.id} className="flex items-start gap-3 p-4 sm:p-5">
                    <button
                      type="button"
                      onClick={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition"
                      style={{
                        borderColor: isOn ? "transparent" : "var(--color-border)",
                        backgroundColor: isOn ? "var(--color-primary)" : "transparent",
                        color: isOn ? "#fff" : "var(--color-text-secondary)",
                      }}
                      aria-pressed={isOn}
                      aria-label={isOn ? `Décocher ${item.label}` : `Cocher ${item.label}`}
                    >
                      {isOn ? <Check className="h-4 w-4" aria-hidden /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${isOn ? "line-through opacity-60" : ""}`} style={{ color: "var(--color-text)" }}>
                        {item.label}
                      </p>
                      <Link href={item.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-rose-300 hover:underline">
                        Ouvrir
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section data-guide-section="faq" id="faq" className="scroll-mt-28">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Questions fréquentes
          </h2>
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => {
              const open = openFaq === item.id;
              return (
                <div key={item.id} className="rounded-2xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                    onClick={() => setOpenFaq((id) => (id === item.id ? null : item.id))}
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                      {item.q}
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                  </button>
                  {open ? (
                    <div className="animate-fadeIn border-t px-4 pb-4 pt-2 text-sm leading-relaxed sm:px-5" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section
          data-guide-section="suite"
          id="suite"
          className="scroll-mt-28 overflow-hidden rounded-3xl border p-8 text-center sm:p-12"
          style={{
            borderColor: "color-mix(in srgb, var(--color-primary) 35%, transparent)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 16%, var(--color-card)), var(--color-card) 55%, color-mix(in srgb, #fb7185 8%, var(--color-card)))",
          }}
        >
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Suite du parcours
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Enchaîne avec les guides du site et le fonctionnement détaillé — tout reste cohérent avec ce que tu viens de lire.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/fonctionnement-tenf/parcours-complet"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--color-primary), #e11d48)" }}
            >
              Parcours complet TENF
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/guides/partie-publique"
              className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Carte site public
            </Link>
            <Link
              href="/guides/espace-membre"
              className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Carte espace membre
            </Link>
          </div>
        </section>

        <p className="pb-6 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Contenu pédagogique indicatif — en cas d’écart, les annonces staff et les pages{" "}
          <Link href="/fonctionnement-tenf/decouvrir" className="underline-offset-2 hover:underline" style={{ color: "var(--color-primary)" }}>
            Fonctionnement TENF
          </Link>{" "}
          priment.
        </p>
      </div>
    </div>
  );
}
