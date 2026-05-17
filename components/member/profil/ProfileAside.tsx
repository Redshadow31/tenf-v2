"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Radio,
  Twitch,
  type LucideIcon,
} from "lucide-react";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";

type ChecklistItem = { label: string; status: "ok" | "warning" | "missing" };

type ProfileAsideProps = {
  percent: number;
  items: ChecklistItem[];
  nextPlanning: { date: string; time: string; liveType: string } | null;
  integrationDate: string;
  twitchConnected: boolean;
  livePlanningHref: string;
  member: {
    displayName: string;
    twitchLogin: string;
    avatar: string;
    bio: string;
    socials: { twitch: string; discord: string; instagram: string; tiktok: string; twitter: string };
  };
  hasPublicProfileLink: boolean;
  publicProfileHref: string;
  quickActions: { label: string; href?: string; soon?: boolean }[];
};

const STATUS_ICON: Record<ChecklistItem["status"], { icon: LucideIcon; toneClass: string; label: string }> = {
  ok: { icon: CheckCircle2, toneClass: "text-emerald-400", label: "OK" },
  warning: { icon: AlertTriangle, toneClass: "text-amber-400", label: "À peaufiner" },
  missing: { icon: CircleDot, toneClass: "text-rose-400", label: "Manquant" },
};

export default function ProfileAside({
  percent,
  items,
  nextPlanning,
  integrationDate,
  twitchConnected,
  livePlanningHref,
  member,
  hasPublicProfileLink,
  publicProfileHref,
  quickActions,
}: ProfileAsideProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <aside
      aria-label="Repères et raccourcis"
      className="space-y-[clamp(0.55rem,0.85vw,0.95rem)] xl:sticky xl:top-[clamp(3.5rem,7vw,5rem)] xl:max-h-[calc(100dvh-1.5rem)] xl:overflow-y-auto xl:pr-1"
    >
      {/* Bloc complétion */}
      <section
        className="rounded-2xl border p-[clamp(0.85rem,1.1vw,1.2rem)]"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">Ta checklist profil</p>
        <p
          className="mt-1 text-pretty leading-snug text-zinc-400"
          style={{ fontSize: "clamp(0.74rem,0.82vw,0.82rem)" }}
        >
          Un coup d’œil sur ce qui brille et ce qui mérite un polish.
        </p>

        <div className="mt-3 mb-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
            <span>Complétion globale</span>
            <span className="tabular-nums text-violet-300">{clamped}%</span>
          </div>
          <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 transition-[width] duration-500"
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>

        <ul className="space-y-1.5">
          {items.map((item) => {
            const cfg = STATUS_ICON[item.status];
            const Icon = cfg.icon;
            return (
              <li
                key={item.label}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-2.5 py-1.5"
              >
                <Icon className={"h-4 w-4 shrink-0 " + cfg.toneClass} aria-hidden />
                <span
                  className="min-w-0 flex-1 truncate font-medium text-zinc-200"
                  style={{ fontSize: "clamp(0.78rem,0.86vw,0.86rem)" }}
                  title={item.label}
                >
                  {item.label}
                </span>
                <span
                  className={"shrink-0 text-[10px] font-bold uppercase tracking-wide " + cfg.toneClass + " opacity-90"}
                >
                  {cfg.label}
                </span>
              </li>
            );
          })}
        </ul>

        <Link
          href="/member/profil/completer"
          className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
        >
          Compléter mon profil
        </Link>
      </section>

      {/* Bloc repères rapides */}
      <section
        className="rounded-2xl border p-[clamp(0.85rem,1.1vw,1.2rem)]"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">Repères rapides</p>
        <ul className="mt-3 space-y-1.5">
          <li>
            <Link
              href={livePlanningHref}
              className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 transition hover:border-violet-400/30 hover:bg-violet-500/8"
            >
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <Radio className="h-3.5 w-3.5 text-violet-300/85" aria-hidden />
                Prochain live
              </span>
              <span
                className="text-right font-bold text-white"
                style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}
              >
                {nextPlanning
                  ? `${new Date(nextPlanning.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · ${nextPlanning.time}`
                  : "—"}
              </span>
            </Link>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <CalendarCheck className="h-3.5 w-3.5 text-sky-300/85" aria-hidden />
              Intégration
            </span>
            <span className="font-medium text-zinc-200" style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}>
              {integrationDate}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <Twitch className="h-3.5 w-3.5 text-[#bf94ff]" aria-hidden />
              Twitch OAuth
            </span>
            <span
              className={"font-bold " + (twitchConnected ? "text-emerald-300" : "text-zinc-400")}
              style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}
            >
              {twitchConnected ? "Relié" : "Non relié"}
            </span>
          </li>
        </ul>
      </section>

      {/* Bloc fiche publique */}
      <section
        className="rounded-2xl border p-[clamp(0.85rem,1.1vw,1.2rem)]"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">Aperçu fiche publique</p>
        <p
          className="mt-1 text-pretty leading-snug text-zinc-400"
          style={{ fontSize: "clamp(0.74rem,0.82vw,0.82rem)" }}
        >
          Ce que voient les autres membres et les visiteurs.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="border-b border-white/[0.06] bg-black/30 px-3 py-2.5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.avatar}
                alt=""
                className="h-10 w-10 rounded-lg border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <p
                  className="truncate font-bold text-white"
                  style={{ fontSize: "clamp(0.85rem,0.95vw,0.95rem)" }}
                >
                  {member.displayName}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  {hasPublicProfileLink ? `@${member.twitchLogin}` : "Pseudo Twitch à finaliser"}
                </p>
              </div>
            </div>
          </div>
          <div
            className="max-h-44 overflow-y-auto p-3"
            style={{ fontSize: "clamp(0.78rem,0.85vw,0.85rem)" }}
          >
            <DiscordMarkdownPreview
              content={member.bio || ""}
              emptyFallback="Ajoute une bio courte dans « Compléter mon profil »."
            />
          </div>
          <div className="border-t border-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-500">
            Twitch : {member.socials.twitch ? "ok" : "à compléter"} · Réseaux :{" "}
            {[member.socials.instagram, member.socials.tiktok, member.socials.twitter].filter(Boolean).length ||
              "aucun"}{" "}
            lien(s)
          </div>
        </div>
        {hasPublicProfileLink ? (
          <Link
            href={publicProfileHref}
            className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/18"
          >
            Ouvrir ma vraie fiche
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <p className="mt-3 text-center text-[11px] text-zinc-500">
            L’annuaire public sera dispo quand ton pseudo Twitch sera validé.
          </p>
        )}
      </section>

      {/* Bloc actions */}
      <section
        className="rounded-2xl border p-[clamp(0.85rem,1.1vw,1.2rem)]"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">Actions rapides</p>
        <ul className="mt-3 grid grid-cols-1 gap-1.5">
          {quickActions.map((action) =>
            action.href ? (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-white"
                  style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}
                >
                  <span className="min-w-0 flex-1 truncate font-semibold">{action.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition group-hover:text-violet-200" aria-hidden />
                </Link>
              </li>
            ) : (
              <li
                key={action.label}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-zinc-500"
                style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{action.label}</span>
                {action.soon ? <span className="text-[10px] font-bold uppercase tracking-wider">Bientôt</span> : null}
              </li>
            ),
          )}
        </ul>
      </section>
    </aside>
  );
}
