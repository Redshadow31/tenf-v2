"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  Compass,
  FileText,
  GraduationCap,
  HeartHandshake,
  Info,
  LayoutList,
  ListChecks,
  Radio,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { MONTHLY_CHANGELOG, type MonthTab } from "./monthlyData";
import styles from "./changelog.module.css";

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setP(total > 0 ? Math.min(100, Math.max(0, (el.scrollTop / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

function tabButtonClass(m: MonthTab, selected: boolean): string {
  const base =
    "shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition lg:min-w-0 border focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80";
  if (selected) {
    if (m.kind === "prologue")
      return `${base} border-amber-400/50 bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-900/30`;
    if (m.kind === "horizon")
      return `${base} border-cyan-400/50 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white shadow-lg shadow-cyan-900/30`;
    return `${base} border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/35`;
  }
  if (m.kind === "prologue")
    return `${base} border-amber-500/25 bg-amber-950/20 text-amber-100/90 hover:border-amber-400/40`;
  if (m.kind === "horizon")
    return `${base} border-cyan-500/25 bg-cyan-950/15 text-cyan-100/85 hover:border-cyan-400/40`;
  return `${base} border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-violet-500/35 hover:text-[var(--color-text)]`;
}

function panelClass(kind: MonthTab["kind"]): string {
  const base =
    "mt-8 rounded-3xl border p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-8 bg-[var(--color-card)]/40";
  if (kind === "prologue") return `${base} border-amber-500/25 ring-1 ring-amber-500/10`;
  if (kind === "horizon") return `${base} border-cyan-500/25 ring-1 ring-cyan-500/10`;
  return `${base} border-[var(--color-border)]`;
}

function periodEyebrow(kind: MonthTab["kind"]): string {
  if (kind === "prologue") return "En bref";
  if (kind === "horizon") return "À venir";
  return "Ce mois-ci";
}

// Wrapper fluide : padding latéral en clamp() pour rester scalable au zoom,
// maxWidth en min(112rem, 100%) pour occuper la largeur disponible sans
// devenir illisible sur écran 4K.
const CHANGELOG_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--clog-px": "clamp(1rem, 3vw, 3rem)",
  paddingLeft: "var(--clog-px)",
  paddingRight: "var(--clog-px)",
  fontSize: "clamp(0.95rem, 0.9rem + 0.15vw, 1.05rem)",
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: "min(112rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

export default function ChangelogPageClient() {
  const progress = useScrollProgress();
  // On préfère démarrer sur la période la plus récente du calendrier (pas l'horizon).
  const standardTabs = useMemo(
    () => MONTHLY_CHANGELOG.filter((m) => m.kind !== "horizon" && m.kind !== "prologue"),
    []
  );
  const defaultId = standardTabs[standardTabs.length - 1]?.id ?? MONTHLY_CHANGELOG[0]?.id ?? "2026-05";
  const [activeId, setActiveId] = useState(defaultId);

  const active = useMemo(
    () => MONTHLY_CHANGELOG.find((m) => m.id === activeId) ?? MONTHLY_CHANGELOG[0],
    [activeId]
  );

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (hash && MONTHLY_CHANGELOG.some((m) => m.id === hash)) {
      setActiveId(hash);
    }
  }, []);

  const selectMonth = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      const url = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.replaceState(null, "", url);
    }
  }, []);

  // Mini-stats affichées dans le hero.
  const stats = useMemo(() => {
    const totalPublic = MONTHLY_CHANGELOG.reduce((sum, m) => sum + m.pourToutLeMonde.length, 0);
    const totalStaff = MONTHLY_CHANGELOG.reduce((sum, m) => sum + m.pourLeStaff.length, 0);
    return {
      periods: MONTHLY_CHANGELOG.length,
      standardMonths: standardTabs.length,
      totalPublic,
      totalStaff,
      latestLabel: standardTabs[standardTabs.length - 1]?.label ?? "—",
      latestId: standardTabs[standardTabs.length - 1]?.id ?? "",
    };
  }, [standardTabs]);

  return (
    <div className="relative min-w-0" style={CHANGELOG_STYLE}>
      {/* Barre de progression de lecture */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      {/* === Hero === */}
      <div
        className="relative overflow-hidden rounded-b-3xl border-b border-[var(--color-border)] lg:rounded-b-[2rem]"
        style={{
          marginLeft: "calc(-1 * var(--clog-px))",
          marginRight: "calc(-1 * var(--clog-px))",
        }}
      >
        <div className={`absolute inset-0 ${styles.meshGradient}`} aria-hidden />
        <div className={`absolute inset-0 ${styles.gridPattern} opacity-40`} aria-hidden />
        <div
          className={`pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl ${styles.blobA}`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl ${styles.blobB}`}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className={`absolute -left-1/2 top-0 h-px w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent ${styles.heroShimmer}`}
          />
        </div>

        <div
          className="relative w-full"
          style={{
            paddingTop: "clamp(2rem, 4vw, 3.5rem)",
            paddingBottom: "clamp(2.5rem, 4.5vw, 4rem)",
            paddingLeft: "var(--clog-px)",
            paddingRight: "var(--clog-px)",
          }}
        >
          <div style={CONTAINER_STYLE}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-violet-100/90 backdrop-blur-md">
              <CalendarRange className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
              Hiver 2025 → printemps 2026
            </div>
            <h1
              className="mt-4 max-w-5xl font-extrabold tracking-tight text-white drop-shadow-sm"
              style={{ fontSize: "clamp(1.85rem, 1.4rem + 2vw, 3.5rem)", lineHeight: 1.05 }}
            >
              Quoi de neuf sur TENF&nbsp;?
              <span
                className="mt-2 block bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-transparent"
                style={{ fontSize: "clamp(1.25rem, 1rem + 1.2vw, 2.25rem)" }}
              >
                Un récap mois par mois, sans jargon
              </span>
            </h1>
            <p
              className="mt-5 max-w-3xl leading-relaxed text-violet-100/90"
              style={{ fontSize: "clamp(0.95rem, 0.9rem + 0.2vw, 1.1rem)" }}
            >
              Chaque période raconte ce qui change pour <strong className="text-white">vous</strong> sur le site (lives,
              intégration, partenariats, profils…) et ce qui aide{" "}
              <strong className="text-white">celles et ceux qui animent</strong> la communauté au quotidien. Pas de vocabulaire
              technique : uniquement des effets concrets.
            </p>
            <p className="mt-3 max-w-3xl text-xs text-violet-200/75 sm:text-sm">
              TENF, c'est d'abord une communauté Twitch et Discord ; le site sert à la rendre plus lisible. Merci à
              Red_Shadow_31, Nexou31, Clara et à tout le monde qui donne un peu de temps pour faire tourner la New Family.
            </p>

            {/* Mini-stats */}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatChip icon={CalendarRange} label="Mois racontés" value={String(stats.standardMonths)} tone="violet" />
              <StatChip
                icon={HeartHandshake}
                label="Pour les membres"
                value={String(stats.totalPublic)}
                tone="emerald"
              />
              <StatChip icon={Shield} label="Pour l'équipe" value={String(stats.totalStaff)} tone="cyan" />
              <StatChip icon={Sparkles} label="Dernière période" value={stats.latestLabel} tone="amber" />
            </div>

            {/* CTA hero */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/fonctionnement-tenf/decouvrir"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                <GraduationCap className="h-4 w-4" aria-hidden />
                Comprendre TENF
              </Link>
              {stats.latestId ? (
                <button
                  type="button"
                  onClick={() => selectMonth(stats.latestId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-900/30 transition hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  Aller à {stats.latestLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => selectMonth("avant-le-site")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-amber-100/95 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                TENF, Discord & le site
              </button>
              <button
                type="button"
                onClick={() => selectMonth("horizon-2026-ete")}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Envies pour l'été
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative pb-24 pt-6"
        style={CONTAINER_STYLE}
      >
        {/* === Onglets périodes === */}
        <div className="sticky top-[52px] z-30 -mx-1 border-b border-[var(--color-border)] bg-[var(--color-bg)]/92 py-3 backdrop-blur-md sm:top-14 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] lg:hidden">
            Choisir une période
          </p>
          <div
            className="scrollbar-x-none flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible"
            role="tablist"
            aria-label="Périodes du journal des nouveautés"
          >
            {MONTHLY_CHANGELOG.map((m) => {
              const selected = m.id === activeId;
              const isLatest = m.id === stats.latestId;
              const hintMuted =
                m.kind === "prologue"
                  ? selected
                    ? "text-amber-50/90"
                    : "text-amber-200/70"
                  : m.kind === "horizon"
                    ? selected
                      ? "text-cyan-50/90"
                      : "text-cyan-200/70"
                    : selected
                      ? "text-white/90"
                      : "";
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`tab-${m.id}`}
                  aria-controls={`panel-${m.id}`}
                  onClick={() => selectMonth(m.id)}
                  className={tabButtonClass(m, selected)}
                >
                  <span className="block leading-tight">
                    {m.label}
                    {isLatest ? (
                      <span
                        className={`ml-1.5 inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${
                          selected
                            ? "border-white/40 text-white/95"
                            : "border-violet-500/50 text-violet-300"
                        }`}
                        aria-label="période la plus récente"
                      >
                        Récent
                      </span>
                    ) : null}
                  </span>
                  <span className={`mt-0.5 block text-[10px] font-normal ${hintMuted}`}>{m.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* === Panneau actif === */}
        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className={panelClass(active.kind)}
        >
          <header className="border-b border-[var(--color-border)] pb-6">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                active.kind === "prologue"
                  ? "text-amber-400/95"
                  : active.kind === "horizon"
                    ? "text-cyan-400/95"
                    : "text-violet-400/95"
              }`}
            >
              {periodEyebrow(active.kind)}
            </p>
            <h2
              className="mt-2 font-bold text-[var(--color-text)]"
              style={{ fontSize: "clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)" }}
            >
              {active.label}
            </h2>
            <p
              className="mt-2 max-w-4xl leading-relaxed text-[var(--color-text-secondary)]"
              style={{ fontSize: "clamp(0.95rem, 0.9rem + 0.15vw, 1.05rem)" }}
            >
              {active.intro}
            </p>

            {/* Compteur de blocs */}
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200">
                <Users className="h-3 w-3" aria-hidden />
                {active.pourToutLeMonde.length} pour les membres
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 font-semibold text-violet-200">
                <Shield className="h-3 w-3" aria-hidden />
                {active.pourLeStaff.length} pour l'équipe
              </span>
            </div>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <ChangelogBucket
              id={`${active.id}-bloc-public`}
              tone="emerald"
              icon={Users}
              title="Pour vous"
              subtitle="Membres, futur·e membre, viewer ou curieux·se : ce que vous voyez, ce que vous pouvez faire, ce qui devient plus simple sur le site."
              items={active.pourToutLeMonde}
              itemIcon={HeartHandshake}
            />

            <ChangelogBucket
              id={`${active.id}-bloc-staff`}
              tone="violet"
              icon={Shield}
              title="Pour l'équipe d'animation"
              subtitle="Staff, bénévoles, modération : ce qui vous fait gagner du temps ou de la sérénité pour préparer les réunions, les évaluations et les gros moments collectifs."
              items={active.pourLeStaff}
              itemIcon={LayoutList}
            />
          </div>

          <p className="mt-8 inline-flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-4 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-violet-400/90"
              aria-hidden
            />
            <span>
              {active.kind === "horizon"
                ? "L'été sera raconté au fil des mois : ce cadre sert seulement à partager des envies collectives, pas à promettre une date précise pour chaque idée."
                : active.kind === "prologue"
                  ? "Le site a pris son rythme à partir du 9 décembre 2025 ; la communauté, elle, bougeait déjà bien avant sur Discord et Twitch — les deux restent complémentaires."
                  : "En coulisses, des ajustements réguliers rendent le site plus stable : souvent vous ne les voyez pas, mais ils évitent des bugs ou des messages d'erreur frustrants."}
            </span>
          </p>
        </div>

        {/* === Footer : Poursuivre la visite === */}
        <footer className="mt-14 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-400/90"
              >
                Et après ?
              </p>
              <h2
                className="mt-1 font-bold text-[var(--color-text)]"
                style={{ fontSize: "clamp(1.2rem, 1rem + 0.7vw, 1.6rem)" }}
              >
                Poursuivre la visite
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                Quelques pages utiles une fois que vous avez pris le pouls des nouveautés.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FooterLink
              href="/a-propos"
              label="À propos"
              description="Notre histoire (TEF → TENF), nos valeurs, le trio fondateur."
              icon={Compass}
              tone="violet"
            />
            <FooterLink
              href="/membres"
              label="Annuaire"
              description="Tous les membres, leurs chaînes, leurs présentations."
              icon={Users}
              tone="violet"
            />
            <FooterLink
              href="/lives"
              label="Lives"
              description="Qui est en direct, qui revient bientôt, raids en cours."
              icon={Radio}
              tone="cyan"
            />
            <FooterLink
              href="/evenements"
              label="Événements"
              description="L'agenda officiel, inscriptions et calendrier."
              icon={CalendarRange}
              tone="cyan"
            />
            <FooterLink
              href="/partenariats"
              label="Partenariats"
              description="Proposer un projet via notre formulaire en 3 étapes."
              icon={HeartHandshake}
              tone="emerald"
              accent
            />
            <FooterLink
              href="/charte"
              label="Charte communautaire"
              description="Nos règles, lisibles avant d'arriver sur Discord."
              icon={ListChecks}
              tone="amber"
            />
            <FooterLink
              href="/avis-tenf"
              label="Témoignages"
              description="Ce que vivent les membres avant de se lancer."
              icon={Sparkles}
              tone="fuchsia"
              accent
            />
            <FooterLink
              href="/partenaire-tenf"
              label="Partenaire UPA"
              description="Notre engagement caritatif avec UPA Events."
              icon={FileText}
              tone="amber"
            />
          </div>

          <p className="mt-7 inline-flex items-start gap-2 text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
            <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            <span>
              Un avis, une idée, un truc qui coince encore ? Sur Discord, votre retour nourrit directement les
              prochaines améliorations.
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================== */
/* Sous-composants                                                  */
/* ============================================================== */

type StatChipProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "violet" | "emerald" | "cyan" | "amber";
};

function StatChip({ icon: Icon, label, value, tone }: StatChipProps) {
  const TONE_MAP: Record<StatChipProps["tone"], { ring: string; iconColor: string; valueColor: string }> = {
    violet: {
      ring: "border-violet-500/30 bg-violet-500/10",
      iconColor: "text-violet-300",
      valueColor: "text-violet-50",
    },
    emerald: {
      ring: "border-emerald-500/30 bg-emerald-500/10",
      iconColor: "text-emerald-300",
      valueColor: "text-emerald-50",
    },
    cyan: {
      ring: "border-cyan-500/30 bg-cyan-500/10",
      iconColor: "text-cyan-300",
      valueColor: "text-cyan-50",
    },
    amber: {
      ring: "border-amber-500/30 bg-amber-500/10",
      iconColor: "text-amber-300",
      valueColor: "text-amber-50",
    },
  };
  const t = TONE_MAP[tone];
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 backdrop-blur-md ${t.ring}`}
    >
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/25 ${t.iconColor}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold leading-tight ${t.valueColor}`}>{value}</p>
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
      </div>
    </div>
  );
}

type BucketProps = {
  id: string;
  tone: "emerald" | "violet";
  icon: LucideIcon;
  title: string;
  subtitle: string;
  items: string[];
  itemIcon: LucideIcon;
};

function ChangelogBucket({ id, tone, icon: Icon, title, subtitle, items, itemIcon: ItemIcon }: BucketProps) {
  const TONE_MAP: Record<
    BucketProps["tone"],
    { border: string; gradient: string; iconBg: string; iconColor: string; bullet: string }
  > = {
    emerald: {
      border: "border-emerald-500/20",
      gradient: "bg-gradient-to-b from-emerald-500/10 to-transparent",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-200",
      bullet: "text-emerald-400/90",
    },
    violet: {
      border: "border-violet-500/25",
      gradient: "bg-gradient-to-b from-violet-600/12 to-transparent",
      iconBg: "bg-violet-600/25",
      iconColor: "text-violet-100",
      bullet: "text-violet-300/90",
    },
  };
  const t = TONE_MAP[tone];
  return (
    <section
      className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 sm:p-6 ${t.border} ${t.gradient}`}
      aria-labelledby={id}
    >
      <h3 id={id} className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg} ${t.iconColor}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {title}
      </h3>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)] sm:text-sm">{subtitle}</p>
      <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
        {items.map((line, idx) => (
          <li key={`${id}-${idx}`} className="flex gap-3">
            <ItemIcon className={`mt-0.5 h-5 w-5 shrink-0 ${t.bullet}`} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type FooterLinkProps = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: "violet" | "emerald" | "cyan" | "amber" | "fuchsia";
  accent?: boolean;
};

function FooterLink({ href, label, description, icon: Icon, tone, accent }: FooterLinkProps) {
  const TONE_MAP: Record<FooterLinkProps["tone"], { iconBg: string; iconColor: string; ring: string }> = {
    violet: { iconBg: "bg-violet-500/15", iconColor: "text-violet-300", ring: "hover:border-violet-500/40" },
    emerald: { iconBg: "bg-emerald-500/15", iconColor: "text-emerald-300", ring: "hover:border-emerald-500/40" },
    cyan: { iconBg: "bg-cyan-500/15", iconColor: "text-cyan-300", ring: "hover:border-cyan-500/40" },
    amber: { iconBg: "bg-amber-500/15", iconColor: "text-amber-300", ring: "hover:border-amber-500/40" },
    fuchsia: { iconBg: "bg-fuchsia-500/15", iconColor: "text-fuchsia-300", ring: "hover:border-fuchsia-500/40" },
  };
  const t = TONE_MAP[tone];
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${t.ring}`}
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.iconColor}`}
        aria-hidden
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[var(--color-text)]">{label}</p>
          {accent ? (
            <span className="rounded-full border border-violet-500/40 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-violet-300">
              Nouveau
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">{description}</p>
      </div>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition group-hover:translate-x-1 group-hover:text-violet-300"
        aria-hidden
      />
    </Link>
  );
}
