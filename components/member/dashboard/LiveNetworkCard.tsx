"use client";

import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Link2,
  Loader2,
  LogIn,
  Radio,
  Twitch,
  Users2,
} from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";
import { useLiveStreamsSnapshot } from "@/components/member/hooks/useLiveStreamsSnapshot";

type LiveNetworkCardProps = {
  model: MemberDashboardModel;
};

export default function LiveNetworkCard({ model }: LiveNetworkCardProps) {
  const { accent } = model;
  const liveSnapshot = useLiveStreamsSnapshot();

  return (
    <section
      aria-labelledby="dashboard-network-title"
      className="rounded-3xl border p-5 md:p-6"
      style={{
        borderColor: "rgba(145,70,255,0.25)",
        background:
          "linear-gradient(150deg, rgba(145,70,255,0.12), rgba(15,17,22,0.92))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200/80">
            Lives & réseau Twitch
          </p>
          <h2
            id="dashboard-network-title"
            className="mt-1 text-xl font-bold md:text-2xl"
            style={{ color: "var(--color-text)" }}
          >
            La communauté vit aussi en live
          </h2>
        </div>
        <Twitch className="h-7 w-7 text-violet-300/80" aria-hidden />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-white/70">
        TENF, ce n&apos;est pas qu&apos;un tableau : c&apos;est surtout des chaînes Twitch
        qui se soutiennent. Voici un petit aperçu de ton réseau du moment.
      </p>

      {/* Mini snapshot des lives en cours — chargement différé non bloquant */}
      <div className="mt-3">
        <LiveSnapshotPill snapshot={liveSnapshot} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "rgba(145,70,255,0.32)",
            backgroundColor: "rgba(15,15,20,0.7)",
          }}
        >
          <NetworkState model={model} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/lives"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                backgroundColor: "rgba(145,70,255,0.95)",
                boxShadow: "0 10px 24px rgba(145,70,255,0.25)",
              }}
            >
              <Twitch className="h-4 w-4" aria-hidden />
              Voir les lives TENF
            </Link>
            <Link
              href="/membres"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                color: "var(--color-text)",
              }}
            >
              <Users2 className="h-4 w-4" aria-hidden />
              Explorer la communauté
            </Link>
          </div>
        </div>

        <ul
          className="grid gap-2 rounded-2xl border p-4 text-sm"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.03)",
            color: "rgba(236,236,239,0.78)",
          }}
        >
          <li className="flex items-start gap-2">
            <Heart
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: hexToRgba(accent, 0.95) }}
              aria-hidden
            />
            <span>
              Suivre les chaînes membres aide à matcher avec d&apos;autres streamers.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Heart
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: hexToRgba(accent, 0.95) }}
              aria-hidden
            />
            <span>Un passage rapide sur un live = un petit coup de pouce énorme.</span>
          </li>
          <li className="flex items-start gap-2">
            <Heart
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: hexToRgba(accent, 0.95) }}
              aria-hidden
            />
            <span>
              Pas de pression : prends ce qui te plaît dans le planning et passe ton chemin
              pour le reste.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function NetworkState({ model }: { model: MemberDashboardModel }) {
  const { network } = model;

  if (network.state === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement du score de soutien…
      </div>
    );
  }

  if (network.state === "not_authenticated") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          Connecte-toi pour voir ton score réseau
        </p>
        <p className="text-xs text-white/60">
          Une fois connecté·e, on calcule combien de chaînes membres tu suis sur Twitch.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-white"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Se connecter
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (network.state === "twitch_unlinked") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          Lie ta chaîne Twitch pour activer le score
        </p>
        <p className="text-xs text-white/60">
          Ça nous permet de savoir qui tu suis dans la communauté — rien de plus.
        </p>
        <Link
          href="/member/profil/completer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-white"
        >
          <Link2 className="h-4 w-4" aria-hidden />
          Lier Twitch
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">
        Score de soutien réseau
      </p>
      <p className="text-3xl font-black text-white tabular-nums">
        {network.score}
        <span className="text-base font-semibold text-white/45">%</span>
      </p>
      <p className="text-xs text-white/60">
        {network.followed} chaîne{network.followed > 1 ? "s" : ""} suivie
        {network.followed > 1 ? "s" : ""} sur {network.total} membres au total.
      </p>
    </div>
  );
}

function LiveSnapshotPill({
  snapshot,
}: {
  snapshot: ReturnType<typeof useLiveStreamsSnapshot>;
}) {
  // État de chargement / placeholder propre : on n'occupe pas l'espace si la donnée n'arrive jamais
  if (snapshot.state === "loading") {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.03)",
          color: "rgba(236,236,239,0.65)",
        }}
        aria-live="polite"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Recherche des lives en cours…
      </span>
    );
  }

  if (snapshot.state === "unavailable") {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.03)",
          color: "rgba(236,236,239,0.55)",
        }}
      >
        <Radio className="h-3.5 w-3.5" aria-hidden />
        Aperçu live indisponible pour l&apos;instant
      </span>
    );
  }

  const { liveCount } = snapshot;
  const tone = liveCount > 0 ? "rgba(239, 68, 68, 0.95)" : "rgba(255,255,255,0.45)";
  return (
    <Link
      href="/lives"
      className="group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      style={{
        borderColor:
          liveCount > 0 ? "rgba(239, 68, 68, 0.35)" : "rgba(255,255,255,0.12)",
        backgroundColor:
          liveCount > 0 ? "rgba(239, 68, 68, 0.10)" : "rgba(255,255,255,0.04)",
        color: liveCount > 0 ? "#fecaca" : "rgba(236,236,239,0.75)",
      }}
      aria-label={
        liveCount > 0
          ? `${liveCount} membre(s) actuellement en direct — voir les lives`
          : "Aucun membre en direct — voir les lives"
      }
    >
      <span
        className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
        aria-hidden
      >
        {liveCount > 0 ? (
          <>
            <span
              className="absolute inset-0 animate-ping rounded-full opacity-70"
              style={{ backgroundColor: tone }}
            />
            <span
              className="relative h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: tone }}
            />
          </>
        ) : (
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: tone }}
          />
        )}
      </span>
      {liveCount > 0 ? (
        <>
          {liveCount} membre{liveCount > 1 ? "s" : ""} en direct maintenant
        </>
      ) : (
        <>Aucun live en cours — viens animer Discord !</>
      )}
      <ArrowRight
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
