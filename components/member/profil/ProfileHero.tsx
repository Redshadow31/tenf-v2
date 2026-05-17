"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, LayoutDashboard, Radio, Sparkles, UserCircle2 } from "lucide-react";
import StatusBadge from "@/components/member/ui/StatusBadge";
import ProfileCompletionRing from "@/components/member/profil/ProfileCompletionRing";

type StatusTone = "success" | "warning" | "neutral";

type ProfileHeroProps = {
  avatar: string;
  displayName: string;
  twitchLogin: string;
  role: string;
  profilePercent: number;
  vipLabel: string;
  vipActive: boolean;
  validationLabel: string;
  validationTone: StatusTone;
  integrationDone: boolean;
  upcomingLives: number;
  hasPublicProfileLink: boolean;
  publicProfileHref: string;
  livePlanningHref: string;
};

export default function ProfileHero({
  avatar,
  displayName,
  twitchLogin,
  role,
  profilePercent,
  vipLabel,
  vipActive,
  validationLabel,
  validationTone,
  integrationDone,
  upcomingLives,
  hasPublicProfileLink,
  publicProfileHref,
  livePlanningHref,
}: ProfileHeroProps) {
  return (
    <section
      id="profil-resume"
      className="relative scroll-mt-[clamp(4rem,9vw,7.5rem)] overflow-hidden rounded-[clamp(1rem,1.6vw,1.75rem)] border shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      style={{
        borderColor: "rgba(145,70,255,0.32)",
        background:
          "radial-gradient(ellipse 90% 80% at 10% -30%, rgba(145,70,255,0.28), transparent 52%), radial-gradient(ellipse 70% 50% at 95% 10%, rgba(236,72,153,0.14), transparent 45%), linear-gradient(165deg, rgba(24,26,38,0.95), rgba(10,11,18,0.98))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-6 h-[clamp(10rem,18vw,18rem)] w-[clamp(10rem,18vw,18rem)] rounded-full opacity-45 blur-3xl"
        style={{ background: "rgba(139,92,246,0.32)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -bottom-16 h-[clamp(9rem,16vw,16rem)] w-[clamp(9rem,16vw,16rem)] rounded-full opacity-35 blur-3xl"
        style={{ background: "rgba(244,114,182,0.22)" }}
      />

      <div className="relative px-[clamp(0.85rem,1.2vw,1.5rem)] py-[clamp(0.85rem,1.15vw,1.35rem)]">
        <div className="grid items-center gap-[clamp(0.75rem,1.1vw,1.25rem)] lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
          <div className="flex min-w-0 items-center gap-[clamp(0.75rem,1vw,1.15rem)]">
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute -inset-1 rounded-[1.25rem] opacity-95 blur-sm"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.55), rgba(244,114,182,0.4))" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt=""
                className="relative rounded-2xl border-2 border-white/20 object-cover shadow-xl"
                style={{ width: "clamp(4rem,6.5vw,5.75rem)", height: "clamp(4rem,6.5vw,5.75rem)" }}
              />
            </div>

            <ProfileCompletionRing percent={profilePercent} sizeEm={5.25} />

            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200">
                <Sparkles className="h-3 w-3" aria-hidden />
                Membre TENF
              </p>
              <h1
                className="mt-1.5 text-balance font-black tracking-tight text-white"
                style={{ fontSize: "clamp(1.15rem,1.55vw,1.7rem)", lineHeight: 1.1 }}
              >
                {displayName}
              </h1>
              <p
                className="mt-0.5 text-pretty font-medium text-zinc-400"
                style={{ fontSize: "clamp(0.75rem,0.85vw,0.88rem)" }}
              >
                @{twitchLogin}
                <span className="px-1 text-zinc-600">·</span>
                <span className="text-zinc-300">{role}</span>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[clamp(0.68rem,0.76vw,0.76rem)]">
                <StatusBadge label={vipLabel} tone={vipActive ? "success" : "neutral"} />
                <StatusBadge label={validationLabel} tone={validationTone} />
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/25 px-2 py-0.5 font-medium text-zinc-300">
                  <LayoutDashboard className="h-3 w-3 text-violet-300" aria-hidden />
                  Intégration {integrationDone ? "faite" : "à planifier"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/25 px-2 py-0.5 font-medium text-zinc-300">
                  <Radio className="h-3 w-3 text-sky-300" aria-hidden />
                  {upcomingLives} live{upcomingLives > 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/25 px-2 py-0.5 font-medium text-zinc-300">
                  <UserCircle2 className="h-3 w-3 text-emerald-300" aria-hidden />
                  {profilePercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1.5">
            <Link
              href="/member/profil/completer"
              className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-center font-bold text-white shadow-md shadow-violet-950/40 transition hover:brightness-110"
              style={{ fontSize: "clamp(0.76rem,0.85vw,0.85rem)" }}
            >
              Compléter
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              href={livePlanningHref}
              className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 font-semibold text-zinc-100 transition hover:border-violet-400/35 hover:bg-violet-500/10"
              style={{ fontSize: "clamp(0.74rem,0.82vw,0.82rem)" }}
            >
              <CalendarDays className="h-3.5 w-3.5 text-violet-300" aria-hidden />
              Planning
            </Link>
            {hasPublicProfileLink ? (
              <Link
                href={publicProfileHref}
                className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 font-semibold text-zinc-100 transition hover:border-emerald-400/35 hover:bg-emerald-500/10"
                style={{ fontSize: "clamp(0.74rem,0.82vw,0.82rem)" }}
              >
                <ExternalLink className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                Fiche publique
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
