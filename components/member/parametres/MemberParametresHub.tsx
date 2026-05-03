"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Loader2,
  Palette,
  Shield,
  Sparkles,
  UserCircle2,
  Zap,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";

const accentStyles = {
  violet: {
    border: "border-l-violet-500",
    iconWrap: "border-violet-400/35 bg-violet-500/10 text-violet-300",
    glow: "from-violet-500/25 to-transparent",
  },
  amber: {
    border: "border-l-amber-500",
    iconWrap: "border-amber-400/35 bg-amber-500/10 text-amber-200",
    glow: "from-amber-500/20 to-transparent",
  },
  emerald: {
    border: "border-l-emerald-500",
    iconWrap: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
    glow: "from-emerald-500/20 to-transparent",
  },
} as const;

type AccentKey = keyof typeof accentStyles;

function HubLinkCard({
  href,
  title,
  description,
  icon: Icon,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: AccentKey;
}) {
  const a = accentStyles[accent];
  return (
    <Link
      href={href}
      className={`group relative flex items-start gap-4 overflow-hidden rounded-xl border border-[color:var(--color-border)] border-l-[5px] bg-opacity-100 p-4 pl-3 transition duration-200 hover:border-violet-500/45 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] active:scale-[0.99] ${a.border}`}
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <span
        className={`pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition duration-300 group-hover:opacity-100 ${a.glow}`}
        aria-hidden
      />
      <span
        className={`relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition group-hover:scale-105 ${a.iconWrap}`}
        style={{ color: accent === "violet" ? "var(--color-primary)" : undefined }}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="relative z-[1] min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className="font-semibold leading-snug break-words text-pretty"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </span>
          <ArrowRight
            className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-90"
            style={{ color: "var(--color-primary)" }}
          />
        </span>
        <span
          className="mt-1.5 block text-sm leading-relaxed break-words text-pretty"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </span>
      </span>
    </Link>
  );
}

const quickSections: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "hub-profil", label: "Profil & identité", icon: UserCircle2 },
  { id: "hub-connexions", label: "Connexions", icon: Link2 },
  { id: "hub-notifications", label: "Notifications", icon: Bell },
  { id: "hub-ressources", label: "Sécurité & guides", icon: Shield },
];

const faqItems = [
  {
    q: "Pourquoi je me connecte avec Discord ?",
    a: "TENF repose sur la communauté Discord : c’est le même compte pour accéder au site et au serveur. Tu n’as pas de mot de passe « TENF » séparé : la sécurité passe par ton compte Discord et les bonnes pratiques (2FA, vigilance aux arnaques).",
  },
  {
    q: "Où modifier ma photo, ma bio ou mes liens ?",
    a: "Va dans « Mon profil » puis « Compléter ou modifier » pour les champs détaillés et le suivi de complétion. Certaines infos peuvent être relues par le staff avant publication.",
  },
  {
    q: "Comment passer le site en clair ou en sombre ?",
    a: "Utilise le bouton lune / soleil dans l’en-tête du site (coin supérieur). Le choix est mémorisé sur ton appareil.",
  },
];

export default function MemberParametresHub() {
  const pathname = usePathname() || "/member/parametres";
  const [twitchLinked, setTwitchLinked] = useState<boolean | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqHeadingId = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setTwitchLinked(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) setTwitchLinked(Boolean(data?.connected));
      } catch {
        if (!cancelled) setTwitchLinked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const twitchHref =
    twitchLinked === true
      ? "/member/profil"
      : `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(pathname.startsWith("/") ? pathname : "/member/parametres")}`;

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Paramètres"
        description="Espace central pour ton compte membre TENF : profil visible sur le site, liaison Twitch, nouvelles et ressources utiles."
        badge="Membre TENF"
      />

      <section
        className="relative mt-6 overflow-hidden rounded-2xl border p-6 md:p-8"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        aria-labelledby="parametres-hero-title"
      >
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl animate-mesh"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl animate-mesh [animation-delay:-5s]"
          aria-hidden
        />
        <div className="relative z-[1] max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/90">Centre de réglages</p>
          <h2 id="parametres-hero-title" className="mt-2 text-xl font-bold leading-tight md:text-2xl break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Tout ce qui concerne <span className="text-violet-300">ton identité</span>, tes{" "}
            <span className="text-violet-300">connexions</span> et tes{" "}
            <span className="text-violet-300">préférences</span> sur le site.
          </h2>
          <p className="mt-3 text-sm leading-relaxed md:text-base break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
            Que tu découvres l’espace membre ou que tu le connaisses déjà, cette page regroupe les liens utiles. Les
            intitulés passent à la ligne pour rester lisibles sur mobile.
          </p>
          <div className="mt-5 flex flex-wrap gap-2" role="navigation" aria-label="Accès rapide aux sections">
            {quickSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-medium transition hover:border-violet-400/50 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <Icon className="h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                <span className="break-words">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/member/dashboard"
          className="group flex items-center gap-3 rounded-xl border p-4 transition hover:border-violet-500/40 hover:shadow-lg active:scale-[0.99]"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25 transition group-hover:scale-105">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold break-words" style={{ color: "var(--color-text)" }}>
              Tableau de bord
            </span>
            <span className="text-sm break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Vue d’ensemble de ton activité TENF
            </span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-40 group-hover:translate-x-0.5 group-hover:opacity-90" style={{ color: "var(--color-primary)" }} />
        </Link>
        <Link
          href="/rejoindre/guide-integration"
          className="group flex items-center gap-3 rounded-xl border p-4 transition hover:border-violet-500/40 hover:shadow-lg active:scale-[0.99]"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/25 transition group-hover:scale-105">
            <Zap className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold break-words" style={{ color: "var(--color-text)" }}>
              Guide intégration
            </span>
            <span className="text-sm break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Premiers pas côté communauté et outils
            </span>
          </span>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-40 group-hover:opacity-90" style={{ color: "var(--color-primary)" }} />
        </Link>
        <Link
          href="/soutenir-tenf"
          className="group flex items-center gap-3 rounded-xl border p-4 transition hover:border-violet-500/40 hover:shadow-lg active:scale-[0.99] sm:col-span-2 lg:col-span-1"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20 transition group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold break-words" style={{ color: "var(--color-text)" }}>
              Soutenir TENF
            </span>
            <span className="text-sm break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Aider le projet et la communauté
            </span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-40 group-hover:translate-x-0.5 group-hover:opacity-90" style={{ color: "var(--color-primary)" }} />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div id="hub-profil" className="scroll-mt-28 space-y-4">
          <MemberInfoCard title="Profil & identité">
            <p className="text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Ce que les visiteurs et le staff voient sur ton profil public TENF : présentation, visibilité et
              complétion des champs.
            </p>
            <div className="mt-4 space-y-3">
              <HubLinkCard
                href="/member/profil"
                title="Mon profil"
                description="Photo, bio, réseaux sociaux et visibilité : l’aperçu de ce qui apparaît sur le site."
                icon={UserCircle2}
                accent="violet"
              />
              <HubLinkCard
                href="/member/profil/completer"
                title="Compléter ou modifier"
                description="Champs détaillés, validation éventuelle par l’équipe et suivi de complétion."
                icon={UserCircle2}
                accent="violet"
              />
            </div>
          </MemberInfoCard>
        </div>

        <div id="hub-connexions" className="scroll-mt-28 space-y-4">
          <MemberInfoCard title="Connexions">
            <p className="text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Discord sert à l’authentification. Twitch est optionnel mais recommandé pour les fonctionnalités liées à
              ta chaîne (raids, outils, événements).
            </p>
            <div className="mt-4">
              <Link
                href={twitchHref}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border-2 px-4 py-4 transition hover:shadow-[0_12px_40px_rgba(145,70,255,0.15)] sm:flex-row sm:items-center sm:justify-between"
                style={{
                  borderColor: twitchLinked === false ? "rgba(145, 70, 220, 0.45)" : "var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#9146FF]/10 via-transparent to-violet-600/5 opacity-80"
                  aria-hidden
                />
                <span className="relative flex items-start gap-3 sm:items-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#9146FF]/20 text-[#bf94ff] ring-1 ring-[#9146FF]/35">
                    <Link2 className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold break-words" style={{ color: "var(--color-text)" }}>
                        Chaîne Twitch
                      </span>
                      {twitchLinked === null ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-200">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                          Vérification
                        </span>
                      ) : twitchLinked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                          Liée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-100">
                          À connecter
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                      {twitchLinked === null
                        ? "Nous vérifions si ton compte Twitch est déjà associé."
                        : twitchLinked
                          ? "Tout est prêt. Ouvre « Mon profil » pour voir ou ajuster les détails de la liaison."
                          : "Un clic lance la liaison sécurisée (OAuth). Tu seras renvoyé ici après la connexion."}
                    </span>
                  </span>
                </span>
                <span className="relative flex shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition group-hover:bg-violet-500/20">
                  {twitchLinked === true ? "Voir le profil" : "Lier Twitch"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </MemberInfoCard>
        </div>

        <div id="hub-notifications" className="scroll-mt-28 space-y-4">
          <MemberInfoCard title="Notifications">
            <p className="text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Annonces, rappels et messages de l’équipe : consulte et marque comme lu depuis une page dédiée.
            </p>
            <div className="mt-4">
              <HubLinkCard
                href="/member/notifications"
                title="Tes nouvelles"
                description="Liste des notifications récentes et actions pour les traiter sans les manquer."
                icon={Bell}
                accent="amber"
              />
            </div>
          </MemberInfoCard>
        </div>

        <div id="hub-ressources" className="scroll-mt-28 space-y-4">
          <MemberInfoCard title="Sécurité & documentation">
            <p className="text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Guides ouverts aussi aux visiteurs : bonnes pratiques et questions fréquentes sur l’espace membre.
            </p>
            <div className="mt-4 space-y-3">
              <HubLinkCard
                href="/rejoindre/guide-espace-membre/parametres-securite"
                title="Guide paramètres & sécurité"
                description="Discord, mots de passe, arnaques : rappels utiles pour protéger ton compte."
                icon={Shield}
                accent="emerald"
              />
              <HubLinkCard
                href="/rejoindre/guide-espace-membre/faq-membre"
                title="FAQ membre"
                description="Comprendre le tableau de bord, les inscriptions et le fonctionnement courant."
                icon={BookOpen}
                accent="emerald"
              />
            </div>
          </MemberInfoCard>
        </div>
      </div>

      <section
        className="mt-8 rounded-2xl border p-5 md:p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        aria-labelledby={faqHeadingId}
      >
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={faqHeadingId} className="text-lg font-semibold break-words" style={{ color: "var(--color-text)" }}>
              Questions fréquentes
            </h2>
            <p className="mt-1 text-sm break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Clique sur une question pour afficher la réponse. Idéal si tu configures ton compte pour la première fois.
            </p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {faqItems.map((item, i) => {
            const open = openFaq === i;
            const panelId = `param-faq-panel-${i}`;
            const btnId = `param-faq-btn-${i}`;
            return (
              <li key={item.q} className="rounded-xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <button
                  id={btnId}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-violet-500/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-400"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  <span className="min-w-0 font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-5 w-5 shrink-0 text-violet-300/90 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="border-t px-4 py-3 text-sm leading-relaxed break-words text-pretty" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div
        className="mt-8 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 ring-1 ring-violet-400/30">
          <Palette className="h-6 w-6 text-violet-100" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words" style={{ color: "var(--color-text)" }}>
            Apparence du site
          </p>
          <p className="mt-1 text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
            Le thème clair ou sombre se règle depuis la barre du haut (icône lune / soleil), pas depuis cette page. Le
            réglage s’applique à tout le site TENF sur cet appareil.
          </p>
        </div>
      </div>
    </MemberSurface>
  );
}
