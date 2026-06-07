"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  HelpCircle,
  Layers,
  Lightbulb,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import type { OrgChartPoleKey } from "@/lib/staff/orgChartTypes";
import { ORG_CHART_POLE_OPTIONS } from "@/lib/staff/orgChartTypes";
import { STAFF_NOMENCLATURE_EXPLAINER } from "@/lib/staff/staffNomenclature";
import { ORG_CHART_TIER_FILTER, type OrgChartFilterKey } from "@/lib/staff/orgChartFilters";

const GUIDE_STEPS = [
  { icon: Compass, title: "Choisis un focus", text: "Fondateurs, coordinateurs, paliers modération… via la carte rapide ou les filtres." },
  { icon: Search, title: "Affine avec la recherche", text: "Pseudo Twitch, pôle, mot-clé dans la bio courte." },
  { icon: Users, title: "Ouvre une fiche", text: "Clique une carte pour le détail, le rôle et le lien Twitch." },
];

const FAQ_SNIPPETS = [
  {
    q: "Rôle ou pôle ?",
    a: "Le rôle = ta place dans l'équipe. Le pôle = le domaine où tu agis (tu peux en cumuler plusieurs).",
  },
  {
    q: "Qui contacter ?",
    a: "Repère le pôle adapté, puis passe par les salons Discord TENF — pas de MP direct sans cadre.",
  },
  {
    q: "Profil absent ?",
    a: "Seuls les profils marqués visibles par l'équipe apparaissent ici. Certains rôles restent discrets.",
  },
];

const TIER_VISUAL = [
  { label: "Fondateurs TENF", width: "42%", accent: "#3b82f6", countKey: "founders" as const },
  { label: "Coordinateurs TENF", width: "58%", accent: "#6366f1", countKey: "adminCoordinators" as const },
  { label: "Modération active", width: "84%", accent: "#a855f7", countKey: "moderators" as const },
  { label: "Modération en pause", width: "68%", accent: "#94a3b8", countKey: "moderatorsPaused" as const },
  { label: "Soutien & invités", width: "70%", accent: "#22c55e", countKey: "support" as const },
];

export type OrganigrammeRailCounts = {
  founders: number;
  adminCoordinators: number;
  moderators: number;
  moderatorsPaused: number;
  support: number;
  total: number;
};

type SectionNav = { key: string; title: string; count: number };

type LeftRailProps = {
  audience: "public" | "member";
  sections: SectionNav[];
  activeFilter: OrgChartFilterKey;
  onScrollToSection: (key: string) => void;
  onApplyFilter: (key: OrgChartFilterKey) => void;
  onReset: () => void;
};

export function OrganigrammeLeftRail({
  audience,
  sections,
  activeFilter,
  onScrollToSection,
  onApplyFilter,
  onReset,
}: LeftRailProps) {
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
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)", color: "var(--color-primary)" }}
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

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "rgba(99,102,241,0.35)", background: "linear-gradient(160deg, rgba(99,102,241,0.12), rgba(2,6,23,0.5))" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
          <Layers size={14} aria-hidden />
          Structure TENF
        </p>
        <div className="mt-4 flex flex-col items-center gap-1.5">
          {TIER_VISUAL.map((tier) => (
            <button
              key={tier.label}
              type="button"
              onClick={() => onApplyFilter(ORG_CHART_TIER_FILTER[tier.countKey])}
              className="rounded-xl border py-2 text-center text-[11px] font-semibold transition hover:brightness-110"
              style={{
                width: tier.width,
                borderColor: `${tier.accent}55`,
                backgroundColor: `${tier.accent}18`,
                color: "var(--color-text)",
                boxShadow: `0 0 24px ${tier.accent}22`,
              }}
            >
              {tier.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Schéma simplifié — clique un niveau pour filtrer
        </p>
      </div>

      {sections.length > 0 ? (
        <nav
          className="rounded-2xl border p-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
          aria-label="Sections de l'organigramme"
        >
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            Aller à
          </p>
          <ul className="mt-2 space-y-1">
            {sections.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onScrollToSection(s.key)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5"
                  style={{ color: "var(--color-text)" }}
                >
                  <span className="truncate pr-2">{s.title}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ backgroundColor: "rgba(148,163,184,0.15)", color: "var(--color-text-secondary)" }}
                  >
                    {s.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="space-y-2">
        <Link
          href="/organisation-staff"
          className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <span className="inline-flex items-center gap-2">
            <BookOpen size={16} style={{ color: "var(--color-primary)" }} aria-hidden />
            Rôles &amp; pôles
          </span>
          <ArrowRight size={16} aria-hidden />
        </Link>
        {audience === "member" ? (
          <Link
            href="/member/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
          >
            Espace membre
          </Link>
        ) : null}
      </div>
    </div>
  );
}

type RightRailProps = {
  counts: OrganigrammeRailCounts;
  poleFilter: OrgChartPoleKey | "all";
  poleAccents: Record<OrgChartPoleKey, string>;
  totalVisible: number;
  activeFilter: OrgChartFilterKey;
  onPoleFilter: (key: OrgChartPoleKey | "all") => void;
  onReset: () => void;
};

export function OrganigrammeRightRail({
  counts,
  poleFilter,
  poleAccents,
  totalVisible,
  activeFilter,
  onPoleFilter,
  onReset,
}: RightRailProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: "rgba(59,130,246,0.35)",
          background: "radial-gradient(120% 100% at 0% 0%, rgba(59,130,246,0.15), rgba(2,6,23,0.55))",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
          En direct
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
          {totalVisible}
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          profil{totalVisible > 1 ? "s" : ""} affiché{totalVisible > 1 ? "s" : ""}
          {activeFilter !== "all" ? " (filtre actif)" : ""}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          {[
            { label: "Direction", value: counts.founders + counts.adminCoordinators },
            { label: "Modo. active", value: counts.moderators },
            { label: "En pause", value: counts.moderatorsPaused },
            { label: "Soutien", value: counts.support },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border px-2 py-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.4)" }}
            >
              <p className="text-lg font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {s.value}
              </p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.4)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          <MapPin size={14} aria-hidden />
          Légende des pôles
        </p>
        <ul className="mt-3 space-y-1.5">
          <li>
            <button
              type="button"
              onClick={() => onPoleFilter("all")}
              className="w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition"
              style={{
                borderColor: poleFilter === "all" ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: poleFilter === "all" ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : "transparent",
                color: "var(--color-text)",
              }}
            >
              Tous les pôles
            </button>
          </li>
          {ORG_CHART_POLE_OPTIONS.map((pole) => {
            const accent = poleAccents[pole.key];
            const active = poleFilter === pole.key;
            return (
              <li key={pole.key}>
                <button
                  type="button"
                  onClick={() => onPoleFilter(pole.key)}
                  className="w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition hover:brightness-110"
                  style={{
                    borderColor: active ? accent : "var(--color-border)",
                    backgroundColor: active ? `${accent}22` : "transparent",
                    color: active ? "var(--color-text)" : "var(--color-text-secondary)",
                  }}
                >
                  <span aria-hidden>{pole.emoji}</span> {pole.label.replace(/^Pôle /, "")}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
          <Sparkles size={14} aria-hidden />
          Rôle + pôle
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {STAFF_NOMENCLATURE_EXPLAINER.intro}
        </p>
        <ul className="mt-3 space-y-2">
          {STAFF_NOMENCLATURE_EXPLAINER.examples.slice(0, 3).map((ex) => (
            <li
              key={ex}
              className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              {ex}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          <HelpCircle size={14} aria-hidden />
          Questions fréquentes
        </p>
        <dl className="mt-3 space-y-3">
          {FAQ_SNIPPETS.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.q}
              </dt>
              <dd className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: "rgba(34,197,94,0.3)",
          background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(2,6,23,0.5))",
        }}
      >
        <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#86efac" }}>
          <MessageCircle size={16} aria-hidden />
          Besoin d&apos;aide ?
        </p>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {STAFF_NOMENCLATURE_EXPLAINER.philosophy}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <RotateCcw size={14} aria-hidden />
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
}
