"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Heart,
  HelpCircle,
  History,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import {
  FORMER_STAFF_ACCENT,
  FORMER_STAFF_BORDER,
  FORMER_STAFF_ROLE_LABEL,
} from "@/lib/staff/formerStaffPresentation";

export type RemerciementsAudience = "visitor" | "member";

const VISITOR_GUIDE = [
  {
    icon: Heart,
    title: "Une page de gratitude",
    text: "Ici, TENF remercie des personnes qui ont aidé à faire vivre le serveur. Ce n'est pas la liste de l'équipe actuelle.",
  },
  {
    icon: Compass,
    title: "Pour contacter TENF aujourd'hui",
    text: "Pour une question ou un souci sur Discord, passe par l'organigramme actif ou les salons prévus — pas par cette page.",
  },
  {
    icon: Sparkles,
    title: "Badge doré = passé reconnu",
    text: "Le rôle « Ancien Staff TENF » dit merci pour le passé. Le vert « Soutien TENF », lui, indique une aide en cours.",
  },
];

const MEMBER_GUIDE = [
  {
    icon: Shield,
    title: "Pas l'équipe du jour",
    text: "Les profils ici ne modèrent plus au nom de TENF. Pour un signalement ou une demande staff, utilise l'organigramme actif.",
  },
  {
    icon: History,
    title: "Reconnaissance, pas fonction",
    text: "Ancien Staff TENF honore un parcours passé. Tu peux remercier, découvrir leur chaîne — sans les solliciter comme staff.",
  },
  {
    icon: MessageCircle,
    title: "Où les retrouver ailleurs",
    text: "Sur l'annuaire et les lives, ils apparaissent comme les autres créateurs. Le badge doré n'est visible que ici.",
  },
];

const FAQ_VISITOR = [
  {
    q: "Est-ce l'équipe actuelle ?",
    a: "Non. C'est l'histoire du staff : des personnes remerciées pour leur passage, pas pour une mission en cours.",
  },
  {
    q: "Qui contacter sur TENF ?",
    a: "L'organigramme interactif montre qui s'occupe du serveur aujourd'hui : fondateurs, modos, soutiens actifs.",
  },
  {
    q: "C'est quoi « Ancien Staff TENF » ?",
    a: "Un remerciement officiel. Pas un grade actif, pas une modération — juste de la reconnaissance.",
  },
];

const FAQ_MEMBER = [
  {
    q: "Je confonds avec le staff actif…",
    a: "Normal de vérifier. Organigramme = qui intervient aujourd'hui. Remerciements = qui a aidé avant, avec gratitude.",
  },
  {
    q: "Soutien TENF ou Ancien Staff ?",
    a: "Soutien TENF : mission en cours (organigramme). Ancien Staff : investissement passé (cette page uniquement).",
  },
  {
    q: "Je veux rejoindre le staff",
    a: "Les parcours passent par les candidatures et l'intégration TENF — pas via cette page de remerciements.",
  },
];

const QUICK_LINKS = [
  { href: "/organisation-staff/organigramme", label: "Organigramme actif", hint: "Staff du jour", accent: "#3b82f6", Icon: Sparkles },
  { href: "/membres", label: "Annuaire membres", hint: "Créateurs TENF", accent: "#a855f7", Icon: Users },
  { href: "/lives", label: "Lives en cours", hint: "Qui stream", accent: "#ec4899", Icon: Heart },
  { href: "/rejoindre", label: "Rejoindre TENF", hint: "Découvrir le serveur", accent: "#22c55e", Icon: Compass },
] as const;

type LeftRailProps = {
  audience: RemerciementsAudience;
  profileCount: number;
  onScrollToProfiles: () => void;
  onScrollToUnderstand: () => void;
};

export function RemerciementsLeftRail({
  audience,
  profileCount,
  onScrollToProfiles,
  onScrollToUnderstand,
}: LeftRailProps) {
  const guide = audience === "member" ? MEMBER_GUIDE : VISITOR_GUIDE;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 xl:gap-5">
      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{
          borderColor: FORMER_STAFF_BORDER,
          background: "linear-gradient(165deg, rgba(212,168,83,0.12), rgba(2,6,23,0.55))",
        }}
      >
        <p
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: FORMER_STAFF_ACCENT }}
        >
          <Lightbulb size={14} aria-hidden />
          {audience === "member" ? "Tu es membre TENF" : "Tu découvres TENF"}
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {audience === "member"
            ? "Cette page sépare clairement le staff actif et ceux qu'on remercie pour le passé."
            : "TENF est une communauté Twitch solidaire. Cette page dit merci à ceux qui ont construit le projet."}
        </p>
        <ol className="mt-4 space-y-3.5">
          {guide.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(212,168,83,0.18)", color: FORMER_STAFF_ACCENT }}
                >
                  <Icon size={15} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          Sur cette page
        </p>
        <nav className="mt-3 flex flex-col gap-2" aria-label="Sections">
          <button
            type="button"
            onClick={onScrollToUnderstand}
            className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition hover:bg-white/[0.04]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            Comprendre le rôle
            <ArrowRight size={14} className="opacity-50" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onScrollToProfiles}
            className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition hover:bg-white/[0.04]"
            style={{ borderColor: FORMER_STAFF_BORDER, color: FORMER_STAFF_ACCENT }}
          >
            {profileCount} personne{profileCount > 1 ? "s" : ""} remerciée{profileCount > 1 ? "s" : ""}
            <ArrowRight size={14} aria-hidden />
          </button>
        </nav>
      </div>

      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{ borderColor: "rgba(59,130,246,0.35)", backgroundColor: "rgba(15,23,42,0.45)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#93c5fd" }}>
          Staff actif aujourd&apos;hui
        </p>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Fondateurs, coordinateurs, modération et soutiens en mission — c&apos;est l&apos;organigramme, pas cette page.
        </p>
        <Link
          href="/organisation-staff/organigramme"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)", color: "white" }}
        >
          Voir l&apos;organigramme
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      {audience === "member" ? (
        <Link
          href="/member/dashboard"
          className="flex items-center gap-3 rounded-2xl border p-4 transition hover:bg-white/[0.03]"
          style={{ borderColor: "rgba(99,102,241,0.35)", backgroundColor: "rgba(15,23,42,0.45)" }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
          >
            <LayoutDashboard size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Espace membre
            </span>
            <span className="mt-0.5 block text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Retour au tableau de bord TENF
            </span>
          </span>
          <ArrowRight size={16} className="shrink-0 opacity-60" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

type RightRailProps = {
  audience: RemerciementsAudience;
  profileCount: number;
  remercieCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onResetSearch: () => void;
};

export function RemerciementsRightRail({
  audience,
  profileCount,
  remercieCount,
  searchQuery,
  onSearchChange,
  onResetSearch,
}: RightRailProps) {
  const faq = audience === "member" ? FAQ_MEMBER : FAQ_VISITOR;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 xl:gap-5">
      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{
          borderColor: FORMER_STAFF_BORDER,
          background: "linear-gradient(165deg, rgba(212,168,83,0.1), rgba(2,6,23,0.5))",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: FORMER_STAFF_ACCENT }}>
          Chiffres
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2.5">
          <div
            className="rounded-xl border px-3 py-3"
            style={{ borderColor: FORMER_STAFF_BORDER, backgroundColor: "rgba(212,168,83,0.08)" }}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Profils
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums" style={{ color: FORMER_STAFF_ACCENT }}>
              {profileCount}
            </dd>
          </div>
          <div
            className="rounded-xl border px-3 py-3"
            style={{ borderColor: FORMER_STAFF_BORDER, backgroundColor: "rgba(212,168,83,0.08)" }}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Remerciés
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums" style={{ color: FORMER_STAFF_ACCENT }}>
              {remercieCount}
            </dd>
          </div>
        </dl>
        <div
          className="mt-3 rounded-xl border px-3 py-2.5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Badge sur cette page :
          </p>
          <span className="role-badge role-badge--staff-alumni mt-2 inline-block text-[10px]">{FORMER_STAFF_ROLE_LABEL}</span>
        </div>
      </div>

      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          <BookOpen size={14} aria-hidden />
          Rechercher
        </p>
        <label className="mt-3 block">
          <span className="sr-only">Rechercher une personne remerciée</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pseudo, Twitch…"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/30"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "rgba(15,23,42,0.6)",
              color: "var(--color-text)",
            }}
          />
        </label>
        {searchQuery.trim() ? (
          <button
            type="button"
            onClick={onResetSearch}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ color: FORMER_STAFF_ACCENT }}
          >
            <RotateCcw size={12} aria-hidden />
            Effacer
          </button>
        ) : null}
      </div>

      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          <HelpCircle size={14} aria-hidden />
          {audience === "member" ? "Questions membres" : "Questions fréquentes"}
        </p>
        <ul className="mt-3 space-y-3.5">
          {faq.map((item) => (
            <li key={item.q}>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                {item.q}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.a}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-2xl border p-4 xl:p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          Aller plus loin
        </p>
        <ul className="mt-3 space-y-2">
          {QUICK_LINKS.map((link) => {
            const Icon = link.Icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:bg-white/[0.03]"
                  style={{ borderColor: `${link.accent}33` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${link.accent}22`, color: link.accent }}
                  >
                    <Icon size={15} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {link.label}
                    </span>
                    <span className="block text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                      {link.hint}
                    </span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 opacity-40" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
