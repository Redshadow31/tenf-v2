"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Heart,
  History,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RemerciementsLeftRail,
  RemerciementsRightRail,
  type RemerciementsAudience,
} from "@/components/remerciements/RemerciementsPublicRails";
import type { OrgChartEntry } from "@/lib/staff/orgChartTypes";
import { getStaffRoleDefinition } from "@/lib/staff/staffNomenclature";
import {
  FORMER_STAFF_ACCENT,
  FORMER_STAFF_BORDER,
  FORMER_STAFF_ROLE_LABEL,
  formerStaffDisplayBio,
  formerStaffInitials,
} from "@/lib/staff/formerStaffPresentation";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function entryMatchesSearch(entry: OrgChartEntry, q: string): boolean {
  if (!q.trim()) return true;
  const n = normalize(q.trim());
  const hay = [
    entry.member.displayName,
    entry.member.twitchLogin,
    entry.member.discordUsername,
    entry.bioShort,
    formerStaffDisplayBio(entry),
  ]
    .filter(Boolean)
    .join(" ");
  return normalize(hay).includes(n);
}

function FormerStaffProfileModal({
  entry,
  onClose,
}: {
  entry: OrgChartEntry;
  onClose: () => void;
}) {
  const bio = formerStaffDisplayBio(entry);
  const roleDef = getStaffRoleDefinition("ANCIEN_STAFF_TENF");
  const twitchUrl = entry.member.twitchLogin
    ? `https://www.twitch.tv/${encodeURIComponent(entry.member.twitchLogin)}`
    : null;
  const showRemercie = entry.statusKey === "REMERCIE";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      style={{ backgroundColor: "rgba(2, 6, 23, 0.78)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border sm:max-h-[88vh] sm:rounded-3xl"
        style={{ borderColor: FORMER_STAFF_BORDER, backgroundColor: "var(--color-card)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="former-staff-modal-title"
      >
        <div
          className="relative shrink-0 overflow-hidden px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8"
          style={{
            background: `linear-gradient(145deg, rgba(212,168,83,0.22) 0%, rgba(15,23,42,0.92) 42%, var(--color-card) 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(212,168,83,0.4), transparent 70%)" }}
            aria-hidden
          />
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-xl border p-2.5 transition hover:bg-white/10"
            style={{ borderColor: "color-mix(in srgb, var(--color-border) 80%, white)", color: "var(--color-text-secondary)" }}
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative shrink-0">
              {entry.member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.member.avatarUrl}
                  alt=""
                  className="h-24 w-24 rounded-2xl border-2 object-cover shadow-2xl sm:h-28 sm:w-28"
                  style={{ borderColor: FORMER_STAFF_BORDER }}
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-3xl font-bold shadow-2xl sm:h-28 sm:w-28"
                  style={{ borderColor: FORMER_STAFF_BORDER, color: FORMER_STAFF_ACCENT }}
                >
                  {formerStaffInitials(entry)}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2"
                style={{ borderColor: "var(--color-card)", backgroundColor: FORMER_STAFF_ACCENT }}
                title="Ancien staff"
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1 pr-12 sm:pr-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: FORMER_STAFF_ACCENT }}>
                Reconnaissance TENF
              </p>
              <h2 id="former-staff-modal-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
                {entry.member.displayName}
              </h2>
              {entry.member.twitchLogin ? (
                <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                  @{entry.member.twitchLogin}
                </p>
              ) : null}
              {entry.member.discordUsername ? (
                <p
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  <MessageCircle size={14} className="opacity-80" aria-hidden />
                  Discord · {entry.member.discordUsername}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <span className="role-badge role-badge--staff-alumni text-xs">{FORMER_STAFF_ROLE_LABEL}</span>
            {showRemercie ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: `${FORMER_STAFF_ACCENT}44`,
                  color: FORMER_STAFF_ACCENT,
                  backgroundColor: "rgba(212,168,83,0.12)",
                }}
              >
                Remercié
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-5">
            {roleDef ? (
              <section
                className="rounded-2xl border p-4 sm:p-5 lg:col-span-2"
                style={{ borderColor: FORMER_STAFF_BORDER, backgroundColor: "rgba(15,23,42,0.35)" }}
              >
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
                  <History size={16} style={{ color: FORMER_STAFF_ACCENT }} aria-hidden />
                  Merci pour le passé
                </h3>
                <p className="mt-2 text-sm font-medium" style={{ color: FORMER_STAFF_ACCENT }}>
                  {roleDef.short}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Reconnaissance officielle TENF. Pas une fonction active aujourd&apos;hui.
                </p>
              </section>
            ) : null}

            <section
              className={`rounded-2xl border p-4 sm:p-5 ${roleDef ? "lg:col-span-3" : "lg:col-span-5"}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15,23,42,0.2)" }}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
                <Sparkles size={16} style={{ color: FORMER_STAFF_ACCENT }} aria-hidden />
                Contribution reconnue
              </h3>
              <p className="mt-3 text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
                {bio}
              </p>
            </section>
          </div>

          <div
            className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--color-border)" }}
          >
            {twitchUrl ? (
              <a
                href={twitchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: FORMER_STAFF_ACCENT, color: "#1c1917" }}
              >
                Voir sur Twitch
                <ExternalLink size={15} aria-hidden />
              </a>
            ) : (
              <span />
            )}
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Cette personne ne fait plus partie du staff actif. Tu peux découvrir sa chaîne — pour une demande staff,
              passe par l&apos;organigramme du jour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormerStaffCard({
  entry,
  index,
  onSelect,
}: {
  entry: OrgChartEntry;
  index: number;
  onSelect: () => void;
}) {
  const bio = formerStaffDisplayBio(entry);
  const showRemercie = entry.statusKey === "REMERCIE";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="former-staff-card group relative h-full w-full min-w-0 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: FORMER_STAFF_BORDER,
        background:
          "linear-gradient(135deg, rgba(180,134,11,0.14), rgba(15,23,42,0.88) 38%, rgba(2,6,23,0.96) 100%)",
        boxShadow: `inset 0 3px 0 0 ${FORMER_STAFF_ACCENT}55`,
        animationDelay: `${Math.min(index * 45, 360)}ms`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "rgba(212,168,83,0.25)" }}
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        {entry.member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.member.avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl border-2 object-cover ring-2 ring-transparent transition group-hover:ring-amber-400/35 sm:h-[4.5rem] sm:w-[4.5rem]"
            style={{ borderColor: FORMER_STAFF_BORDER }}
          />
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-lg font-semibold sm:h-[4.5rem] sm:w-[4.5rem]"
            style={{ borderColor: FORMER_STAFF_BORDER, color: FORMER_STAFF_ACCENT }}
          >
            {formerStaffInitials(entry)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold sm:text-lg" style={{ color: "var(--color-text)" }}>
            {entry.member.displayName}
          </h2>
          {entry.member.twitchLogin ? (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              @{entry.member.twitchLogin}
            </p>
          ) : null}
        </div>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 opacity-0 transition group-hover:opacity-70"
          style={{ color: FORMER_STAFF_ACCENT }}
          aria-hidden
        />
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="role-badge role-badge--staff-alumni text-xs">{FORMER_STAFF_ROLE_LABEL}</span>
        {showRemercie ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
              borderColor: `${FORMER_STAFF_ACCENT}44`,
              color: FORMER_STAFF_ACCENT,
              backgroundColor: "rgba(212,168,83,0.12)",
            }}
          >
            Remercié
          </span>
        ) : null}
      </div>

      {entry.member.discordUsername ? (
        <p
          className="relative mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <MessageCircle size={12} className="opacity-80" aria-hidden />
          Discord · {entry.member.discordUsername}
        </p>
      ) : null}

      <p className="relative mt-3 line-clamp-4 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {bio}
      </p>

      <p className="relative mt-4 text-xs font-semibold" style={{ color: FORMER_STAFF_ACCENT }}>
        En savoir plus →
      </p>
    </button>
  );
}

const DISTINCTION_ITEMS = [
  {
    title: "Soutien TENF",
    accent: "#22c55e",
    border: "rgba(34,197,94,0.35)",
    forVisitor: "Quelqu'un aide le staff en ce moment, sur une mission précise. Tu le vois sur l'organigramme actif.",
    forMember: "Aide concrète en cours — pas un souvenir. Si tu as besoin d'un interlocuteur staff, cherche plutôt ce badge-là.",
  },
  {
    title: "Ancien Staff TENF",
    accent: FORMER_STAFF_ACCENT,
    border: FORMER_STAFF_BORDER,
    forVisitor:
      "Un remerciement pour celles et ceux qui ont fait partie de l'équipe par le passé. Présents ici, pas sur l'organigramme.",
    forMember:
      "Reconnaissance officielle, badge doré. Ce n'est plus une fonction : pas de modération, pas de ticket staff via cette page.",
  },
];

const HERO_COPY: Record<
  RemerciementsAudience,
  { lead: string; body: string; ctaSecondary: string }
> = {
  visitor: {
    lead: "Merci à celles et ceux qui ont aidé TENF à grandir.",
    body: "Twitch Entraide New Family s'est construit avec des bénévoles. Cette page met en lumière d'anciens membres du staff : un remerciement pour le passé, sans confondre avec l'équipe qui s'occupe du serveur aujourd'hui.",
    ctaSecondary: "Voir qui on remercie",
  },
  member: {
    lead: "Ici, on remercie — on ne modère plus.",
    body: "Tu connais peut-être encore certaines têtes du staff d'avant. Elles restent chères à TENF, mais ne portent plus de rôle actif. Pour une question ou un signalement, repère toujours l'organigramme du staff en fonction.",
    ctaSecondary: "Parcourir les profils",
  },
};

export default function RemerciementsClient({ entries }: { entries: OrgChartEntry[] }) {
  const [audience, setAudience] = useState<RemerciementsAudience>("visitor");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<OrgChartEntry | null>(null);

  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) =>
        (a.member.displayName || a.member.twitchLogin || "").localeCompare(
          b.member.displayName || b.member.twitchLogin || "",
          "fr",
          { sensitivity: "base" },
        ),
      ),
    [entries],
  );

  const filtered = useMemo(
    () => sorted.filter((entry) => entryMatchesSearch(entry, searchQuery)),
    [sorted, searchQuery],
  );

  const remercieCount = useMemo(
    () => sorted.filter((e) => e.statusKey === "REMERCIE").length,
    [sorted],
  );

  const scrollToProfiles = useCallback(() => {
    document.getElementById("remerciements-profiles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToUnderstand = useCallback(() => {
    document.getElementById("remerciements-understand")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const resetSearch = useCallback(() => setSearchQuery(""), []);
  const heroCopy = HERO_COPY[audience];

  return (
    <main
      className="remerciements-page relative min-h-screen w-full overflow-x-hidden py-6 sm:py-8 lg:py-10"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="remerciements-bg-mesh" aria-hidden="true" />
      <div className="remerciements-bg-glow remerciements-bg-glow-left" aria-hidden="true" />
      <div className="remerciements-bg-glow remerciements-bg-glow-right" aria-hidden="true" />

      <div className="remerciements-shell relative z-10 mx-auto w-full max-w-[min(100%,1920px)] px-[clamp(0.65rem,1.35vw,1.85rem)]">
        <nav
          className="remerciements-fade-up mb-6 flex flex-wrap items-center gap-2 text-sm"
          aria-label="Fil d'Ariane"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <Link href="/" className="transition hover:underline">
            Accueil
          </Link>
          <ChevronRight size={14} className="opacity-50" aria-hidden />
          <Link href="/organisation-staff" className="transition hover:underline">
            Staff &amp; organisation
          </Link>
          <ChevronRight size={14} className="opacity-50" aria-hidden />
          <span style={{ color: "var(--color-text)" }}>Remerciements</span>
        </nav>

        {/* Workspace 3 colonnes — rails latéraux sur toute la hauteur du contenu */}
        <div className="remerciements-workspace items-start">
          <aside className="remerciements-side-rail lg:sticky lg:top-20 lg:self-start">
            <RemerciementsLeftRail
              audience={audience}
              profileCount={sorted.length}
              onScrollToProfiles={scrollToProfiles}
              onScrollToUnderstand={scrollToUnderstand}
            />
          </aside>

          <div className="remerciements-main-column min-w-0 flex flex-col gap-8 lg:gap-10">
            {/* Hero — colonne centrale */}
            <section
              className="remerciements-fade-up relative overflow-hidden rounded-3xl border"
              style={{
                borderColor: FORMER_STAFF_BORDER,
                background:
                  "radial-gradient(120% 130% at 10% 0%, rgba(212,168,83,0.2), rgba(15,23,42,0.15) 38%, rgba(2,6,23,0.78) 100%)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(212,168,83,0.35), transparent 70%)" }}
              />
              <div className="relative p-7 sm:p-9 lg:p-10">
                <p
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: FORMER_STAFF_ACCENT }}
                >
                  <History size={14} aria-hidden />
                  Remerciements · TENF
                </p>
                <h1 className="mt-3 text-3xl font-bold md:text-4xl xl:text-5xl md:leading-tight" style={{ color: "var(--color-text)" }}>
                  Remerciements TENF
                </h1>
                <p className="mt-3 text-lg font-medium md:text-xl" style={{ color: FORMER_STAFF_ACCENT }}>
                  {heroCopy.lead}
                </p>
                <p className="mt-4 text-base leading-relaxed md:text-[17px]" style={{ color: "var(--color-text-secondary)" }}>
                  {heroCopy.body}
                </p>

                <div
                  className="mt-6 inline-flex rounded-2xl border p-1"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
                  role="tablist"
                  aria-label="Mode de lecture"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={audience === "visitor"}
                    className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: audience === "visitor" ? FORMER_STAFF_ACCENT : "transparent",
                      color: audience === "visitor" ? "#1c1917" : "var(--color-text-secondary)",
                    }}
                    onClick={() => setAudience("visitor")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sparkles size={15} aria-hidden />
                      Je découvre TENF
                    </span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={audience === "member"}
                    className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: audience === "member" ? FORMER_STAFF_ACCENT : "transparent",
                      color: audience === "member" ? "#1c1917" : "var(--color-text-secondary)",
                    }}
                    onClick={() => setAudience("member")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Users size={15} aria-hidden />
                      Je suis membre
                    </span>
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/organisation-staff/organigramme"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                      boxShadow: "0 12px 28px rgba(59,130,246,0.22)",
                    }}
                  >
                    Staff actif aujourd&apos;hui
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={scrollToProfiles}
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-amber-500/10"
                    style={{ borderColor: FORMER_STAFF_BORDER, color: "#fef3c7" }}
                  >
                    <Heart size={16} aria-hidden />
                    {heroCopy.ctaSecondary}
                  </button>
                </div>
              </div>
            </section>
            {/* Section compréhension */}
            <section id="remerciements-understand" className="remerciements-fade-up scroll-mt-28 space-y-4">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
                  Deux badges, deux sens
                </h2>
                <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                  {audience === "member"
                    ? "Pour ne pas confondre qui intervient encore et qui est remercié pour le passé."
                    : "Simple repère : vert = aide en cours, doré = merci pour le passé."}
                </p>
              </div>

              <div className="remerciements-distinction-grid">
                {DISTINCTION_ITEMS.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border p-5 sm:p-6"
                    style={{
                      borderColor: item.border,
                      background: `linear-gradient(135deg, ${item.accent}14, rgba(15,23,42,0.9) 50%, rgba(2,6,23,0.95) 100%)`,
                      boxShadow: `inset 0 3px 0 0 ${item.accent}44`,
                    }}
                  >
                    <h3 className="text-lg font-bold" style={{ color: item.accent }}>
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {audience === "member" ? item.forMember : item.forVisitor}
                    </p>
                  </article>
                ))}
              </div>

              <div
                className="rounded-2xl border px-5 py-4 sm:px-6"
                style={{ borderColor: FORMER_STAFF_BORDER, backgroundColor: "rgba(212,168,83,0.08)" }}
              >
                <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>En résumé :</strong>{" "}
                  {audience === "member"
                    ? "« Ancien Staff TENF » = on te dit merci pour ton passage dans l'équipe. Ce n'est plus ton rôle opérationnel sur le serveur."
                    : "Les personnes listées plus bas ont donné de leur temps au staff TENF. On les remercie ici — elles ne représentent pas l'équipe qui gère le serveur aujourd'hui."}
                </p>
              </div>
            </section>

            {/* Barre recherche mobile */}
            <section
              className="remerciements-mobile-search remerciements-fade-up rounded-2xl border p-4"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
            >
              <label className="relative block">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                  style={{ color: "var(--color-text-secondary)" }}
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un pseudo, Twitch, bio…"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "rgba(15,23,42,0.6)",
                    color: "var(--color-text)",
                  }}
                />
              </label>
            </section>

            {/* Grille profils */}
            <section id="remerciements-profiles" className="remerciements-fade-up scroll-mt-28 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
                    Celles et ceux qu&apos;on remercie
                  </h2>
                  <p className="mt-1 text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    {audience === "member"
                      ? "Clique une carte pour lire leur parcours — ou découvrir leur chaîne Twitch."
                      : "Des visages de l'histoire TENF. Clique une carte pour en savoir plus."}
                  </p>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: FORMER_STAFF_BORDER, color: "var(--color-text-secondary)" }}
                >
                  {filtered.length} / {sorted.length} profil{sorted.length > 1 ? "s" : ""}
                </span>
              </div>

              {sorted.length === 0 ? (
                <div
                  className="rounded-2xl border p-10 text-center"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <History size={40} className="mx-auto opacity-40" style={{ color: FORMER_STAFF_ACCENT }} aria-hidden />
                  <p className="mt-4 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    Aucun profil à afficher pour le moment
                  </p>
                  <p className="mt-2 mx-auto max-w-md text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {audience === "member"
                      ? "Les profils remerciés seront ajoutés ici au fil du temps, depuis la gestion staff."
                      : "Cette liste s'enrichit au fil des remerciements officiels TENF."}
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="rounded-2xl border p-10 text-center"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    Aucun résultat pour « {searchQuery} »
                  </p>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                    style={{ backgroundColor: FORMER_STAFF_ACCENT, color: "#1c1917" }}
                  >
                    Réinitialiser la recherche
                  </button>
                </div>
              ) : (
                <div className="former-staff-cards-grid">
                  {filtered.map((entry, index) => (
                    <FormerStaffCard
                      key={entry.id}
                      entry={entry}
                      index={index}
                      onSelect={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* CTA bas de page */}
            <section
              className="remerciements-fade-up rounded-2xl border p-6 sm:p-8"
              style={{
                borderColor: "rgba(59,130,246,0.35)",
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(15,23,42,0.85) 45%, rgba(2,6,23,0.95) 100%)",
              }}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#93c5fd" }}>
                    Équipe opérationnelle
                  </p>
                  <h2 className="mt-2 text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text)" }}>
                    {audience === "member" ? "Une question pour le staff actuel ?" : "Besoin d'aide sur TENF ?"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    {audience === "member"
                      ? "Modération, organisation, soutien en mission : l'organigramme te montre qui intervient aujourd'hui. Ce n'est pas le rôle de cette page."
                      : "Pour savoir qui s'occupe du serveur en ce moment, consulte l'organigramme du staff actif — c'est la bonne porte d'entrée."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link
                    href="/organisation-staff/organigramme"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: "var(--color-primary)", color: "white" }}
                  >
                    Organigramme actif
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                  <Link
                    href="/organisation-staff"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Rôles &amp; pôles
                  </Link>
                </div>
              </div>
            </section>

            {/* Rails mobile */}
            <details
              className="remerciements-mobile-panel remerciements-fade-up rounded-2xl border p-4"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
            >
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Guide, FAQ &amp; liens
              </summary>
              <div className="mt-4 space-y-6">
                <RemerciementsLeftRail
                  audience={audience}
                  profileCount={sorted.length}
                  onScrollToProfiles={scrollToProfiles}
                  onScrollToUnderstand={scrollToUnderstand}
                />
                <RemerciementsRightRail
                  audience={audience}
                  profileCount={sorted.length}
                  remercieCount={remercieCount}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onResetSearch={resetSearch}
                />
              </div>
            </details>
          </div>

          <aside className="remerciements-side-rail lg:sticky lg:top-20 lg:self-start">
            <RemerciementsRightRail
              audience={audience}
              profileCount={sorted.length}
              remercieCount={remercieCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onResetSearch={resetSearch}
            />
          </aside>
        </div>
      </div>

      {selectedEntry ? (
        <FormerStaffProfileModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      ) : null}

      <style jsx>{`
        .remerciements-shell {
          container-type: inline-size;
          container-name: remerciements;
          width: 100%;
        }

        .remerciements-workspace {
          display: grid;
          width: 100%;
          gap: clamp(0.85rem, 1.6cqw, 1.75rem);
          grid-template-columns: minmax(0, 1fr);
        }

        .remerciements-side-rail {
          display: none;
        }

        .remerciements-mobile-search,
        .remerciements-mobile-panel {
          display: block;
        }

        @container remerciements (min-width: 52rem) and (max-width: 67.99rem) {
          .remerciements-workspace {
            grid-template-columns:
              minmax(0, clamp(12rem, 20cqw, 17.5rem))
              minmax(0, 1fr);
          }

          .remerciements-side-rail {
            display: block;
            border-radius: 1rem;
            border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
            background: linear-gradient(180deg, rgba(2, 6, 23, 0.58) 0%, rgba(2, 6, 23, 0.32) 100%);
            padding: clamp(0.65rem, 1.2cqw, 1rem);
            scrollbar-width: thin;
          }

          .remerciements-side-rail:last-of-type {
            display: none;
          }

          .remerciements-mobile-search {
            display: none;
          }

          .remerciements-mobile-panel {
            display: block;
          }
        }

        @container remerciements (min-width: 68rem) {
          .remerciements-workspace {
            grid-template-columns:
              minmax(0, clamp(12.5rem, 17cqw, 20rem))
              minmax(0, 1fr)
              minmax(0, clamp(13.5rem, 19cqw, 22rem));
          }

          .remerciements-side-rail {
            display: block;
            border-radius: 1rem;
            border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
            background: linear-gradient(180deg, rgba(2, 6, 23, 0.58) 0%, rgba(2, 6, 23, 0.32) 100%);
            padding: clamp(0.65rem, 1.2cqw, 1rem);
            scrollbar-width: thin;
          }

          .remerciements-mobile-search,
          .remerciements-mobile-panel {
            display: none;
          }
        }

        @container remerciements (min-width: 72rem) {
          .remerciements-workspace {
            grid-template-columns:
              minmax(0, clamp(14rem, 15cqw, 22rem))
              minmax(0, 2.4fr)
              minmax(0, clamp(15rem, 17cqw, 24rem));
            gap: clamp(1rem, 2cqw, 2rem);
          }
        }

        .remerciements-main-column {
          container-type: inline-size;
          container-name: remerciements-main;
        }

        .remerciements-distinction-grid {
          display: grid;
          gap: clamp(0.75rem, 1.5cqw, 1rem);
          grid-template-columns: minmax(0, 1fr);
        }

        @container remerciements-main (min-width: 36rem) {
          .remerciements-distinction-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .remerciements-bg-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.32;
          background-image:
            radial-gradient(circle at 18% 18%, rgba(212, 168, 83, 0.11), transparent 35%),
            radial-gradient(circle at 82% 12%, rgba(180, 134, 11, 0.09), transparent 30%),
            radial-gradient(circle at 70% 72%, rgba(146, 103, 9, 0.07), transparent 35%),
            radial-gradient(circle at 40% 55%, rgba(59, 130, 246, 0.04), transparent 40%);
        }

        .remerciements-bg-glow {
          position: absolute;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.24;
          animation: remerciementsFloat 9s ease-in-out infinite;
        }

        .remerciements-bg-glow-left {
          left: max(-80px, calc(50% - 52rem));
          top: 8%;
          width: min(420px, 28vw);
          height: min(420px, 40vh);
          background: rgba(212, 168, 83, 0.38);
        }

        .remerciements-bg-glow-right {
          right: max(-80px, calc(50% - 52rem));
          bottom: 4%;
          width: min(420px, 28vw);
          height: min(420px, 40vh);
          background: rgba(180, 134, 11, 0.3);
          animation-delay: 1.4s;
        }

        .remerciements-fade-up {
          animation: remerciementsFadeUp 0.55s ease both;
        }

        .former-staff-card {
          animation: remerciementsFadeUp 0.55s ease both;
        }

        .former-staff-cards-grid {
          display: grid;
          gap: clamp(0.65rem, 1.2cqw, 1rem);
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 15.5rem), 1fr));
        }

        @keyframes remerciementsFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes remerciementsFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </main>
  );
}
