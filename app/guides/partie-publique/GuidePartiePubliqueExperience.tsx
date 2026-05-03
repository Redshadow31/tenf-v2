"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Eye,
  EyeOff,
  LayoutGrid,
  LogIn,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import {
  checklistItems,
  extraRessources,
  faqItems,
  menuZones,
  parcoursEtapes,
  personas,
  type PersonaId,
} from "./guidePartiePubliqueData";

const GUIDE_SECTION_ATTR = "data-guide-section";

const STORAGE_CHECKLIST = "tenf:guide-partie-publique:checklist:v1";

const navItems = [
  { id: "explorer", label: "Profils" },
  { id: "carte-menu", label: "Carte du menu" },
  { id: "parcours", label: "Parcours" },
  { id: "checklist", label: "Checklist" },
  { id: "faq", label: "FAQ" },
  { id: "compte", label: "Connexion" },
] as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function GuidePartiePubliqueExperience() {
  const [persona, setPersona] = useState<PersonaId>("decouvrir");
  const [expandedMenu, setExpandedMenu] = useState<string | null>(menuZones[0]?.id ?? null);
  const [openParcours, setOpenParcours] = useState<string>(parcoursEtapes[0]?.id ?? "");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [modeApercu, setModeApercu] = useState<"public" | "membre">("public");
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

  const personaData = useMemo(() => personas.find((p) => p.id === persona)!, [persona]);

  const checklistProgress = useMemo(() => {
    const total = checklistItems.length;
    const done = checklistItems.filter((i) => checked[i.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [checked]);

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Hero */}
      <section
        id="top"
        className="relative overflow-hidden border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90 motion-safe:animate-mesh"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 20% 10%, rgba(139, 92, 246, 0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 20%, rgba(6, 182, 212, 0.28), transparent 50%), radial-gradient(ellipse 60% 45% at 50% 95%, rgba(236, 72, 153, 0.18), transparent 45%)",
          }}
        />
        <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl motion-safe:animate-mesh" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl motion-safe:animate-mesh" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pb-16 sm:pt-14">
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
              Lecture ~8 min · 100 % public
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: "var(--color-text)" }}>
            Carte interactive de la{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              partie publique
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Sans connexion Discord, tu navigues dans la vitrine TENF : découvrir la communauté, explorer les créateurs,
            consulter les événements et lire les guides. Ce parcours te propose des raccourcis cliquables, une carte du
            menu, et une checklist sauvegardée dans ton navigateur.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToId("explorer")}
              className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, var(--color-primary), #7c3aed)" }}
            >
              <MousePointerClick className="h-4 w-4 transition group-hover:rotate-[-8deg]" aria-hidden />
              Choisir mon profil
            </button>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--color-text)" }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              J&apos;ai déjà un compte
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Zones menu", v: "5 blocs", d: "Boutique + 4 menus déroulants" },
              { k: "Parcours", v: "4 étapes", d: "De la carte au passage membre" },
              { k: "Persistance", v: "Checklist", d: "Sauvegardée localement" },
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

      {/* Sticky mini-nav */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-bg) 88%, transparent)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-thin">
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
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

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:py-16">
        {/* Personas */}
        <section data-guide-section="explorer" id="explorer" className="scroll-mt-28">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
                Par où commencer ?
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Clique sur un profil : les liens recommandés et le conseil s&apos;adaptent. Tu peux changer d&apos;avis à tout moment.
              </p>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
              Interactif
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {personas.map((p) => {
              const selected = persona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  aria-pressed={selected}
                  className={`relative overflow-hidden rounded-3xl border p-5 text-left transition duration-300 ${
                    selected ? "shadow-xl" : "hover:-translate-y-1 hover:shadow-lg"
                  }`}
                  style={{
                    borderColor: selected ? "transparent" : "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                    boxShadow: selected ? p.selectedRing : undefined,
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: p.cardGradient }} />
                  <div className="relative">
                    <span className="text-3xl" aria-hidden>
                      {p.emoji}
                    </span>
                    <h3 className="mt-3 text-lg font-bold" style={{ color: "var(--color-text)" }}>
                      {p.titre}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {p.accroche}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="animate-fadeIn relative mt-8 overflow-hidden rounded-3xl border p-6 sm:p-8"
            style={{
              borderColor: "var(--color-border)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--color-card) 92%, #6366f1), var(--color-card) 55%, var(--color-card))",
            }}
            key={persona}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                  Suggestion pour toi
                </p>
                <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--color-text)" }}>
                  {personaData.conseil}
                </p>
              </div>
              <CircleDot className="hidden h-10 w-10 shrink-0 text-violet-400/80 md:block" aria-hidden />
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {personaData.liens.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:border-violet-400/50"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    <span>{l.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Public vs membre toggle */}
        <section className="scroll-mt-28 rounded-3xl border p-6 sm:p-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
                Public ou espace membre ?
              </h2>
              <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Bascule pour voir ce qui change une fois Discord connecté — sans quitter cette page.
              </p>
            </div>
            <div
              className="inline-flex rounded-2xl border p-1"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              role="group"
              aria-label="Mode d'aperçu"
            >
              <button
                type="button"
                aria-pressed={modeApercu === "public"}
                onClick={() => setModeApercu("public")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: modeApercu === "public" ? "var(--color-primary)" : "transparent",
                  color: modeApercu === "public" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                <Eye className="h-4 w-4" aria-hidden />
                Public
              </button>
              <button
                type="button"
                aria-pressed={modeApercu === "membre"}
                onClick={() => setModeApercu("membre")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: modeApercu === "membre" ? "var(--color-primary)" : "transparent",
                  color: modeApercu === "membre" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                <EyeOff className="h-4 w-4" aria-hidden />
                Espace membre
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-2xl border p-5 transition duration-500 ${modeApercu === "public" ? "ring-2 ring-emerald-400/50" : "opacity-60"}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">Accessible sans compte</p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <li>Pages « À propos », fonctionnement, témoignages</li>
                <li>Annuaire, clips, interviews, calendriers lives / events</li>
                <li>Guides en lecture, FAQ, boutique, soutien</li>
              </ul>
            </div>
            <div
              className={`relative overflow-hidden rounded-2xl border p-5 transition duration-500 ${modeApercu === "membre" ? "ring-2 ring-violet-400/50" : "opacity-60"}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Après connexion Discord</p>
              <ul
                className={`mt-3 space-y-2 text-sm transition ${modeApercu === "membre" ? "" : "blur-[2px]"}`}
                style={{ color: "var(--color-text-secondary)" }}
              >
                <li>Tableau de bord personnel et notifications</li>
                <li>Profil, planning, raids, inscriptions événements</li>
                <li>Engagement, objectifs, Academy côté membre…</li>
              </ul>
              {modeApercu === "membre" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/rejoindre/guide-espace-membre"
                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Guide espace membre
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Se connecter
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Menu bento */}
        <section data-guide-section="carte-menu" id="carte-menu" className="scroll-mt-28">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-violet-300"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
                Carte du menu du haut
              </h2>
              <p className="mt-2 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Chaque carte résume un bloc du bandeau. Clique sur le titre pour afficher les sous-pages utiles — comme
                ouvrir le menu déroulant sans quitter le guide.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {menuZones.map((z) => {
              const Icon = z.icon;
              const open = expandedMenu === z.id;
              return (
                <article
                  key={z.id}
                  className="group relative overflow-hidden rounded-3xl border transition hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-40 blur-3xl transition group-hover:opacity-70"
                    style={{ backgroundColor: z.accent }}
                  />
                  <div className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        className="flex flex-1 flex-col items-start text-left"
                        onClick={() => setExpandedMenu((prev) => (prev === z.id ? null : z.id))}
                        aria-expanded={open}
                      >
                        <span
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-white shadow-inner"
                          style={{ borderColor: `${z.accent}66`, background: `linear-gradient(135deg, ${z.accent}, color-mix(in srgb, ${z.accent} 40%, #0f172a))` }}
                        >
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <h3 className="mt-4 text-xl font-bold" style={{ color: "var(--color-text)" }}>
                          {z.titre}
                        </h3>
                        <p className="mt-2 text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {z.court}
                        </p>
                      </button>
                      <ChevronDown
                        className={`mt-2 h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
                        style={{ color: "var(--color-text-secondary)" }}
                        aria-hidden
                      />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {z.detail}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={z.href}
                        className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: z.accent }}
                      >
                        Visiter
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setExpandedMenu((prev) => (prev === z.id ? null : z.id))}
                        className="rounded-xl border px-4 py-2 text-sm font-semibold"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        {open ? "Masquer les liens" : "Voir les sous-pages"}
                      </button>
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-out ${open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                          {z.sousPages.map((sp) => (
                            <Link
                              key={sp.href + sp.label}
                              href={sp.href}
                              className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-white/5"
                              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                            >
                              {sp.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Parcours stepper */}
        <section data-guide-section="parcours" id="parcours" className="scroll-mt-28">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Parcours en 4 étapes
          </h2>
          <p className="mt-2 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Clique sur une étape pour la déplier. L&apos;idée : passer du repérage sur le site à la décision d&apos;ouvrir l&apos;espace
            membre.
          </p>

          <ol className="relative mt-10 space-y-4 border-l-2 pl-8" style={{ borderColor: "var(--color-border)" }}>
            {parcoursEtapes.map((etape, idx) => {
              const open = openParcours === etape.id;
              return (
                <li key={etape.id} className="relative">
                  <span
                    className="absolute -left-[calc(2rem+5px)] top-1 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold"
                    style={{
                      borderColor: open ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: open ? "color-mix(in srgb, var(--color-primary) 25%, var(--color-card))" : "var(--color-card)",
                      color: "var(--color-text)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenParcours((p) => (p === etape.id ? "" : etape.id))}
                    className="flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition hover:border-violet-400/40"
                    style={{
                      borderColor: open ? "color-mix(in srgb, var(--color-primary) 45%, transparent)" : "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                    }}
                    aria-expanded={open}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">{etape.duree}</p>
                        <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                          {etape.titre}
                        </p>
                      </div>
                      <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                    </div>
                    {open ? (
                      <div className="animate-fadeIn mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {etape.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {etape.liens.map((l) =>
                            l.href.startsWith("#") ? (
                              <button
                                key={l.href}
                                type="button"
                                onClick={() => scrollToId(l.href.slice(1))}
                                className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                              >
                                {l.label}
                              </button>
                            ) : (
                              <Link
                                key={l.href}
                                href={l.href}
                                className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                              >
                                {l.label}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Checklist */}
        <section data-guide-section="checklist" id="checklist" className="scroll-mt-28">
          <div
            className="overflow-hidden rounded-3xl border sm:flex"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="border-b p-6 sm:w-72 sm:border-b-0 sm:border-r" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                Checklist express
              </h2>
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Cochée dans ton navigateur — idéal pour une première visite ou pour partager le parcours à un·e ami·e.
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
                    style={{ width: `${checklistProgress.pct}%`, background: "linear-gradient(90deg, #22d3ee, #a78bfa)" }}
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
                      onClick={() => toggleCheck(item.id)}
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
                      {item.href ? (
                        <Link href={item.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:underline">
                          Ouvrir la page
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Extra resources grid */}
        <section className="scroll-mt-28">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Aller plus loin (toujours sans connexion)
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {extraRessources.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.href}
                  className="group relative overflow-hidden rounded-3xl border transition hover:-translate-y-1 hover:shadow-xl"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <Link href={r.href} className="block p-6">
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60"
                      style={{ backgroundColor: r.color }}
                    />
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-white"
                      style={{ borderColor: `${r.color}88`, background: `linear-gradient(135deg, ${r.color}, #0f172a)` }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-bold" style={{ color: "var(--color-text)" }}>
                      {r.titre}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {r.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: r.color }}>
                      Explorer
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                  {r.href === "/vip" ? (
                    <div
                      className="flex flex-wrap gap-2 border-t px-6 pb-5 text-xs"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <Link
                        href="/soutenir-tenf"
                        className="rounded-full border px-2 py-1 font-medium text-cyan-400 hover:underline"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        Soutenir TENF
                      </Link>
                      <Link
                        href="/postuler"
                        className="rounded-full border px-2 py-1 font-medium text-cyan-400 hover:underline"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        Postuler
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
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

        {/* CTA */}
        <section
          data-guide-section="compte"
          id="compte"
          className="scroll-mt-28 overflow-hidden rounded-3xl border p-8 text-center sm:p-12"
          style={{
            borderColor: "color-mix(in srgb, var(--color-primary) 35%, transparent)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-card)), var(--color-card) 55%, color-mix(in srgb, #06b6d4 12%, var(--color-card)))",
          }}
        >
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Prêt·e à ouvrir l&apos;espace membre ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            La partie publique te permet de tout comprendre avant de te connecter. Quand tu es aligné·e avec le fonctionnement,
            passe par Discord : dashboard, profil, raids et inscriptions t&apos;attendent.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--color-primary), #6366f1)" }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Se connecter avec Discord
            </Link>
            <Link
              href="/rejoindre/guide-public"
              className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Lire le guide public
            </Link>
          </div>
        </section>

        <p className="pb-8 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
          D&apos;autres guides suivront dans le menu <span className="font-semibold text-violet-300">Guides &amp; parcours</span>.
        </p>
      </div>
    </div>
  );
}
