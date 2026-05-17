import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Heart, ShieldCheck, Users } from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

/**
 * Hero de la Charte — pleine largeur, fond avec orbes,
 * chips de réassurance + CTAs principaux.
 */
export default function Hero() {
  return (
    <section
      id="charte-hero"
      className="about-fade-up home-hero relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-10 lg:p-12 xl:p-14 scroll-mt-28"
    >
      <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="home-hero-orb home-hero-orb--tr pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl" />
      <div className="home-hero-orb home-hero-orb--bl pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl" />
      <div
        className="home-hero-shine pointer-events-none absolute -left-1/4 top-0 h-[120%] w-1/2 skew-x-[-18deg] opacity-40"
        aria-hidden
      />

      <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5 sm:space-y-7">
          <div className="flex flex-wrap items-center gap-2">
            <div className="home-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              Charte communautaire
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                color: "var(--color-text-secondary)",
                backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
              }}
            >
              <Clock className="h-3 w-3" aria-hidden />
              ≈ 6 min de lecture
            </span>
          </div>

          <h1 className="home-hero-title max-w-5xl text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-[4rem]">
            La charte de la New Family
          </h1>
          <p className="home-hero-lead max-w-3xl text-base font-semibold leading-relaxed sm:text-xl">
            Un cadre clair pour que l&apos;entraide reste humaine, respectueuse et utile à tout le monde — toi compris.
          </p>
          <p className="home-hero-body max-w-2xl text-sm leading-relaxed sm:text-base">
            Cette charte engage chaque membre : toi, les autres créateurs et créatrices, le staff. Elle est lue par tout le monde, et tout le monde a le droit de demander des comptes si une règle est ignorée. Pas de jargon, pas de pièges — juste ce qui fait tenir une vraie communauté.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn-primary group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
            >
              Rejoindre TENF
              <ArrowRight
                size={16}
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="#charte-sommaire"
              className="home-btn-secondary inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
            >
              <BookOpen size={16} className="shrink-0" aria-hidden />
              Voir le sommaire
            </Link>
            <Link
              href="/fonctionnement-tenf/comment-ca-marche"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-6 py-3.5 text-sm font-semibold transition hover:bg-white/5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Comprendre comment ça marche
            </Link>
          </div>
        </div>

        {/* Bloc latéral : 3 promesses clés pour rassurer */}
        <ul
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1"
          role="list"
          aria-label="Trois promesses de la charte"
        >
          <li>
            <article
              className="h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 25%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-card) 60%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
                  }}
                  aria-hidden
                >
                  <ShieldCheck
                    className="h-4 w-4"
                    strokeWidth={2.25}
                    style={{ color: "var(--color-primary)" }}
                  />
                </span>
                <h2 className="text-sm font-bold sm:text-base">Un cadre, pas un mur</h2>
              </div>
              <p
                className="mt-2 text-xs leading-snug sm:text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Tu sais à quoi t&apos;attendre dès l&apos;arrivée, et ce que la communauté attend de toi.
              </p>
            </article>
          </li>
          <li>
            <article
              className="h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
              style={{
                borderColor: "color-mix(in srgb, #22c55e 25%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-card) 60%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "color-mix(in srgb, #22c55e 22%, transparent)" }}
                  aria-hidden
                >
                  <Heart className="h-4 w-4" strokeWidth={2.25} style={{ color: "#22c55e" }} />
                </span>
                <h2 className="text-sm font-bold sm:text-base">Ton rythme respecté</h2>
              </div>
              <p
                className="mt-2 text-xs leading-snug sm:text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Pauses, baisses de motivation, contraintes de vie : la charte prévoit tout ça avec bienveillance.
              </p>
            </article>
          </li>
          <li>
            <article
              className="h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
              style={{
                borderColor: "color-mix(in srgb, #38bdf8 25%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-card) 60%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "color-mix(in srgb, #38bdf8 22%, transparent)" }}
                  aria-hidden
                >
                  <Users className="h-4 w-4" strokeWidth={2.25} style={{ color: "#38bdf8" }} />
                </span>
                <h2 className="text-sm font-bold sm:text-base">Tes droits garantis</h2>
              </div>
              <p
                className="mt-2 text-xs leading-snug sm:text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Avant les devoirs, il y a les droits : poser des questions, faire une pause, être respecté·e.
              </p>
            </article>
          </li>
        </ul>
      </div>
    </section>
  );
}
