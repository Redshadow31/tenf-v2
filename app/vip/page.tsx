"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Award,
  CalendarClock,
  Clapperboard,
  Crown,
  ExternalLink,
  Flame,
  Heart,
  History,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  Twitch,
  Users,
  Video,
} from "lucide-react";

// ============================================================
// Types
// ============================================================
interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
  vipBadge?: string;
  consecutiveMonths?: number;
}

// ============================================================
// Wrapper fluide (pleine largeur scalable au zoom)
// ============================================================
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--vip-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--vip-px)",
  paddingRight: "var(--vip-px)",
  paddingTop: "clamp(1rem, 2vw, 2rem)",
  paddingBottom: "clamp(2rem, 3vw, 3.5rem)",
};

const PAGE_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

// ============================================================
// Utilitaires
// ============================================================
function getCurrentMonthLabel() {
  return new Date()
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
}

type IconType = React.ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

// ============================================================
// Sous-composants
// ============================================================
function StatChip({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: IconType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-2 transition hover:-translate-y-0.5"
      style={{
        borderColor: `color-mix(in srgb, ${tone} 30%, var(--color-border))`,
        backgroundColor: "var(--color-card)",
      }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `color-mix(in srgb, ${tone} 18%, transparent)`,
          color: tone,
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </p>
        <p
          className="truncate text-sm font-bold sm:text-base"
          style={{ color: "var(--color-text)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function HowItWorksCard({
  step,
  Icon,
  title,
  desc,
  tone,
}: {
  step: number;
  Icon: IconType;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <article
      className="group relative h-full overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.3)]"
      style={{
        borderColor: `color-mix(in srgb, ${tone} 30%, var(--color-border))`,
        backgroundColor: "var(--color-card)",
      }}
    >
      <span
        className="absolute right-3 top-3 text-5xl font-black opacity-10 transition-opacity group-hover:opacity-20"
        style={{ color: tone }}
        aria-hidden
      >
        0{step}
      </span>
      <span
        className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-110"
        style={{
          backgroundColor: `color-mix(in srgb, ${tone} 18%, transparent)`,
          color: tone,
        }}
        aria-hidden
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3
        className="mb-1.5 text-base font-bold sm:text-lg"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {desc}
      </p>
    </article>
  );
}

function PerkRow({
  Icon,
  title,
  desc,
  tone,
}: {
  Icon: IconType;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <li
      className="flex items-start gap-3 rounded-xl border p-3.5 transition hover:-translate-y-0.5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `color-mix(in srgb, ${tone} 18%, transparent)`,
          color: tone,
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p
          className="text-sm font-bold sm:text-base"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </p>
        <p
          className="text-xs leading-relaxed sm:text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {desc}
        </p>
      </div>
    </li>
  );
}

function ActionCard({
  href,
  Icon,
  title,
  desc,
  tone,
}: {
  href: string;
  Icon: IconType;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:p-6"
      style={{
        borderColor: `color-mix(in srgb, ${tone} 35%, var(--color-border))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${tone} 12%, transparent), var(--color-card))`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-80"
        style={{ backgroundColor: tone }}
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
          style={{
            backgroundColor: `color-mix(in srgb, ${tone} 22%, transparent)`,
            color: tone,
          }}
          aria-hidden
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3
            className="text-base font-bold sm:text-lg"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {desc}
          </p>
        </div>
      </div>
      <span
        className="relative inline-flex items-center gap-1 text-sm font-bold transition group-hover:gap-2"
        style={{ color: tone }}
      >
        Découvrir
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}

function VipCardSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border p-4"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />
      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      <div className="h-2.5 w-16 animate-pulse rounded bg-white/5" />
    </div>
  );
}

// ============================================================
// Page
// ============================================================
export default function VipPage() {
  const [vipMembers, setVipMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVipMembers() {
      try {
        const response = await fetch("/api/vip-members", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch VIP members");
        }
        const data = await response.json();
        setVipMembers(data.members || []);
      } catch (err) {
        console.error("Error fetching VIP members:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchVipMembers();
  }, []);

  const currentMonth = useMemo(() => getCurrentMonthLabel(), []);

  const stats = useMemo(() => {
    const total = vipMembers.length;
    const withTwitch = vipMembers.filter((m) => m.twitchUrl).length;
    const veterans = vipMembers.filter(
      (m) => (m.consecutiveMonths ?? 0) >= 3
    ).length;
    return { total, withTwitch, veterans };
  }, [vipMembers]);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)", ...PAGE_OUTER_STYLE }}
    >
      <div className="flex flex-col gap-10 sm:gap-12" style={PAGE_INNER_STYLE}>
        {/* ---------------- HERO ---------------- */}
        <section
          aria-labelledby="vip-hero-title"
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10"
          style={{
            borderColor: "rgba(234,179,8,0.35)",
            background:
              "linear-gradient(135deg, rgba(234,179,8,0.16), rgba(145,70,255,0.10) 50%, rgba(15,17,22,0.55))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(234,179,8,0.2)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(145,70,255,0.18)" }}
            aria-hidden
          />

          <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
                  style={{
                    backgroundColor: "rgba(234,179,8,0.18)",
                    color: "#fde68a",
                  }}
                >
                  <Crown className="h-3.5 w-3.5" aria-hidden />
                  VIP TENF
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
                  style={{
                    borderColor: "rgba(255,255,255,0.16)",
                    color: "var(--color-text-secondary)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  {currentMonth}
                </span>
              </div>

              <h1
                id="vip-hero-title"
                className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--color-text)" }}
              >
                Les VIP du mois
              </h1>
              <p
                className="max-w-2xl text-base font-semibold leading-relaxed sm:text-xl"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Une couronne, pas pour le prestige — pour dire merci.
              </p>
              <p
                className="max-w-2xl text-sm leading-relaxed sm:text-base"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Chaque mois, on met en avant des membres qui font vibrer la
                New Family : présence sur les lives, entraide entre
                créateur·ices, énergie positive sur Discord. Pas de classement
                froid : juste un coup de projecteur sur celles et ceux qui
                font de TENF un endroit chaleureux.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href="/vip/interviews"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 12px 30px rgba(145,70,255,0.35)",
                  }}
                >
                  <Video className="h-4 w-4" aria-hidden />
                  Voir les interviews
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/vip/historique"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <History className="h-4 w-4" aria-hidden />
                  Historique
                </Link>
                <Link
                  href="/vip/clips"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <Clapperboard className="h-4 w-4" aria-hidden />
                  Les clips
                </Link>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-1">
              <StatChip
                Icon={Crown}
                label="VIP du mois"
                value={loading ? "…" : String(stats.total)}
                tone="#facc15"
              />
              <StatChip
                Icon={Flame}
                label="Vétérans (≥ 3 mois)"
                value={loading ? "…" : String(stats.veterans)}
                tone="#f97316"
              />
              <StatChip
                Icon={Twitch}
                label="Avec chaîne Twitch"
                value={loading ? "…" : String(stats.withTwitch)}
                tone="#a78bfa"
              />
            </div>
          </div>
        </section>

        {/* ---------------- COMMENT DEVENIR VIP ---------------- */}
        <section
          aria-labelledby="vip-howto-title"
          className="space-y-5"
        >
          <div className="space-y-2">
            <p
              className="text-sm font-bold uppercase tracking-[0.14em]"
              style={{ color: "rgba(253,224,71,0.9)" }}
            >
              Comment ça marche
            </p>
            <h2
              id="vip-howto-title"
              className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              Trois ingrédients pour briller en VIP
            </h2>
            <p
              className="max-w-3xl text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Le badge VIP n&apos;est pas une compétition — c&apos;est une
              reconnaissance de l&apos;équipe pour les membres qui font vivre
              la communauté au quotidien, à leur manière.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HowItWorksCard
              step={1}
              Icon={Users}
              title="Tu es présent·e"
              desc="Sur Discord, sur les lives, dans les events… ta présence régulière fait la différence."
              tone="#a78bfa"
            />
            <HowItWorksCard
              step={2}
              Icon={Heart}
              title="Tu aides les autres"
              desc="Conseils, partages, follow d'une chaîne, message bienveillant : chaque geste compte."
              tone="#f43f5e"
            />
            <HowItWorksCard
              step={3}
              Icon={Sparkles}
              title="Tu fais vivre l'ambiance"
              desc="Réactions, vannes, idées, soutien : tu apportes ta couleur à la New Family."
              tone="#38bdf8"
            />
          </div>
        </section>

        {/* ---------------- LE MOIS EN COURS ---------------- */}
        <section
          aria-labelledby="vip-month-title"
          className="space-y-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <p
                className="text-sm font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(253,224,71,0.9)" }}
              >
                {currentMonth}
              </p>
              <h2
                id="vip-month-title"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                style={{ color: "var(--color-text)" }}
              >
                Les membres mis en avant ce mois-ci
              </h2>
            </div>
            <Link
              href="/vip/historique"
              className="inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2"
              style={{ color: "var(--color-primary)" }}
            >
              Voir les mois précédents
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 10 }).map((_, idx) => (
                <VipCardSkeleton key={`skeleton-${idx}`} />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-2xl border p-5 sm:p-6"
              style={{
                borderColor: "rgba(248,113,113,0.4)",
                backgroundColor: "rgba(248,113,113,0.08)",
                color: "var(--color-text)",
              }}
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(248,113,113,0.18)" }}
                aria-hidden
              >
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold">
                  Impossible de charger les VIP du moment
                </p>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {error}. Réessaie d&apos;ici quelques instants, ça arrive
                  parfois quand Twitch met du temps à répondre.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetch("/api/vip-members", { cache: "no-store" })
                    .then((r) => r.json())
                    .then((d) => setVipMembers(d.members || []))
                    .catch((err) =>
                      setError(
                        err instanceof Error ? err.message : "Unknown error"
                      )
                    )
                    .finally(() => setLoading(false));
                }}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <Loader2 className="h-4 w-4" aria-hidden />
                Réessayer
              </button>
            </div>
          ) : vipMembers.length === 0 ? (
            <div
              className="flex flex-col items-start gap-3 rounded-2xl border p-5 sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
              }}
            >
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(234,179,8,0.18)" }}
                aria-hidden
              >
                <Crown className="h-6 w-6 text-yellow-300" aria-hidden />
              </span>
              <div>
                <p
                  className="text-base font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  Aucun VIP affiché pour le moment.
                </p>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  La sélection arrive dès que le staff a fini de la préparer.
                  Reviens d&apos;ici quelques jours — ça pourrait bien être ton
                  tour. 💜
                </p>
              </div>
            </div>
          ) : (
            <ul
              role="list"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            >
              {vipMembers.map((member, idx) => {
                const months = member.consecutiveMonths ?? 0;
                const isVeteran = months >= 3;
                const isLegend = months >= 6;
                const accent = isLegend
                  ? "#facc15"
                  : isVeteran
                  ? "#f97316"
                  : "var(--color-primary)";

                const card = (
                  <article
                    className="group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border p-4 text-center transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.4)]"
                    style={{
                      borderColor: `color-mix(in srgb, ${accent} 35%, var(--color-border))`,
                      background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 10%, transparent), var(--color-card))`,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-3xl opacity-40 transition-opacity group-hover:opacity-70"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    />

                    {isLegend ? (
                      <span
                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: "rgba(234,179,8,0.18)",
                          color: "#fde68a",
                        }}
                        aria-label={`Légende — ${months} mois consécutifs`}
                      >
                        <Trophy className="h-3 w-3" aria-hidden />
                        Légende
                      </span>
                    ) : isVeteran ? (
                      <span
                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: "rgba(249,115,22,0.18)",
                          color: "#fdba74",
                        }}
                        aria-label={`Vétéran — ${months} mois consécutifs`}
                      >
                        <Flame className="h-3 w-3" aria-hidden />
                        Vétéran
                      </span>
                    ) : null}

                    <div className="relative mt-1">
                      <img
                        src={member.twitchAvatar || member.avatar}
                        alt={`Avatar de ${member.displayName}`}
                        loading={idx > 5 ? "lazy" : "eager"}
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-white/10 transition group-hover:ring-white/30 sm:h-24 sm:w-24"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (member.avatar && member.avatar !== target.src) {
                            target.src = member.avatar;
                          } else {
                            target.src = `https://placehold.co/96x96?text=${encodeURIComponent(
                              member.displayName.charAt(0)
                            )}`;
                          }
                        }}
                      />
                      <span
                        className="absolute -bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow"
                        style={{ backgroundColor: accent }}
                      >
                        <Crown className="h-2.5 w-2.5" aria-hidden />
                        {member.vipBadge || "VIP"}
                      </span>
                    </div>

                    <h3
                      className="mt-3 line-clamp-2 text-sm font-bold sm:text-base"
                      style={{ color: "var(--color-text)" }}
                    >
                      {member.displayName}
                    </h3>

                    {months > 0 ? (
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {months} mois consécutif{months > 1 ? "s" : ""}
                      </p>
                    ) : null}

                    {member.twitchUrl ? (
                      <span
                        className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold transition group-hover:gap-1.5"
                        style={{ color: "#a78bfa" }}
                      >
                        <Twitch className="h-3 w-3" aria-hidden />
                        Voir la chaîne
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </span>
                    ) : null}
                  </article>
                );

                return (
                  <li key={member.discordId} className="h-full">
                    {member.twitchUrl ? (
                      <Link
                        href={member.twitchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                        aria-label={`Ouvrir la chaîne Twitch de ${member.displayName}`}
                      >
                        {card}
                      </Link>
                    ) : (
                      card
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------------- AVANTAGES VIP ---------------- */}
        <section
          aria-labelledby="vip-perks-title"
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-10"
        >
          <div className="space-y-3">
            <p
              className="text-sm font-bold uppercase tracking-[0.14em]"
              style={{ color: "rgba(253,224,71,0.9)" }}
            >
              Les petits + du VIP
            </p>
            <h2
              id="vip-perks-title"
              className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              Ce que ça change concrètement
            </h2>
            <p
              className="max-w-md text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Aucune obligation, juste de la reconnaissance. Voici ce que la
              communauté met en place pour célébrer ses VIP du moment.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PerkRow
              Icon={Crown}
              tone="#facc15"
              title="Un badge VIP sur Discord et sur le site"
              desc="Une distinction visible auprès de toute la communauté pour le mois en cours."
            />
            <PerkRow
              Icon={Video}
              tone="#a78bfa"
              title="Une interview vidéo dédiée"
              desc="Une mini-séquence pour te présenter, parler de ta chaîne et de ton aventure."
            />
            <PerkRow
              Icon={Clapperboard}
              tone="#38bdf8"
              title="Tes meilleurs clips mis en avant"
              desc="Le staff sélectionne tes moments forts pour les partager côté communauté."
            />
            <PerkRow
              Icon={MessageCircle}
              tone="#f43f5e"
              title="Plus d'amour côté lives & raids"
              desc="Visibilité en priorité dans les events et raids communautaires du mois."
            />
            <PerkRow
              Icon={Star}
              tone="#22c55e"
              title="Un mot perso du staff"
              desc="Un message public et privé pour t'expliquer pourquoi on a tenu à te mettre en avant."
            />
            <PerkRow
              Icon={Award}
              tone="#fb923c"
              title="Un cumul historique"
              desc="Tes mois VIP s'accumulent et donnent accès aux statuts « Vétéran » et « Légende »."
            />
          </ul>
        </section>

        {/* ---------------- ACTIONS VERS SOUS-PAGES ---------------- */}
        <section
          aria-labelledby="vip-actions-title"
          className="space-y-5"
        >
          <div className="space-y-2">
            <p
              className="text-sm font-bold uppercase tracking-[0.14em]"
              style={{ color: "rgba(253,224,71,0.9)" }}
            >
              Continue l&apos;aventure
            </p>
            <h2
              id="vip-actions-title"
              className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              Aller plus loin avec les VIP
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            <ActionCard
              href="/vip/interviews"
              Icon={Video}
              title="Interviews vidéo"
              desc="Découvre les portraits des VIP mis en avant ces derniers mois."
              tone="#a78bfa"
            />
            <ActionCard
              href="/vip/historique"
              Icon={History}
              title="Historique des VIP"
              desc="Toutes les promotions précédentes, mois par mois, depuis le début."
              tone="#38bdf8"
            />
            <ActionCard
              href="/vip/clips"
              Icon={Clapperboard}
              title="Clips communautaires"
              desc="Les meilleurs moments des VIP et de la New Family, sélectionnés par le staff."
              tone="#f97316"
            />
          </div>
        </section>

        {/* ---------------- CTA FINAL ---------------- */}
        <section
          className="relative overflow-hidden rounded-2xl border p-6 sm:rounded-3xl sm:p-8 lg:p-10"
          style={{
            borderColor: "rgba(145,70,255,0.4)",
            background:
              "linear-gradient(135deg, rgba(145,70,255,0.18), rgba(234,179,8,0.10) 60%, rgba(15,17,22,0.55))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(236,72,153,0.2)" }}
            aria-hidden
          />
          <div className="relative space-y-4">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
              style={{
                backgroundColor: "rgba(145,70,255,0.22)",
                color: "#d8b4fe",
              }}
            >
              <Heart className="h-3.5 w-3.5" aria-hidden />
              Et toi, ton tour bientôt ?
            </span>
            <h2
              className="text-2xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: "var(--color-text)" }}
            >
              Le VIP, ça se mérite — mais ça se vit avant tout en famille.
            </h2>
            <p
              className="max-w-3xl text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Pas besoin de courir après le badge : présence, bienveillance et
              petits coups de pouce suffisent. Reste toi-même, soutiens les
              autres, et l&apos;équipe te repérera quand l&apos;occasion se
              présentera.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/membres"
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 12px 30px rgba(145,70,255,0.35)",
                }}
              >
                <Users className="h-4 w-4" aria-hidden />
                Découvrir la communauté
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/charte"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Lire la charte communautaire
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
