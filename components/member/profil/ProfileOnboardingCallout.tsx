"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function ProfileOnboardingCallout() {
  return (
    <section
      className="relative overflow-hidden rounded-[clamp(1rem,1.4vw,1.5rem)] border border-amber-500/30 px-[clamp(0.9rem,1.2vw,1.5rem)] py-[clamp(0.85rem,1.15vw,1.25rem)] shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.15), transparent 55%), linear-gradient(165deg, rgba(24,16,8,0.95), rgba(16,12,8,0.98))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-400/22 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/45 bg-amber-500/15 text-amber-200">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-pretty font-bold text-amber-50"
            style={{ fontSize: "clamp(1rem,1.15vw,1.15rem)" }}
          >
            Profil à finaliser
          </h3>
          <p
            className="mt-1.5 text-pretty leading-relaxed text-zinc-300"
            style={{ fontSize: "clamp(0.82rem,0.92vw,0.92rem)" }}
          >
            Bienvenue ! Complète ton profil pour que le staff puisse valider ta fiche après ton intégration.
            Chaque bloc rempli rapproche ton espace membre du « tout vert ».
          </p>
          <Link
            href="/member/profil/completer"
            className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
          >
            Compléter mon profil
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
