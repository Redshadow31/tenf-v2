"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { STAFF_NOMENCLATURE_EXPLAINER, STAFF_ROLE_FAMILIES } from "@/lib/staff/staffNomenclature";

const GUIDE_STEPS = [
  { icon: Compass, title: "Parcours guidé", text: "Quatre familles de rôles pour situer la direction, la coordination, la modération et l'appui." },
  { icon: Layers, title: "Rôles & pôles", text: "Ouvre les cartes pour les missions ; un rôle = ta place, un pôle = ton domaine d'action." },
  { icon: MapPin, title: "Organigramme live", text: "Retrouve les visages, filtres par palier et par pôle de mission." },
];

const FAQ_SNIPPETS = [
  {
    q: "Rôle ou pôle ?",
    a: "Le rôle = ta place dans l'équipe. Le pôle = le domaine où tu agis (tu peux en cumuler plusieurs).",
  },
  {
    q: "Qui contacter ?",
    a: "Repère le pôle adapté, puis passe par les salons Discord TENF.",
  },
];

export type StaffPageNavId = "staff-journey" | "staff-roles" | "staff-poles" | "staff-logic" | "staff-faq";

const NAV_ITEMS: Array<{ id: StaffPageNavId; label: string }> = [
  { id: "staff-journey", label: "Parcours" },
  { id: "staff-roles", label: "Rôles" },
  { id: "staff-poles", label: "Pôles" },
  { id: "staff-logic", label: "Rôles & pôles" },
  { id: "staff-faq", label: "FAQ" },
];

type LeftRailProps = {
  audience: "public" | "member";
  activeNav: string;
  onGoTo: (id: StaffPageNavId) => void;
};

export function OrganisationStaffLeftRail({ audience, activeNav, onGoTo }: LeftRailProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
          <Lightbulb size={14} aria-hidden />
          Mode d&apos;emploi
        </p>
        <ol className="mt-3 space-y-3">
          {GUIDE_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <nav
        className="rounded-2xl border p-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
        aria-label="Sections de la page"
      >
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          Sur cette page
        </p>
        <ul className="mt-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onGoTo(item.id)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5"
                style={{
                  backgroundColor: activeNav === item.id ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : undefined,
                  color: activeNav === item.id ? "var(--color-text)" : "var(--color-text-secondary)",
                }}
              >
                <span>{item.label}</span>
                {activeNav === item.id ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} aria-hidden />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "rgba(99,102,241,0.35)", background: "linear-gradient(160deg, rgba(99,102,241,0.12), rgba(2,6,23,0.5))" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
          <Layers size={14} aria-hidden />
          Familles TENF
        </p>
        <div className="mt-4 flex flex-col items-stretch gap-2">
          {STAFF_ROLE_FAMILIES.map((family) => {
            const Icon = family.Icon;
            return (
              <button
                key={family.key}
                type="button"
                onClick={() => onGoTo("staff-roles")}
                className="flex items-center gap-2 rounded-xl border py-2.5 pl-3 pr-2 text-left text-[11px] font-semibold transition hover:brightness-110"
                style={{
                  borderColor: `${family.accent}55`,
                  backgroundColor: `${family.accent}14`,
                  color: "var(--color-text)",
                }}
              >
                <Icon size={14} style={{ color: family.accent }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{family.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Link
          href="/organisation-staff/organigramme"
          className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <span className="inline-flex items-center gap-2">
            <Users size={16} style={{ color: "var(--color-primary)" }} aria-hidden />
            Organigramme interactif
          </span>
          <ArrowRight size={16} aria-hidden />
        </Link>
        {audience === "member" ? (
          <Link
            href="/member/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
          >
            <LayoutDashboard size={16} aria-hidden />
            Espace membre
          </Link>
        ) : (
          <Link
            href="/fonctionnement-tenf/decouvrir"
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            <BookOpen size={16} aria-hidden />
            Fonctionnement TENF
          </Link>
        )}
      </div>
    </div>
  );
}

type RightRailProps = {
  audience: "public" | "member";
  totalRoles: number;
  totalPoles: number;
  onGoTo: (id: StaffPageNavId) => void;
};

export function OrganisationStaffRightRail({ audience, totalRoles, totalPoles, onGoTo }: RightRailProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: "rgba(59,130,246,0.35)",
          background: "linear-gradient(160deg, rgba(59,130,246,0.14), rgba(2,6,23,0.55))",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#93c5fd" }}>
          En bref
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rôles</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
              {totalRoles}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pôles</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
              {totalPoles}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Structure bénévole : chacun peut cumuler un rôle et plusieurs pôles selon ses missions.
        </p>
      </div>

      <Link
        href="/organisation-staff/organigramme"
        className="group block rounded-2xl border p-4 transition hover:-translate-y-0.5"
        style={{
          borderColor: "rgba(168,85,247,0.4)",
          background: "linear-gradient(145deg, rgba(168,85,247,0.2), rgba(15,23,42,0.85))",
          boxShadow: "0 12px 32px rgba(124,58,237,0.2)",
        }}
      >
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-300">
          <Sparkles size={14} aria-hidden />
          Carte live
        </p>
        <p className="mt-2 text-base font-bold" style={{ color: "var(--color-text)" }}>
          Voir qui fait quoi
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Profils publics, filtres par palier de rôle et par pôle.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 transition group-hover:gap-2">
          Ouvrir l&apos;organigramme
          <ArrowRight size={16} aria-hidden />
        </span>
      </Link>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
          <Shield size={14} aria-hidden />
          Paliers modération
        </p>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <li>
            <strong style={{ color: "#c084fc" }}>Confirmée</strong> — Modérateur TENF &amp; autonomie
          </li>
          <li>
            <strong style={{ color: "#d8b4fe" }}>Parcours</strong> — Découverte &amp; accompagnement
          </li>
          <li>
            <strong style={{ color: "#94a3b8" }}>Pause</strong> — Hiatus tout en restant lié·e
          </li>
        </ul>
        <button
          type="button"
          onClick={() => onGoTo("staff-roles")}
          className="mt-3 text-xs font-semibold transition hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Détail des 8 rôles →
        </button>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          <HelpCircle size={14} aria-hidden />
          Aide rapide
        </p>
        <div className="mt-3 space-y-3">
          {FAQ_SNIPPETS.map((item) => (
            <div key={item.q}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.q}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onGoTo("staff-faq")}
          className="mt-3 text-xs font-semibold transition hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Toute la FAQ →
        </button>
      </div>

      {audience === "member" ? (
        <div
          className="rounded-2xl border p-4 text-sm leading-relaxed"
          style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(15,23,42,0.5)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#86efac" }}>
            Repère Discord
          </p>
          <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
            {STAFF_NOMENCLATURE_EXPLAINER.philosophy.slice(0, 120)}…
          </p>
        </div>
      ) : null}
    </div>
  );
}
