"use client";

import Link from "next/link";
import {
  OrganisationStaffLeftRail,
  OrganisationStaffRightRail,
  type StaffPageNavId,
} from "@/components/organisation-staff/OrganisationStaffPublicRails";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CircleDot,
  GitBranch,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  STAFF_NOMENCLATURE_EXPLAINER,
  STAFF_POLES,
  STAFF_ROLES,
  STAFF_ROLE_FAMILIES,
  type StaffRoleFamily,
} from "@/lib/staff/staffNomenclature";

type Audience = "public" | "member";

const NAV: Array<{ id: StaffPageNavId; label: string }> = [
  { id: "staff-journey", label: "Parcours" },
  { id: "staff-roles", label: "Rôles" },
  { id: "staff-poles", label: "Pôles" },
  { id: "staff-logic", label: "Rôles & pôles" },
  { id: "staff-faq", label: "FAQ" },
];

const familyToSection: Record<StaffRoleFamily, string> = {
  direction: "staff-roles",
  coordination: "staff-roles",
  moderation: "staff-roles",
  appui: "staff-roles",
};

const FAQ_ITEMS: Array<{
  q: string;
  a: string;
  tag: string;
  accent: string;
  Icon: LucideIcon;
}> = [
  {
    q: "Je suis nouveau : à qui m'adresser en premier ?",
    a: "Le Pôle Parcours Membres pilote l'accueil et l'intégration ; les modérateurs veillent au cadre. Pour une question précise, le salon adapté sur Discord reste le canal le plus rapide.",
    tag: "Premiers pas",
    accent: "#22c55e",
    Icon: MapPin,
  },
  {
    q: "Quelle différence entre Modérateur TENF et Soutien TENF ?",
    a: "Le Modérateur TENF est un membre confirmé du staff qui fait respecter le cadre et accompagne au quotidien. Le Soutien TENF aide ponctuellement ou régulièrement sur une mission précise, sans exercer de modération active.",
    tag: "Rôles",
    accent: "#a855f7",
    Icon: Shield,
  },
  {
    q: "Quelle différence entre un rôle staff et un pôle de mission ?",
    a: "Le rôle indique ta place dans l'équipe (par exemple : Modérateur TENF). Le pôle indique où tu agis concrètement (par exemple : Pôle Parcours Membres). Une personne peut cumuler un rôle et un ou plusieurs pôles.",
    tag: "Organisation",
    accent: "#6366f1",
    Icon: GitBranch,
  },
  {
    q: "Comment savoir qui fait quoi ?",
    a: "L'organigramme interactif liste les membres du staff, leurs rôles et leurs rattachements aux pôles — idéal pour repérer un contact.",
    tag: "Organigramme",
    accent: "#3b82f6",
    Icon: Users,
  },
  {
    q: "Les pôles recrutent-ils en continu ?",
    a: "Les besoins varient selon les saisons et les projets. Les opportunités sont généralement annoncées sur le serveur ; rester actif et bienveillant est le meilleur premier pas.",
    tag: "Rejoindre l'équipe",
    accent: "#f59e0b",
    Icon: UserPlus,
  },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function OrganisationStaffClient() {
  const [audience, setAudience] = useState<Audience>("public");
  const [activeNav, setActiveNav] = useState<string>(NAV[0].id);
  const [openPole, setOpenPole] = useState<number | null>(0);
  const [openRole, setOpenRole] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const skipSpyUntil = useRef(0);

  const navIds = useMemo(() => NAV.map((n) => n.id), []);

  const updateSpy = useCallback(() => {
    if (typeof window === "undefined") return;
    if (Date.now() < skipSpyUntil.current) return;
    const marker = window.scrollY + 160;
    let current = navIds[0];
    for (const id of navIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = id;
    }
    setActiveNav(current);
  }, [navIds]);

  useEffect(() => {
    updateSpy();
    window.addEventListener("scroll", updateSpy, { passive: true });
    window.addEventListener("resize", updateSpy, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateSpy);
      window.removeEventListener("resize", updateSpy);
    };
  }, [updateSpy]);

  const goTo = (id: StaffPageNavId) => {
    skipSpyUntil.current = Date.now() + 700;
    setActiveNav(id);
    scrollToId(id);
  };

  const togglePole = (i: number) => {
    setOpenPole((prev) => (prev === i ? null : i));
  };

  const toggleRole = (i: number) => {
    setOpenRole((prev) => (prev === i ? null : i));
  };

  const toggleFaq = (i: number) => {
    setOpenFaq((prev) => (prev === i ? null : i));
  };

  const totalRoles = STAFF_ROLES.length;
  const totalPoles = STAFF_POLES.length;

  return (
    <main className="org-staff-page relative min-h-screen w-full overflow-x-hidden py-6 sm:py-8 lg:py-10" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="org-staff-mesh" aria-hidden="true" />
      <div className="org-staff-glow org-staff-glow-left" aria-hidden="true" />
      <div className="org-staff-glow org-staff-glow-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,1920px)] px-[clamp(0.65rem,1.35vw,1.85rem)]">
        <nav
          className="org-staff-fade-up mb-6 flex flex-wrap items-center gap-2 text-sm"
          aria-label="Fil d'Ariane"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <Link href="/" className="transition hover:underline" style={{ color: "var(--color-text-secondary)" }}>
            Accueil
          </Link>
          <ChevronRight size={14} className="opacity-50" aria-hidden />
          <span style={{ color: "var(--color-text)" }}>Staff &amp; organisation</span>
        </nav>

        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-12 org-staff-fade-up mb-8 lg:mb-10"
          style={{
            borderColor: "var(--color-border)",
            background:
              "radial-gradient(120% 130% at 10% 0%, rgba(59,130,246,0.22), rgba(15,23,42,0.15) 38%, rgba(2,6,23,0.82) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl opacity-90"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent 72%)",
            }}
          />
          <div className="relative max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                Rôles staff &amp; pôles de mission
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-5xl md:leading-tight" style={{ color: "var(--color-text)" }}>
                Une équipe bénévole, structurée et bienveillante
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                Découvre comment l&apos;équipe de TENF est organisée : huit rôles principaux qui indiquent ta place dans l&apos;équipe
                et neuf pôles de mission qui indiquent où tu agis. Une même personne peut cumuler un rôle et un ou plusieurs pôles.
              </p>

              <div
                className="mt-8 inline-flex rounded-2xl border p-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
                role="tablist"
                aria-label="Profil de lecture"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === "public"}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: audience === "public" ? "var(--color-primary)" : "transparent",
                    color: audience === "public" ? "white" : "var(--color-text-secondary)",
                  }}
                  onClick={() => setAudience("public")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} aria-hidden />
                    Je découvre TENF
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === "member"}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: audience === "member" ? "var(--color-primary)" : "transparent",
                    color: audience === "member" ? "white" : "var(--color-text-secondary)",
                  }}
                  onClick={() => setAudience("member")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Users size={16} aria-hidden />
                    Je suis membre
                  </span>
                </button>
              </div>

              <div
                className="mt-4 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
                style={{ borderColor: "rgba(59,130,246,0.25)", backgroundColor: "rgba(15,23,42,0.45)" }}
              >
                {audience === "public" ? (
                  <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text)" }}>Pour le grand public :</strong> cette page présente la structure
                    de TENF sans détails internes. Pour découvrir les visages et rôles réels, l&apos;organigramme est filtrable par
                    famille de rôle et par pôle.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text)" }}>Pour les membres :</strong> retrouve rapidement qui porte quoi.
                    Les fiches pôles incluent un repère quotidien pour t&apos;orienter sur Discord.
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/organisation-staff/organigramme"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--color-primary)", color: "white", boxShadow: "0 12px 30px rgba(59,130,246,0.25)" }}
                >
                  Organigramme interactif
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => goTo("staff-journey")}
                  className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Parcourir la structure
                  <ArrowDown size={16} aria-hidden />
                </button>
                {audience === "member" ? (
                  <Link
                    href="/member/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    <LayoutDashboard size={16} aria-hidden />
                    Espace membre
                  </Link>
                ) : (
                  <Link
                    href="/fonctionnement-tenf/decouvrir"
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    Fonctionnement TENF
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                )}
              </div>
          </div>
        </section>

        <div className="org-staff-workspace grid grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2.4fr)_minmax(250px,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(240px,18rem)_minmax(0,1fr)_minmax(280px,22rem)] xl:gap-6 2xl:grid-cols-[minmax(260px,20rem)_minmax(0,1fr)_minmax(300px,24rem)]">
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:z-10 lg:self-start lg:pr-1">
            <OrganisationStaffLeftRail audience={audience} activeNav={activeNav} onGoTo={goTo} />
          </aside>
          <div className="min-w-0 space-y-8">
            <details className="org-staff-fade-up rounded-2xl border p-4 lg:hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}>
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text)" }}>Guide &amp; navigation</summary>
              <div className="mt-4"><OrganisationStaffLeftRail audience={audience} activeNav={activeNav} onGoTo={goTo} /></div>
            </details>

        {/* Parcours visuel — familles de rôles */}
        <section id="staff-journey" className="scroll-mt-28 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Lecture guidée
              </p>
              <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
                Quatre familles, une équipe alignée
              </h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Clique une famille pour accéder aux rôles détaillés — la grille s&apos;adapte à la largeur de ton écran.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="org-staff-family-grid grid gap-4 pb-1 pt-1 grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
              {STAFF_ROLE_FAMILIES.map((family, i) => {
                const Icon = family.Icon;
                const count = STAFF_ROLES.filter((r) => r.family === family.key).length;
                return (
                  <div key={family.key} className="relative min-w-0">
                    {i < STAFF_ROLE_FAMILIES.length - 1 ? (
                      <div
                        className="pointer-events-none absolute right-[-10px] top-[52px] z-0 hidden h-[2px] w-[calc(100%+10px)] md:block"
                        style={{
                          background: `linear-gradient(90deg, ${family.accent}, transparent)`,
                          opacity: 0.45,
                        }}
                        aria-hidden
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => goTo(familyToSection[family.key])}
                      className="org-staff-step relative z-[1] flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      style={{
                        borderColor: `${family.accent}55`,
                        background: `linear-gradient(145deg, ${family.accent}22, rgba(15,23,42,0.92) 42%, rgba(2,6,23,0.96) 100%)`,
                        boxShadow: "0 16px 36px rgba(2,6,23,0.28)",
                      }}
                    >
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${family.accent}33`, color: family.accent }}
                      >
                        <Icon size={22} strokeWidth={2} aria-hidden />
                      </span>
                      <span className="mt-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: family.accent }}>
                        {count} rôle{count > 1 ? "s" : ""}
                      </span>
                      <span className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        {family.label}
                      </span>
                      <span className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {family.caption}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: family.accent }}>
                        Voir les rôles
                        <ArrowRight size={14} aria-hidden />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Rôles staff — 8 cartes en accordéon */}
        <section id="staff-roles" className="scroll-mt-28 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Rôles principaux du staff
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Huit rôles pour bien se situer dans l&apos;équipe
          </h2>
          <p className="max-w-3xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Chaque rôle indique la <strong style={{ color: "var(--color-text)" }}>place</strong> d&apos;une personne dans l&apos;équipe
            staff (direction, coordination, modération, appui). Ouvre une carte pour découvrir ses missions concrètes.
          </p>

          <div className="org-staff-accordion-grid grid gap-3 xl:grid-cols-2">
            {STAFF_ROLES.map((role, i) => {
              const Icon = role.Icon;
              const expanded = openRole === i;
              return (
                <div
                  key={role.key}
                  className="overflow-hidden rounded-2xl border transition-shadow duration-200"
                  style={{
                    borderColor: expanded ? `${role.accent}88` : `${role.accent}44`,
                    background: expanded
                      ? `linear-gradient(135deg, ${role.accent}28, rgba(15,23,42,0.95) 45%, rgba(2,6,23,0.98) 100%)`
                      : `linear-gradient(135deg, ${role.accent}14, rgba(15,23,42,0.92) 50%, rgba(2,6,23,0.96) 100%)`,
                    boxShadow: expanded ? `0 18px 40px ${role.accent}22` : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleRole(i)}
                    className="flex w-full items-start gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    aria-expanded={expanded}
                  >
                    <span
                      className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${role.accent}35`, color: role.accent }}
                    >
                      <Icon size={24} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        {role.label}
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm md:line-clamp-none" style={{ color: "var(--color-text-secondary)" }}>
                        {role.short}
                      </span>
                    </span>
                    <ChevronDown
                      size={22}
                      className="mt-1 shrink-0 transition-transform duration-200"
                      style={{
                        color: role.accent,
                        transform: expanded ? "rotate(180deg)" : undefined,
                      }}
                      aria-hidden
                    />
                  </button>
                  {expanded ? (
                    <div className="border-t px-5 pb-5 pt-0" style={{ borderColor: `${role.accent}33` }}>
                      <p className="pt-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {role.description}
                      </p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide" style={{ color: role.accent }}>
                        Missions clés
                      </p>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {role.missions.map((mission) => (
                          <li
                            key={mission}
                            className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                            style={{
                              borderColor: `${role.accent}33`,
                              backgroundColor: "rgba(2,6,23,0.45)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <CircleDot size={14} className="mt-0.5 shrink-0" style={{ color: role.accent }} aria-hidden />
                            <span>{mission}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Pôles de mission — 9 cartes en accordéon */}
        <section id="staff-poles" className="scroll-mt-28 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Pôles de mission
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Neuf pôles, neuf domaines d&apos;action
          </h2>
          <p className="max-w-3xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Chaque pôle est une équipe de bénévoles centrée sur un <strong style={{ color: "var(--color-text)" }}>domaine concret</strong> :
            vision, coordination, vie staff, formation, parcours membres, animations, image, outils, situations sensibles.{" "}
            {audience === "member" ? "La ligne « Repère membre » résume l'usage au quotidien." : null}
          </p>

          <div className="org-staff-accordion-grid grid gap-3 xl:grid-cols-2">
            {STAFF_POLES.map((pole, i) => {
              const Icon = pole.Icon;
              const expanded = openPole === i;
              return (
                <div
                  key={pole.key}
                  className="overflow-hidden rounded-2xl border transition-shadow duration-200"
                  style={{
                    borderColor: expanded ? `${pole.accent}88` : `${pole.accent}44`,
                    background: expanded
                      ? `linear-gradient(135deg, ${pole.accent}28, rgba(15,23,42,0.95) 45%, rgba(2,6,23,0.98) 100%)`
                      : `linear-gradient(135deg, ${pole.accent}14, rgba(15,23,42,0.92) 50%, rgba(2,6,23,0.96) 100%)`,
                    boxShadow: expanded ? `0 18px 40px ${pole.accent}22` : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => togglePole(i)}
                    className="flex w-full items-start gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    aria-expanded={expanded}
                  >
                    <span
                      className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${pole.accent}35`, color: pole.accent }}
                    >
                      <Icon size={24} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        {pole.label}
                        {pole.restricted ? (
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ borderColor: `${pole.accent}88`, color: pole.accent, backgroundColor: `${pole.accent}1a` }}
                          >
                            Restreint
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm md:line-clamp-none" style={{ color: "var(--color-text-secondary)" }}>
                        {pole.tagline}
                      </span>
                    </span>
                    <ChevronDown
                      size={22}
                      className="mt-1 shrink-0 transition-transform duration-200"
                      style={{
                        color: pole.accent,
                        transform: expanded ? "rotate(180deg)" : undefined,
                      }}
                      aria-hidden
                    />
                  </button>
                  {expanded ? (
                    <div className="border-t px-5 pb-5 pt-0" style={{ borderColor: `${pole.accent}33` }}>
                      <p className="pt-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {pole.description}
                      </p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide" style={{ color: pole.accent }}>
                        Missions du pôle
                      </p>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {pole.missions.map((mission) => (
                          <li
                            key={mission}
                            className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                            style={{
                              borderColor: `${pole.accent}33`,
                              backgroundColor: "rgba(2,6,23,0.45)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <CircleDot size={14} className="mt-0.5 shrink-0" style={{ color: pole.accent }} aria-hidden />
                            <span>{mission}</span>
                          </li>
                        ))}
                      </ul>
                      {audience === "member" ? (
                        <div
                          className="mt-4 rounded-xl border px-4 py-3 text-sm"
                          style={{ borderColor: `${pole.accent}44`, backgroundColor: "rgba(2,6,23,0.45)" }}
                        >
                          <span className="font-semibold" style={{ color: pole.accent }}>
                            Repère membre ·{" "}
                          </span>
                          <span style={{ color: "var(--color-text-secondary)" }}>{pole.memberTip}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section logique : rôle + pôle(s) */}
        <section
          id="staff-logic"
          className="scroll-mt-28 rounded-3xl border p-6 md:p-10"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(120deg, rgba(59,130,246,0.18), rgba(2,6,23,0.92) 48%, rgba(124,58,237,0.2) 100%)",
          }}
        >
          <p
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ borderColor: "rgba(59,130,246,0.45)", color: "#93c5fd", backgroundColor: "rgba(59,130,246,0.12)" }}
          >
            <Lightbulb size={14} aria-hidden />
            Comprendre la logique
          </p>
          <h2 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            <Workflow size={26} className="shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden />
            Un rôle principal + un ou plusieurs pôles
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {STAFF_NOMENCLATURE_EXPLAINER.intro}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div
              className="rounded-2xl border p-5"
              style={{ borderColor: "rgba(59,130,246,0.35)", backgroundColor: "rgba(15,23,42,0.55)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#93c5fd" }}>
                Exemples concrets
              </p>
              <ul className="mt-3 space-y-2">
                {STAFF_NOMENCLATURE_EXPLAINER.examples.map((example) => (
                  <li
                    key={example}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <ArrowRight size={14} className="mt-1 shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl border p-5"
              style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(15,23,42,0.55)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#86efac" }}>
                Esprit TENF
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {STAFF_NOMENCLATURE_EXPLAINER.philosophy}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: "#86efac" }}>
                <HeartHandshake size={16} aria-hidden />
                Entraide · Cadre sain · Bienveillance
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/organisation-staff/organigramme"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            >
              Voir l&apos;organigramme staff
              <ArrowRight size={15} aria-hidden />
            </Link>
            <Link
              href="/a-propos"
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Découvrir la communauté
            </Link>
            <Link
              href="/fonctionnement-tenf/decouvrir"
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Fonctionnement TENF
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="staff-faq" className="org-panel-faq org-staff-fade-up scroll-mt-28 pb-4">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.07] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)] md:p-8"
            style={{
              background:
                "linear-gradient(155deg, rgba(99,102,241,0.14) 0%, rgba(15,23,42,0.55) 38%, rgba(2,6,23,0.92) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%)" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/45 to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-300">
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  Questions fréquentes
                </p>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
                  Membres &amp; curieux : les bases
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                  Les réponses essentielles sur les rôles, les pôles et la façon de contacter l&apos;équipe TENF.
                </p>
              </div>
              <Link
                href="/organisation-staff/organigramme"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/50 hover:bg-violet-500/20"
              >
                Voir l&apos;organigramme
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="org-faq-list relative mt-6 grid gap-3 xl:grid-cols-2">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              const ItemIcon = item.Icon;
              return (
                <div
                  key={item.q}
                  className={`org-faq-item relative overflow-hidden rounded-2xl border transition-all duration-300 ${open ? "org-faq-item--open" : ""}`}
                  style={{
                    borderColor: open ? `${item.accent}66` : "rgba(148,163,184,0.2)",
                    background: open
                      ? `linear-gradient(135deg, ${item.accent}18 0%, rgba(15,23,42,0.92) 42%, rgba(2,6,23,0.98) 100%)`
                      : "linear-gradient(135deg, rgba(30,41,59,0.45) 0%, rgba(2,6,23,0.75) 100%)",
                    boxShadow: open ? `0 14px 36px ${item.accent}22` : "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => toggleFaq(i)}
                    className="flex w-full items-start gap-4 p-4 text-left sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    aria-expanded={open}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
                      style={{ backgroundColor: `${item.accent}22`, color: item.accent }}
                    >
                      <ItemIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ borderColor: `${item.accent}44`, color: item.accent, backgroundColor: `${item.accent}12` }}
                      >
                        {item.tag}
                      </span>
                      <span className="mt-2 block text-base font-semibold leading-snug sm:text-[17px]" style={{ color: "var(--color-text)" }}>
                        {item.q}
                      </span>
                    </span>
                    <span
                      className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08]"
                      style={{
                        backgroundColor: open ? `${item.accent}25` : "rgba(2,6,23,0.5)",
                        color: open ? item.accent : "var(--color-text-secondary)",
                      }}
                    >
                      <ChevronDown
                        size={18}
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
                      <div className="border-t px-4 pb-5 pt-0 sm:px-5" style={{ borderColor: `${item.accent}33` }}>
                        <p className="pt-4 text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
            <div
              className="relative mt-6 flex flex-col gap-3 rounded-2xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "rgba(148,163,184,0.25)", backgroundColor: "rgba(0,0,0,0.2)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-text)" }}>Besoin d&apos;aller plus loin ?</strong> Parcours les {totalRoles} rôles et {totalPoles} pôles dans les sections ci-dessus.
              </p>
              <button
                type="button"
                onClick={() => goTo("staff-roles")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              >
                Voir les rôles
                <ArrowDown size={16} className="-rotate-90" aria-hidden />
              </button>
            </div>
          </div>
        </section>

            <details
              className="org-staff-fade-up rounded-2xl border p-4 lg:hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
            >
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Stats, organigramme &amp; aide
              </summary>
              <div className="mt-4">
                <OrganisationStaffRightRail audience={audience} totalRoles={totalRoles} totalPoles={totalPoles} onGoTo={goTo} />
              </div>
            </details>
          </div>
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:z-10 lg:self-start lg:pl-1">
            <OrganisationStaffRightRail audience={audience} totalRoles={totalRoles} totalPoles={totalPoles} onGoTo={goTo} />
          </aside>
        </div>
      </div>

      <style jsx>{`
        .org-staff-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image:
            radial-gradient(circle at 18% 18%, rgba(59, 130, 246, 0.14), transparent 38%),
            radial-gradient(circle at 82% 12%, rgba(99, 102, 241, 0.12), transparent 32%),
            radial-gradient(circle at 72% 78%, rgba(168, 85, 247, 0.1), transparent 38%);
        }

        .org-staff-glow {
          position: absolute;
          width: 320px;
          height: 320px;
          filter: blur(88px);
          pointer-events: none;
          opacity: 0.22;
          animation: orgStaffFloat 9s ease-in-out infinite;
        }

        .org-staff-page {
          width: 100%;
        }

        .org-staff-workspace {
          width: 100%;
        }

        @media (min-width: 1024px) {
          .org-staff-workspace > aside {
            border-radius: 1rem;
            border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
            background: linear-gradient(
              180deg,
              rgba(2, 6, 23, 0.55) 0%,
              rgba(2, 6, 23, 0.28) 100%
            );
            padding: 0.65rem;
          }
        }

        .org-staff-glow-left {
          left: max(-80px, calc(50% - 52rem));
          top: 120px;
          background: rgba(59, 130, 246, 0.4);
        }

        .org-staff-glow-right {
          right: max(-80px, calc(50% - 52rem));
          bottom: 80px;
          background: rgba(124, 58, 237, 0.42);
          animation-delay: 1.4s;
        }

        .org-staff-fade-up {
          opacity: 0;
          transform: translateY(12px);
          animation: orgStaffFadeUp 0.6s ease forwards;
        }

        .org-staff-stat:focus-within,
        .org-staff-step:focus-visible {
          outline: none;
        }

        .org-faq-item:hover:not(.org-faq-item--open) {
          border-color: rgba(148, 163, 184, 0.35);
          transform: translateY(-1px);
        }

        .org-faq-item--open {
          transform: translateY(-2px);
        }

        @keyframes orgStaffFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgStaffFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-16px);
          }
        }
      `}</style>
    </main>
  );
}
