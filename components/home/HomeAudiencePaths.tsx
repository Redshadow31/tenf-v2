"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  HeartHandshake,
  LayoutDashboard,
  LogIn,
  Sparkles,
  Users,
} from "lucide-react";

const DISCORD_URL = "https://discord.gg/WnpazgcZHk";

type PathId = "discover" | "join" | "member";

const PATHS: {
  id: PathId;
  title: string;
  subtitle: string;
  icon: typeof Compass;
  accent: string;
  ring: string;
  links: { href: string; label: string; external?: boolean }[];
}[] = [
  {
    id: "discover",
    title: "Je découvre TENF",
    subtitle: "Comprendre le projet sans engagement.",
    icon: Compass,
    accent: "from-violet-600/25 via-fuchsia-600/15 to-transparent",
    ring: "ring-violet-500/35",
    links: [
      { href: "/fonctionnement-tenf/decouvrir", label: "Fonctionnement en 2 minutes" },
      { href: "/a-propos", label: "À propos de la communauté" },
      { href: "/lives", label: "Qui est en live" },
      { href: "/membres", label: "Annuaire des créateurs" },
      { href: "/events2", label: "Événements communautaires" },
    ],
  },
  {
    id: "join",
    title: "Je veux rejoindre",
    subtitle: "Passer de curieux·se à membre du réseau.",
    icon: HeartHandshake,
    accent: "from-rose-600/25 via-orange-600/15 to-transparent",
    ring: "ring-rose-500/35",
    links: [
      { href: DISCORD_URL, label: "Discord TENF", external: true },
      { href: "/integration", label: "Sessions d’intégration" },
      { href: "/rejoindre/guide-integration", label: "Guide d’intégration" },
      { href: "/rejoindre/faq", label: "FAQ rejoindre" },
      { href: "/postuler", label: "Postuler / manifester son intérêt" },
    ],
  },
  {
    id: "member",
    title: "Je suis déjà membre",
    subtitle: "Accès rapide à l’espace connecté et aux repères.",
    icon: LayoutDashboard,
    accent: "from-cyan-600/22 via-sky-600/14 to-transparent",
    ring: "ring-cyan-500/35",
    links: [
      { href: "/auth/login", label: "Connexion Discord" },
      { href: "/member/dashboard", label: "Tableau de bord membre" },
      { href: "/rejoindre/guide-espace-membre/fonctionnalites-principales", label: "Fonctionnalités de l’espace" },
      { href: "/member/evenements", label: "Planning événements (membre)" },
      { href: "/soutenir-tenf", label: "Soutenir TENF" },
    ],
  },
];

export default function HomeAudiencePaths() {
  const [active, setActive] = useState<PathId>("discover");

  return (
    <section className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-6" id="accueil-parcours-visiteurs">
      <div className="max-w-3xl space-y-2">
        <p className="home-kicker flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
          <Users className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          Par où commencer ?
        </p>
        <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-4xl">
          Un même site pour le grand public et les membres TENF
        </h2>
        <p className="home-muted text-sm leading-relaxed sm:text-base">
          Choisis ton profil : on te propose les pages les plus utiles. Tu peux changer d’onglet à tout moment.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-card)_65%,transparent)] p-2"
        role="tablist"
        aria-label="Parcours selon ton profil"
      >
        {PATHS.map((p) => {
          const Icon = p.icon;
          const selected = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(p.id)}
              className={`flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition sm:min-w-0 sm:flex-none sm:px-4 sm:text-sm ${
                selected
                  ? "bg-[color-mix(in_srgb,var(--color-primary)_25%,var(--color-card))] text-[var(--color-text)] shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-bg)_50%,var(--color-card))]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="hidden sm:inline">{p.title}</span>
              <span className="sm:hidden">{p.title.replace("Je ", "")}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PATHS.map((p) => {
          if (p.id !== active) return null;
          const Icon = p.icon;
          return (
            <article
              key={p.id}
              role="tabpanel"
              className={`home-audience-panel about-reveal is-visible rounded-3xl border bg-gradient-to-br p-5 shadow-xl ring-1 sm:p-7 lg:col-span-3 ${p.accent} ${p.ring}`}
              style={{ borderColor: "var(--color-border)", animationDelay: "0ms" }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-bg)_40%,transparent)] ring-1 ring-white/10">
                    <Icon className="h-7 w-7 text-[var(--color-primary)]" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-2xl">{p.title}</h3>
                    <p className="home-muted mt-1 max-w-xl text-sm sm:text-base">{p.subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {p.id === "member" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-200">
                      <LogIn className="h-3.5 w-3.5" aria-hidden />
                      Connexion requise
                    </span>
                  ) : null}
                  {p.id === "join" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-100">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      Intégration encadrée
                    </span>
                  ) : null}
                  {p.id === "discover" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/35 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-100">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden />
                      100 % public
                    </span>
                  ) : null}
                </div>
              </div>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {p.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="group flex items-center justify-between gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-border)_90%,transparent)] bg-[color-mix(in_srgb,var(--color-bg)_35%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-card))]"
                    >
                      <span className="line-clamp-2">{link.label}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
