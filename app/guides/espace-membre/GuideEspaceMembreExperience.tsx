"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  ClipboardList,
  Cog,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  MousePointerClick,
  Sparkles,
  Target,
  UserCircle,
  Zap,
} from "lucide-react";
import {
  checklistItems,
  extraRessources,
  faqItems,
  memberZones,
  parcoursEtapes,
  personas,
  type PersonaId,
} from "./guideEspaceMembreData";

const GUIDE_SECTION_ATTR = "data-guide-section";
const STORAGE_CHECKLIST = "tenf:guide-espace-membre:checklist:v1";

const navItems = [
  { id: "profils", label: "Profils" },
  { id: "acces", label: "Accès" },
  { id: "carte-sidebar", label: "Barre membre" },
  { id: "parcours", label: "Parcours" },
  { id: "checklist", label: "Checklist" },
  { id: "faq", label: "FAQ" },
  { id: "actions", label: "Connexion" },
] as const;

const ZONE_ICONS: Record<string, LucideIcon> = {
  "espace-membre": LayoutDashboard,
  "mon-profil": UserCircle,
  "participation-tenf": Zap,
  "objectifs-activite": Target,
  "academy-progression": GraduationCap,
  evaluation: ClipboardList,
  compte: Cog,
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function GuideEspaceMembreExperience() {
  const [persona, setPersona] = useState<PersonaId>("debuter");
  const [expandedZone, setExpandedZone] = useState<string | null>(memberZones[0]?.id ?? null);
  const [openParcours, setOpenParcours] = useState<string>(parcoursEtapes[0]?.id ?? "");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [modeLecture, setModeLecture] = useState<"visiteur" | "membre">("visiteur");
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
      <section
        id="top"
        className="relative overflow-hidden border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90 motion-safe:animate-mesh"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 15% 15%, rgba(99, 102, 241, 0.38), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 25%, rgba(245, 158, 11, 0.22), transparent 50%), radial-gradient(ellipse 55% 45% at 50% 100%, rgba(52, 211, 153, 0.16), transparent 45%)",
          }}
        />
        <div className="pointer-events-none absolute -right-28 top-8 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl motion-safe:animate-mesh" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl motion-safe:animate-mesh" />

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
              Page publique · liens /member avec session
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: "var(--color-text)" }}>
            Carte interactive de l&apos;
            <span className="bg-gradient-to-r from-amber-200 via-violet-200 to-emerald-200 bg-clip-text text-transparent">
              espace membre
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Tu peux lire ce guide sans être connecté : il explique la barre latérale (et le menu mobile), propose des
            profils types, une checklist et des liens vers les pages <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">/member/…</code>.
            Une fois connecté avec Discord, ces liens affichent tes données personnelles.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToId("profils")}
              className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              <MousePointerClick className="h-4 w-4 transition group-hover:rotate-[-8deg]" aria-hidden />
              Choisir mon profil
            </button>
            <Link
              href="/member/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--color-text)" }}
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Ouvrir le dashboard
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--color-text)" }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Me connecter
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Aligné sur", v: "Menu membre", d: "Même structure que la sidebar officielle" },
              { k: "Parcours", v: "4 étapes", d: "Connexion → navigation → profil → guide" },
              { k: "Checklist", v: "6 actions", d: "Sauvegardée dans ton navigateur" },
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
        <section data-guide-section="profils" id="profils" className="scroll-mt-28">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
                Quel membre es-tu aujourd&apos;hui ?
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Les liens recommandés changent selon ton intention : démarrage, participation active, ou progression
                longue durée.
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
                "linear-gradient(135deg, color-mix(in srgb, var(--color-card) 90%, #6366f1), var(--color-card) 55%, var(--color-card))",
            }}
            key={persona}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                  Piste conseillée
                </p>
                <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--color-text)" }}>
                  {personaData.conseil}
                </p>
              </div>
              <CircleDot className="hidden h-10 w-10 shrink-0 text-amber-300/90 md:block" aria-hidden />
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {personaData.liens.map((l) => (
                <li key={l.href + l.label}>
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

        <section data-guide-section="acces" id="acces" className="scroll-mt-28 rounded-3xl border p-6 sm:p-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
                Lire ce guide ou ouvrir l&apos;espace membre ?
              </h2>
              <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Ce guide reste une page publique. Les URLs <strong style={{ color: "var(--color-text)" }}>/member</strong> ne
                dévoilent ton contenu perso qu&apos;avec une session Discord active.
              </p>
            </div>
            <div
              className="inline-flex rounded-2xl border p-1"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              role="group"
              aria-label="Mode de lecture"
            >
              <button
                type="button"
                aria-pressed={modeLecture === "visiteur"}
                onClick={() => setModeLecture("visiteur")}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: modeLecture === "visiteur" ? "var(--color-primary)" : "transparent",
                  color: modeLecture === "visiteur" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                Visiteur
              </button>
              <button
                type="button"
                aria-pressed={modeLecture === "membre"}
                onClick={() => setModeLecture("membre")}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: modeLecture === "membre" ? "var(--color-primary)" : "transparent",
                  color: modeLecture === "membre" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                Membre connecté
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-2xl border p-5 transition duration-500 ${modeLecture === "visiteur" ? "ring-2 ring-amber-400/45" : "opacity-60"}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Tu lis le guide</p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <li>Tu prépares ton parcours ou partages le lien à un·e futur·e membre.</li>
                <li>Les liens /member peuvent afficher une invitation à te connecter.</li>
                <li>Combine avec le guide pas à pas sous Rejoindre pour les captures d’écran.</li>
              </ul>
            </div>
            <div
              className={`rounded-2xl border p-5 transition duration-500 ${modeLecture === "membre" ? "ring-2 ring-violet-400/45" : "opacity-60"}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Session Discord active</p>
              <ul
                className={`mt-3 space-y-2 text-sm transition ${modeLecture === "membre" ? "" : "blur-[1.5px]"}`}
                style={{ color: "var(--color-text-secondary)" }}
              >
                <li>Dashboard, notifications et profil reflètent ton compte.</li>
                <li>Raids, inscriptions et présences sont liés à ton identité TENF.</li>
                <li>Les outils admin n’apparaissent que si ton rôle le permet.</li>
              </ul>
              {modeLecture === "membre" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/member/dashboard" className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-95">
                    Dashboard
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Connexion
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section data-guide-section="carte-sidebar" id="carte-sidebar" className="scroll-mt-28">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-amber-200"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
                Barre latérale &amp; menu mobile
              </h2>
              <p className="mt-2 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Les blocs ci-dessous reprennent les sections du menu membre (hors administration). Déplie chaque carte
                pour voir les liens regroupés comme dans la navigation.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {memberZones.map((z) => {
              const Icon = ZONE_ICONS[z.id] ?? LayoutGrid;
              const open = expandedZone === z.id;
              const primaryHref = z.groupes[0]?.liens[0]?.href ?? "/member/dashboard";
              return (
                <article
                  key={z.id}
                  className="group relative overflow-hidden rounded-3xl border transition hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-35 blur-3xl transition group-hover:opacity-65"
                    style={{ backgroundColor: z.accent }}
                  />
                  <div className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        className="flex flex-1 flex-col items-start text-left"
                        onClick={() => setExpandedZone((prev) => (prev === z.id ? null : z.id))}
                        aria-expanded={open}
                      >
                        <span
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-white shadow-inner"
                          style={{
                            borderColor: `${z.accent}66`,
                            background: `linear-gradient(135deg, ${z.accent}, color-mix(in srgb, ${z.accent} 40%, #0f172a))`,
                          }}
                        >
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <h3 className="mt-4 text-xl font-bold" style={{ color: "var(--color-text)" }}>
                          {z.titre}
                        </h3>
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
                        href={primaryHref}
                        className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: z.accent }}
                      >
                        Entrer dans la section
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setExpandedZone((prev) => (prev === z.id ? null : z.id))}
                        className="rounded-xl border px-4 py-2 text-sm font-semibold"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        {open ? "Replier les liens" : "Voir tous les liens"}
                      </button>
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-out ${open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                          {z.groupes.map((g) => (
                            <div key={g.titre}>
                              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                                {g.titre}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {g.liens.map((sp) => (
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

        <section data-guide-section="parcours" id="parcours" className="scroll-mt-28">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Parcours en 4 étapes
          </h2>
          <p className="mt-2 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            De la connexion à la lecture du guide pédagogique : clique sur une étape pour afficher le détail.
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
                    className="flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition hover:border-amber-400/35"
                    style={{
                      borderColor: open ? "color-mix(in srgb, var(--color-primary) 45%, transparent)" : "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                    }}
                    aria-expanded={open}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">{etape.duree}</p>
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

        <section data-guide-section="checklist" id="checklist" className="scroll-mt-28">
          <div
            className="overflow-hidden rounded-3xl border sm:flex"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="border-b p-6 sm:w-72 sm:border-b-0 sm:border-r" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                Première semaine
              </h2>
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Coches sauvegardées localement : idéal pour ne rien oublier après ton arrivée.
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
                    style={{ width: `${checklistProgress.pct}%`, background: "linear-gradient(90deg, #a78bfa, #34d399)" }}
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
                      <Link href={item.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:underline">
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

        <section className="scroll-mt-28">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            Ressources liées
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
                      Ouvrir
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </div>
              );
            })}
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
          data-guide-section="actions"
          id="actions"
          className="scroll-mt-28 overflow-hidden rounded-3xl border p-8 text-center sm:p-12"
          style={{
            borderColor: "color-mix(in srgb, var(--color-primary) 35%, transparent)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-card)), var(--color-card) 55%, color-mix(in srgb, #f59e0b 10%, var(--color-card)))",
          }}
        >
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
            À toi de jouer
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Connecte-toi pour activer les pages membre, ou reviens sur la carte du site public si tu veux partager TENF
            autour de toi.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--color-primary), #7c3aed)" }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Connexion Discord
            </Link>
            <Link
              href="/member/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Tableau de bord
            </Link>
            <Link
              href="/guides/partie-publique"
              className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Guide partie publique
            </Link>
          </div>
        </section>

        <p className="pb-8 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Navigation membre alignée sur <span className="font-semibold text-violet-300">lib/navigation/memberSidebar.ts</span> — en
          cas d’évolution du menu, cette page peut être ajustée.
        </p>
      </div>
    </div>
  );
}
